// ============================================
// WebRTC Service for Azure GPT Realtime Voice
// FUNCTION CALLING - Solid workflow control
// ============================================

import { WebRTCMessage } from './types';

export interface NegotiateResult {
  sdp?: string;
  error?: string;
}

// Function call handler type
type FunctionCallHandler = (name: string, args: Record<string, unknown>) => void;

const isBrowser = typeof window !== 'undefined';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private localStream: MediaStream | null = null;
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private messageHandlers: ((message: WebRTCMessage) => void)[] = [];
  private functionCallHandlers: FunctionCallHandler[] = [];
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isProcessing: boolean = false;
  private currentCallId: string | null = null;

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
          // Filter out empty AI responses
          const aiTranscript = (data.transcript || '').trim();
          if (aiTranscript.length > 0) {
            console.log('[WebRTC] AI said:', aiTranscript);
            this.notifyMessageHandlers({
              type: 'transcript',
              role: 'model',
              content: aiTranscript,
              timestamp: Date.now(),
            });
          }
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          // Filter out empty or whitespace-only transcripts
          const userTranscript = (data.transcript || '').trim();
          if (userTranscript.length > 0) {
            console.log('[WebRTC] User said:', userTranscript);
            this.notifyMessageHandlers({
              type: 'transcript',
              role: 'user',
              content: userTranscript,
              timestamp: Date.now(),
            });
          } else {
            console.log('[WebRTC] Ignoring empty user transcript');
          }
          break;
        
        // Handle function calls from the AI
        case 'response.function_call_arguments.done':
          console.log('[WebRTC] Function call:', data.name, data.arguments);
          this.currentCallId = data.call_id;
          try {
            const args = JSON.parse(data.arguments || '{}');
            this.notifyFunctionCallHandlers(data.name, args);
          } catch (e) {
            console.error('[WebRTC] Error parsing function args:', e);
          }
          break;
          
        case 'error':
          this.isProcessing = false;
          console.error('[WebRTC] Server error:', data.error);
          break;
          
        default:
          // Log other events for debugging
          if (data.type?.includes('function')) {
            console.log('[WebRTC] Function event:', data.type);
          }
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error parsing message:', error);
    }
  }

  // Send function result back to the AI
  sendFunctionResult(result: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.log('[WebRTC] Data channel not ready for function result');
      return;
    }

    if (!this.currentCallId) {
      console.log('[WebRTC] No current call ID for function result');
      return;
    }

    // Send the function output
    const outputMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: this.currentCallId,
        output: result
      }
    };
    this.dataChannel.send(JSON.stringify(outputMessage));
    console.log('[WebRTC] Sent function result:', result);

    this.currentCallId = null;
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

  // Trigger the AI to respond
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

  // Update AI context with PathRAG node instruction and trigger response
  updateContext(nodeInstruction: string): void {
    if (this.dataChannel?.readyState !== 'open') {
      console.log('[WebRTC] Data channel not ready');
      return;
    }
    
    // Cancel any in-progress response first
    if (this.isProcessing) {
      console.log('[WebRTC] Canceling previous response');
      try {
        this.dataChannel.send(JSON.stringify({ type: 'response.cancel' }));
      } catch (e) {
        // Ignore cancel errors
      }
      // Small delay after cancel
      setTimeout(() => this.sendInstruction(nodeInstruction), 200);
      return;
    }
    
    this.sendInstruction(nodeInstruction);
  }

  private sendInstruction(nodeInstruction: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
    
    this.isProcessing = true;
    
    // Update session with STRICT script-reading instructions
    const updateMessage = {
      type: 'session.update',
      session: {
        instructions: `You are Akili. Read this script aloud, then STOP and WAIT.

=== SCRIPT TO READ ===
"${nodeInstruction}"

=== RULES ===
- Say ONLY the script above (you can rephrase slightly)
- Do NOT add your own advice or diagnosis
- Do NOT suggest solutions
- Do NOT ask extra questions
- ENGLISH ONLY
- After speaking, call step_complete() and WAIT silently`,
        temperature: 0.6,  // Azure minimum
        max_response_output_tokens: 300
      }
    };
    this.dataChannel.send(JSON.stringify(updateMessage));
    console.log('[WebRTC] Updated instruction:', nodeInstruction.substring(0, 50));
    
    // Trigger response after update processes
    setTimeout(() => {
      if (this.dataChannel?.readyState === 'open') {
        this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
        console.log('[WebRTC] Triggered response');
      }
    }, 150);
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
    this.currentCallId = null;
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

  // Subscribe to function calls from the AI
  onFunctionCall(handler: FunctionCallHandler): () => void {
    this.functionCallHandlers.push(handler);
    return () => {
      this.functionCallHandlers = this.functionCallHandlers.filter(h => h !== handler);
    };
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private notifyMessageHandlers(message: WebRTCMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyFunctionCallHandlers(name: string, args: Record<string, unknown>): void {
    this.functionCallHandlers.forEach(handler => handler(name, args));
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
