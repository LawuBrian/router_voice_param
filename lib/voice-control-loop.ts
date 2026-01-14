// ============================================
// Voice Control Loop
// The REAL architecture for voice AI
// ============================================
// 
// This implements the pattern:
// STATE → SPEAK → LISTEN → FILTER → ADVANCE
//
// The LLM is just ONE component. This controls:
// - When listening starts/ends
// - What input is valid
// - When to advance vs re-prompt
// ============================================

import { DiagnosticNode } from './types';

// Expectation Window - defines what we're listening for
export interface ExpectationWindow {
  slot: string;                    // What field we're filling
  allowedValues: string[];         // Valid answers
  timeout: number;                 // Max wait time (ms)
  noiseThreshold: 'low' | 'medium' | 'high';  // How strict
  retries: number;                 // Attempts before escalation
}

// Voice State Machine states
export type VoiceState = 
  | 'idle'           // Not active
  | 'speaking'       // AI is speaking
  | 'listening'      // Waiting for valid input
  | 'processing'     // Validating input
  | 'advancing'      // Moving to next node
  | 'reprompting';   // Input invalid, asking again

// Control Loop State
export interface ControlLoopState {
  currentNode: DiagnosticNode | null;
  voiceState: VoiceState;
  expectation: ExpectationWindow | null;
  retryCount: number;
  lastValidInput: string | null;
}

// Build expectation window from a diagnostic node
export function buildExpectationWindow(node: DiagnosticNode): ExpectationWindow {
  const allowedValues = Object.keys(node.expected_answers || {});
  
  return {
    slot: node.node_id,
    allowedValues,
    timeout: 10000,  // 10 seconds default
    noiseThreshold: 'medium',
    retries: 3,
  };
}

// Check if ASR output matches expectation
export function validateInput(
  transcript: string, 
  expectation: ExpectationWindow
): { valid: boolean; matchedValue: string | null } {
  const normalized = transcript.toLowerCase().trim();
  
  // Empty or very short = ignore (likely noise)
  if (normalized.length < 2) {
    return { valid: false, matchedValue: null };
  }
  
  // First check if it's a valid expected answer (before noise check)
  // This ensures "ok" is accepted when it's in the expected answers
  for (const allowed of expectation.allowedValues) {
    const normalizedAllowed = allowed.toLowerCase();
    if (normalized === normalizedAllowed || normalized.includes(normalizedAllowed)) {
      return { valid: true, matchedValue: allowed };
    }
  }
  
  // Common noise patterns to ignore (only if not a valid answer)
  const noisePatterns = [
    /^(uh+|um+|hmm+|ah+)$/i,
    /^\[.*\]$/,      // [inaudible], [noise], etc.
  ];
  
  for (const pattern of noisePatterns) {
    if (pattern.test(normalized)) {
      return { valid: false, matchedValue: null };
    }
  }
  
  // Check if any allowed value is contained in the transcript
  // (for natural speech like "it's TP-Link" or "yes I am ready")
  for (const allowed of expectation.allowedValues) {
    const normalizedAllowed = allowed.toLowerCase();
    if (normalizedAllowed.includes(normalized) && normalized.length >= 2) {
      return { valid: true, matchedValue: allowed };
    }
  }
  
  // No match found - but it's real speech, not noise
  // This could be a valid answer not in our list (pass through to PathRAG)
  return { valid: true, matchedValue: transcript };
}

// Determine if input should be completely ignored (noise)
export function isNoise(transcript: string): boolean {
  const normalized = transcript.toLowerCase().trim();
  
  // Too short
  if (normalized.length < 2) return true;
  
  // Pure filler sounds
  if (/^(uh+|um+|hmm+|ah+|eh+|oh+)$/i.test(normalized)) return true;
  
  // Coughs, laughs, etc
  if (/^(\[.*\]|cough|laugh|sigh)$/i.test(normalized)) return true;
  
  return false;
}

// Control Loop class
export class VoiceControlLoop {
  private state: ControlLoopState;
  private onStateChange: (state: ControlLoopState) => void;
  private onSpeak: (instruction: string) => void;
  private onAdvance: (nodeId: string) => void;
  
  constructor(options: {
    onStateChange: (state: ControlLoopState) => void;
    onSpeak: (instruction: string) => void;
    onAdvance: (nodeId: string) => void;
  }) {
    this.state = {
      currentNode: null,
      voiceState: 'idle',
      expectation: null,
      retryCount: 0,
      lastValidInput: null,
    };
    this.onStateChange = options.onStateChange;
    this.onSpeak = options.onSpeak;
    this.onAdvance = options.onAdvance;
  }
  
  // Set current diagnostic node
  setNode(node: DiagnosticNode): void {
    this.state = {
      ...this.state,
      currentNode: node,
      expectation: buildExpectationWindow(node),
      retryCount: 0,
      voiceState: 'speaking',
    };
    this.onStateChange(this.state);
    
    // Trigger speech
    this.onSpeak(node.voice_instruction);
  }
  
  // Called when AI finishes speaking
  onSpeechComplete(): void {
    this.state = {
      ...this.state,
      voiceState: 'listening',
    };
    this.onStateChange(this.state);
  }
  
  // Process user input (from ASR)
  processInput(transcript: string): void {
    // Ignore if not listening
    if (this.state.voiceState !== 'listening') {
      console.log('[ControlLoop] Ignoring input - not in listening state');
      return;
    }
    
    // Check for noise
    if (isNoise(transcript)) {
      console.log('[ControlLoop] Ignoring noise:', transcript);
      return;
    }
    
    this.state.voiceState = 'processing';
    this.onStateChange(this.state);
    
    // Validate against expectation
    const result = validateInput(transcript, this.state.expectation!);
    
    if (result.valid && result.matchedValue) {
      // Valid input - advance
      console.log('[ControlLoop] Valid input:', result.matchedValue);
      this.state = {
        ...this.state,
        voiceState: 'advancing',
        lastValidInput: result.matchedValue,
        retryCount: 0,
      };
      this.onStateChange(this.state);
      
      // Determine next node from expected_answers
      const nextNodeId = this.state.currentNode?.expected_answers?.[result.matchedValue.toLowerCase()];
      if (nextNodeId) {
        this.onAdvance(nextNodeId);
      } else {
        // Generic advance - let PathRAG decide
        this.onAdvance(result.matchedValue);
      }
    } else {
      // Invalid input - increment retry
      this.state.retryCount++;
      
      if (this.state.retryCount >= (this.state.expectation?.retries || 3)) {
        // Max retries - escalate
        console.log('[ControlLoop] Max retries reached, escalating');
        this.onAdvance('escalate');
      } else {
        // Re-prompt
        console.log('[ControlLoop] Invalid input, re-prompting');
        this.state.voiceState = 'reprompting';
        this.onStateChange(this.state);
        
        // Re-speak the instruction
        if (this.state.currentNode) {
          this.onSpeak(this.state.currentNode.voice_instruction);
        }
      }
    }
  }
  
  // Get current state
  getState(): ControlLoopState {
    return { ...this.state };
  }
  
  // Check if currently listening
  isListening(): boolean {
    return this.state.voiceState === 'listening';
  }
}

export default VoiceControlLoop;
