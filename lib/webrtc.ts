// ============================================
// WebRTC Service for Azure GPT Realtime Voice
// PathRAG Voice Communication Layer
// ============================================

import { WebRTCMessage } from './types';

export interface NegotiateResult {
  sdp?: string;
  error?: string;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private localStream: MediaStream | null = null;
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private messageHandlers: ((message: WebRTCMessage) => void)[] = [];
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isResponseInProgress: boolean = false;

  async connect(voice: string = 'verse', nodeContext: string = ''): Promise<void> {
    // Ensure we're in a browser environment
    if (!isBrowser) {
      throw new Error('WebRTC is only available in browser environment');
    }

    if (this.peerConnection) {
      console.warn('[WebRTC] Already connected');
      return;
    }

    // Check for mediaDevices support (requires secure context: HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isSecureContext = window.isSecureContext;
      if (!isSecureContext) {
        throw new Error('Microphone access requires a secure connection. Please access this app via https:// or http://localhost:3000');
      }
      throw new Error('Your browser does not support microphone access. Please use Chrome, Firefox, or Edge.');
    }

    try {
      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create peer connection (no iceServers needed for Azure Realtime)
      this.peerConnection = new RTCPeerConnection();

      // Create audio element for playback
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;

      // Handle incoming audio tracks (matches working param_demo)
      this.peerConnection.ontrack = (event) => {
        if (event.streams.length > 0 && this.audioElement) {
          this.audioElement.srcObject = event.streams[0];
        }
      };

      // Add local audio track
      const audioTrack = this.localStream.getAudioTracks()[0];
      this.peerConnection.addTrack(audioTrack, this.localStream);

      // Create data channel for events
      this.dataChannel = this.peerConnection.createDataChannel('oai-events');
      this.setupDataChannel();

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('[WebRTC] Connection state:', state);
        
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          this.disconnect();
        }
      };

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Negotiate via backend
      const result = await this.negotiateSdp(voice, offer.sdp!, nodeContext);

      if (result.error) {
        throw new Error(result.error);
      }

      // Set remote description
      await this.peerConnection.setRemoteDescription({ 
        type: 'answer', 
        sdp: result.sdp! 
      });

    } catch (error: unknown) {
      console.error('[WebRTC] Connection error:', error);
      this.cleanup();
      throw error;
    }
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[WebRTC] Data channel opened');
      this.notifyConnectionHandlers(true);
      this.notifyMessageHandlers({ type: 'connected', timestamp: Date.now() });
    };

    this.dataChannel.onclose = () => {
      console.log('[WebRTC] Data channel closed');
      this.notifyConnectionHandlers(false);
    };

    this.dataChannel.onmessage = (event) => this.handleDataChannelMessage(event);

    this.dataChannel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error);
    };
  }

  private handleDataChannelMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        // Response lifecycle - track to prevent overlapping responses
        case 'response.created':
          this.isResponseInProgress = true;
          break;
          
        case 'response.done':
          this.isResponseInProgress = false;
          break;
          
        // Model transcript (AI finished speaking a segment)
        case 'response.audio_transcript.done':
          this.notifyMessageHandlers({
            type: 'transcript',
            role: 'model',
            content: data.transcript,
            timestamp: Date.now(),
          });
          break;
          
        // User transcript (user finished speaking)
        case 'conversation.item.input_audio_transcription.completed':
          this.notifyMessageHandlers({
            type: 'transcript',
            role: 'user',
            content: data.transcript,
            timestamp: Date.now(),
          });
          break;
          
        // Error handling
        case 'error':
          this.isResponseInProgress = false;
          this.notifyMessageHandlers({
            type: 'error',
            error: data.error?.message || 'An error occurred',
            timestamp: Date.now(),
          });
          break;
          
        // Silently ignore other message types (don't log spam)
        default:
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error parsing message:', error);
    }
  }

  private async negotiateSdp(voice: string, sdp: string, nodeContext: string): Promise<NegotiateResult> {
    try {
      const response = await fetch('/api/session/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice, sdp, nodeContext }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: `Backend error: ${errorText}` };
      }

      const result = await response.json();
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return { error: errorMessage };
    }
  }

  // Advance to a new PathRAG node - updates context AND triggers AI to speak
  advanceToNode(nodeContext: string, voiceInstruction: string): void {
    if (this.dataChannel?.readyState === 'open') {
      // 0. Cancel any in-progress response to prevent overlap
      if (this.isResponseInProgress) {
        this.dataChannel.send(JSON.stringify({ type: 'response.cancel' }));
        this.isResponseInProgress = false;
      }
      
      // 1. Update session instructions with new PathRAG context
      const updateMessage = {
        type: 'session.update',
        session: {
          instructions: nodeContext
        }
      };
      this.dataChannel.send(JSON.stringify(updateMessage));
      
      // 2. Inject system message with exact instruction to speak
      const systemMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [{ 
            type: 'input_text', 
            text: `[NEXT STEP] Speak this instruction to the user: "${voiceInstruction}"`
          }]
        }
      };
      this.dataChannel.send(JSON.stringify(systemMessage));
      
      // 3. Trigger response
      this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  // Trigger initial response (uses session instructions set during connect)
  triggerResponse(): void {
    if (this.dataChannel?.readyState === 'open') {
      if (this.isResponseInProgress) {
        console.log('[WebRTC] Response in progress, skipping');
        return;
      }
      this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
    }
  }


  disconnect(): void {
    this.cleanup();
    this.notifyConnectionHandlers(false);
    this.notifyMessageHandlers({ type: 'disconnected', timestamp: Date.now() });
  }

  private cleanup(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    
    this.analyser = null;
    this.isResponseInProgress = false;
  }

  // Event subscription methods
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  onMessage(handler: (message: WebRTCMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private notifyMessageHandlers(message: WebRTCMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  // Get audio analyser for visualization
  getAnalyser(): AnalyserNode | null {
    if (!isBrowser) return null;
    
    if (!this.peerConnection || !this.audioElement || !this.audioElement.srcObject) {
      return null;
    }

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.audioCtx = new AudioContextClass();
    }

    if (!this.analyser) {
      const stream = this.audioElement.srcObject as MediaStream;
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
    }

    return this.analyser;
  }

  // Check if connected
  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected' && 
           this.dataChannel?.readyState === 'open';
  }
}

// Create singleton instance - safe for SSR as methods check for browser
export const webrtcService = new WebRTCService();
