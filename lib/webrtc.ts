// ============================================
// WebRTC Service for Azure GPT Realtime Voice
// CONTROLLED ORCHESTRATION - Manual turn management
// ============================================

import { WebRTCMessage } from './types';

export interface NegotiateResult {
  sdp?: string;
  error?: string;
}

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
  private isProcessing: boolean = false;

  async connect(voice: string = 'verse', initialInstruction: string = ''): Promise<void> {
    if (!isBrowser) {
      throw new Error('WebRTC is only available in browser environment');
    }

    if (this.peerConnection) {
      console.warn('[WebRTC] Already connected');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      this.peerConnection = new RTCPeerConnection();

      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;

      this.peerConnection.ontrack = (event) => {
        if (event.streams.length > 0 && this.audioElement) {
          this.audioElement.srcObject = event.streams[0];
        }
      };

      const audioTrack = this.localStream.getAudioTracks()[0];
      this.peerConnection.addTrack(audioTrack, this.localStream);

      this.dataChannel = this.peerConnection.createDataChannel('oai-events');

      this.dataChannel.onopen = () => {
        console.log('[WebRTC] Data channel opened');
        this.notifyConnectionHandlers(true);
        this.notifyMessageHandlers({ type: 'connected', timestamp: Date.now() });
        
        // Trigger the initial greeting after connection
        setTimeout(() => {
          this.triggerResponse();
        }, 500);
      };

      this.dataChannel.onmessage = (event) => this.handleDataChannelMessage(event);

      this.dataChannel.onerror = (error) => {
        console.error('[WebRTC] Data channel error:', error);
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('[WebRTC] Connection state:', state);
        
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          this.disconnect();
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      const result = await this.negotiateSdp(voice, offer.sdp!, initialInstruction);

      if (result.error) {
        throw new Error(result.error);
      }

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

  private handleDataChannelMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'response.done':
          this.isProcessing = false;
          console.log('[WebRTC] Response complete');
          break;
          
        case 'response.audio_transcript.done':
          this.notifyMessageHandlers({
            type: 'transcript',
            role: 'model',
            content: data.transcript,
            timestamp: Date.now(),
          });
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          this.notifyMessageHandlers({
            type: 'transcript',
            role: 'user',
            content: data.transcript,
            timestamp: Date.now(),
          });
          break;
          
        case 'error':
          this.isProcessing = false;
          console.error('[WebRTC] Server error:', data.error);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error parsing message:', error);
    }
  }

  private async negotiateSdp(voice: string, sdp: string, initialInstruction: string): Promise<NegotiateResult> {
    try {
      const response = await fetch('/api/session/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice, sdp, initialInstruction }),
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

  // Trigger the AI to respond (for initial greeting)
  triggerResponse(): void {
    if (this.dataChannel?.readyState !== 'open') {
      console.log('[WebRTC] Data channel not ready');
      return;
    }
    
    if (this.isProcessing) {
      console.log('[WebRTC] Already processing');
      return;
    }
    
    this.isProcessing = true;
    this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
    console.log('[WebRTC] Triggered response');
  }

  // Speak a specific instruction (used by PathRAG)
  speakInstruction(instruction: string): void {
    if (this.dataChannel?.readyState !== 'open') {
      console.log('[WebRTC] Data channel not ready');
      return;
    }
    
    if (this.isProcessing) {
      console.log('[WebRTC] Already processing, queuing...');
      setTimeout(() => this.speakInstruction(instruction), 1000);
      return;
    }
    
    this.isProcessing = true;
    
    // Update session with new instruction
    const updateMessage = {
      type: 'session.update',
      session: {
        instructions: `You are Akili. Your ONLY job is to speak exactly what you're told.
        
SAY: "${instruction}"

Speak this EXACTLY. No greetings. No extras. Just these words.`
      }
    };
    this.dataChannel.send(JSON.stringify(updateMessage));
    
    // Trigger response
    setTimeout(() => {
      this.dataChannel?.send(JSON.stringify({ type: 'response.create' }));
      console.log('[WebRTC] Speaking instruction:', instruction);
    }, 100);
  }

  // Commit user audio and trigger response (for manual VAD)
  commitAudioAndRespond(instruction: string): void {
    if (this.dataChannel?.readyState !== 'open') {
      return;
    }
    
    // Commit any pending audio
    this.dataChannel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    
    // Then speak the instruction
    setTimeout(() => {
      this.speakInstruction(instruction);
    }, 200);
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
    this.isProcessing = false;
  }

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

  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected' && 
           this.dataChannel?.readyState === 'open';
  }
}

export const webrtcService = new WebRTCService();
