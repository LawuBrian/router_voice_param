'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import PhaseTracker from '@/components/PhaseTracker';
import DiagnosticPanel from '@/components/DiagnosticPanel';
import AssetViewer from '@/components/AssetViewer';
import Transcript from '@/components/Transcript';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import { webrtcService } from '@/lib/webrtc';
import { WebRTCMessage } from '@/lib/types';
import { VOICE_OPTIONS } from '@/lib/constants';
import { 
  DiagnosticNode, 
  DiagnosticPhase, 
  RouterAsset, 
  TranscriptEntry, 
  VoiceName
} from '@/lib/types';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  RefreshCw,
  Volume2
} from 'lucide-react';

export default function Home() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<VoiceName>(VoiceName.Verse);
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentNode, setCurrentNode] = useState<DiagnosticNode | null>(null);
  const [currentAssets, setCurrentAssets] = useState<RouterAsset[]>([]);
  const [currentPhase, setCurrentPhase] = useState<DiagnosticPhase>(DiagnosticPhase.ENTRY);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'active' | 'resolved' | 'escalated' | 'abandoned'>('active');
  
  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Create a new PathRAG session
  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/pathrag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      
      const data = await response.json();
      setSessionId(data.session_id);
      setCurrentNode(data.current_node);
      setCurrentAssets(data.assets || []);
      setCurrentPhase(data.phase);
      setProgress(data.progress);
      
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, []);

  // Process user response through PathRAG (just update state, don't trigger AI)
  const processResponse = useCallback(async (response: string) => {
    if (!sessionId) return;
    
    try {
      const result = await fetch('/api/pathrag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'process', 
          sessionId, 
          response 
        }),
      });
      
      if (!result.ok) throw new Error('Failed to process response');
      
      const data = await result.json();
      setCurrentNode(data.current_node);
      setCurrentAssets(data.assets || []);
      setCurrentPhase(data.phase);
      setProgress(data.progress);
      setStatus(data.status);
      
      // NOTE: We do NOT manually trigger the AI to speak
      // The AI responds naturally based on its conversation context
      
      return data;
    } catch (error) {
      console.error('Error processing response:', error);
    }
  }, [sessionId]);

  // Handle WebRTC messages
  useEffect(() => {
    const handleMessage = async (msg: WebRTCMessage) => {
      if (msg.type === 'transcript' && msg.content) {
        // Add to transcript
        setTranscript(prev => [...prev, {
          role: msg.role || 'user',
          text: msg.content!,
          timestamp: msg.timestamp,
          node_id: currentNode?.node_id,
        }]);

        // If it's a user message, process through PathRAG to update UI state
        if (msg.role === 'user') {
          await processResponse(msg.content);
        }
      } else if (msg.type === 'speech_started') {
        setIsSpeaking(true);
      } else if (msg.type === 'speech_stopped') {
        setIsSpeaking(false);
      } else if (msg.type === 'error') {
        console.error('WebRTC error:', msg.error);
        setTranscript(prev => [...prev, {
          role: 'system',
          text: `Error: ${msg.error}`,
          timestamp: msg.timestamp,
        }]);
      }
    };

    const unsubConnection = webrtcService.onConnectionChange(setIsConnected);
    const unsubMessage = webrtcService.onMessage(handleMessage);

    return () => {
      unsubConnection();
      unsubMessage();
    };
  }, [processResponse, currentNode]);

  // Start voice session
  const startSession = async () => {
    setIsConnecting(true);
    
    try {
      // Create PathRAG diagnostic session first
      const session = await createSession();
      
      // Store the initial node
      setCurrentNode(session.current_node);
      setCurrentAssets(session.assets || []);
      setCurrentPhase(session.phase);
      setProgress(session.progress);
      
      // Connect voice with PathRAG context
      // The system prompt includes the initial instruction
      // The AI will start speaking automatically
      await webrtcService.connect(currentVoice, session.voice_context);
      
      // Add initial system message
      setTranscript([{
        role: 'system',
        text: 'Voice session started. Akili is connecting...',
        timestamp: Date.now(),
      }]);
      
      // NOTE: No manual trigger needed - AI starts automatically
      
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start voice session. Please check microphone permissions.');
    } finally {
      setIsConnecting(false);
    }
  };

  // End voice session
  const endSession = () => {
    webrtcService.disconnect();
    setSessionId(null);
    setCurrentNode(null);
    setCurrentAssets([]);
    setCurrentPhase(DiagnosticPhase.ENTRY);
    setProgress(0);
    setStatus('active');
    setTranscript([]);
  };

  // Handle quick response from diagnostic panel (button clicks)
  const handleQuickResponse = async (response: string) => {
    // Add to transcript
    setTranscript(prev => [...prev, {
      role: 'user',
      text: response,
      timestamp: Date.now(),
      node_id: currentNode?.node_id,
    }]);
    
    // Process through PathRAG to update UI state
    await processResponse(response);
    
    // NOTE: The AI will respond naturally to the conversation
    // We don't need to manually trigger it
  };

  // Restart session
  const restartSession = () => {
    endSession();
    setTimeout(() => startSession(), 500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1800px] mx-auto w-full">
        {/* Left Column - Controls & Progress */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          {/* Voice Control Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pathrag-surface border border-pathrag-border rounded-xl p-5"
          >
            <h3 className="text-xs font-bold text-pathrag-text-muted uppercase tracking-widest mb-4">
              Voice Controls
            </h3>
            
            {/* Voice Selection */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-bold text-pathrag-text-muted uppercase tracking-widest">
                Voice
              </label>
              <select
                value={currentVoice}
                onChange={(e) => setCurrentVoice(e.target.value as VoiceName)}
                disabled={isConnected || isConnecting}
                className="w-full bg-pathrag-bg border border-pathrag-border rounded-lg px-3 py-2.5 text-sm text-pathrag-text outline-none focus:border-pathrag-accent transition-colors disabled:opacity-50"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} - {v.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Buttons */}
            <div className="space-y-2">
              {!isConnected ? (
                <button
                  onClick={startSession}
                  disabled={isConnecting}
                  className={`
                    w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                    transition-all shadow-lg
                    ${isConnecting
                      ? 'bg-pathrag-surface-alt text-pathrag-text-muted'
                      : 'bg-gradient-to-r from-pathrag-accent to-pathrag-accent-glow text-pathrag-bg hover:shadow-pathrag-accent/30 hover:shadow-xl'
                    }
                    disabled:opacity-50
                  `}
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      Start Voice Diagnosis
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={endSession}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-pathrag-danger text-white hover:bg-pathrag-danger/80 transition-all"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Session
                  </button>
                  <button
                    onClick={restartSession}
                    className="w-full py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 bg-pathrag-surface-alt text-pathrag-text hover:bg-pathrag-border transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restart
                  </button>
                </>
              )}
            </div>

            {/* Connection Status */}
            <div className="mt-4 pt-4 border-t border-pathrag-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Mic className="w-4 h-4 text-pathrag-accent" />
                  ) : (
                    <MicOff className="w-4 h-4 text-pathrag-text-muted" />
                  )}
                  <span className="text-xs text-pathrag-text-muted">
                    {isConnected ? 'Microphone Active' : 'Microphone Off'}
                  </span>
                </div>
                {isConnected && (
                  <Volume2 className="w-4 h-4 text-pathrag-accent animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Phase Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PhaseTracker
              currentPhase={currentPhase}
              progress={progress}
              status={status}
            />
          </motion.div>
        </div>

        {/* Center Column - Main Interaction */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Voice Visualizer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-32 rounded-xl overflow-hidden border border-pathrag-border"
          >
            <VoiceVisualizer
              isActive={isConnected}
              analyser={webrtcService.getAnalyser()}
              isSpeaking={isSpeaking}
            />
          </motion.div>

          {/* Diagnostic Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DiagnosticPanel
              currentNode={currentNode}
              isConnected={isConnected}
              onQuickResponse={handleQuickResponse}
            />
          </motion.div>

          {/* Asset Viewer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AssetViewer
              assets={currentAssets}
              nodeId={currentNode?.node_id || ''}
            />
          </motion.div>
        </div>

        {/* Right Column - Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full lg:w-96 bg-pathrag-surface border border-pathrag-border rounded-xl flex flex-col min-h-[400px] lg:min-h-0 lg:h-auto shrink-0"
        >
          <div className="px-4 py-3 border-b border-pathrag-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-pathrag-text-muted uppercase tracking-widest">
              Conversation
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-pathrag-accent animate-pulse' : 'bg-pathrag-danger'}`} />
              <span className="text-[10px] text-pathrag-text-muted uppercase tracking-wider">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Transcript entries={transcript} />
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 bg-pathrag-surface/50 border-t border-pathrag-border">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <p className="text-[10px] text-pathrag-text-muted uppercase tracking-widest">
            Akili • Voice Router Diagnosis System
          </p>
          <p className="text-[10px] text-pathrag-text-muted">
            Powered by Azure GPT Realtime
          </p>
        </div>
      </footer>
    </div>
  );
}
