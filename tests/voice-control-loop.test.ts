// ============================================
// Voice Control Loop Tests
// Tests for the gated cognition pattern
// ============================================

import { describe, it, expect } from 'vitest';
import { 
  buildExpectationWindow, 
  validateInput, 
  isNoise,
  VoiceControlLoop
} from '../lib/voice-control-loop';
import { DIAGNOSTIC_NODES } from '../lib/nodes';
import { DiagnosticPhase } from '../lib/types';

describe('Voice Control Loop', () => {
  describe('Expectation Window Builder', () => {
    it('should build expectation from entry_start node', () => {
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      const expectation = buildExpectationWindow(node);
      
      expect(expectation.slot).toBe('entry_start');
      expect(expectation.allowedValues).toContain('yes');
      expect(expectation.allowedValues).toContain('no');
      expect(expectation.timeout).toBeGreaterThan(0);
    });
    
    it('should build expectation from router identify node', () => {
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_router_identify')!;
      const expectation = buildExpectationWindow(node);
      
      expect(expectation.slot).toBe('entry_router_identify');
      expect(expectation.allowedValues).toContain('tplink');
      expect(expectation.allowedValues).toContain('netgear');
    });
  });
  
  describe('Noise Detection', () => {
    it('should detect "uh" as noise', () => {
      expect(isNoise('uh')).toBe(true);
      expect(isNoise('uhh')).toBe(true);
      expect(isNoise('uhhh')).toBe(true);
    });
    
    it('should detect "um" as noise', () => {
      expect(isNoise('um')).toBe(true);
      expect(isNoise('umm')).toBe(true);
    });
    
    it('should detect "hmm" as noise', () => {
      expect(isNoise('hmm')).toBe(true);
      expect(isNoise('hmmm')).toBe(true);
    });
    
    it('should detect very short input as noise', () => {
      expect(isNoise('a')).toBe(true);
      expect(isNoise('')).toBe(true);
      expect(isNoise(' ')).toBe(true);
    });
    
    it('should NOT detect "yes" as noise', () => {
      expect(isNoise('yes')).toBe(false);
    });
    
    it('should NOT detect "TP-Link" as noise', () => {
      expect(isNoise('TP-Link')).toBe(false);
    });
    
    it('should NOT detect "the light is green" as noise', () => {
      expect(isNoise('the light is green')).toBe(false);
    });
  });
  
  describe('Input Validation', () => {
    const entryNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
    const expectation = buildExpectationWindow(entryNode);
    
    it('should accept exact match "yes"', () => {
      const result = validateInput('yes', expectation);
      expect(result.valid).toBe(true);
      expect(result.matchedValue).toBe('yes');
    });
    
    it('should accept "yep" variant', () => {
      const result = validateInput('yep', expectation);
      expect(result.valid).toBe(true);
      expect(result.matchedValue).toBe('yep');
    });
    
    it('should accept "yeah" variant', () => {
      const result = validateInput('yeah', expectation);
      expect(result.valid).toBe(true);
    });
    
    it('should accept "no" for negative', () => {
      const result = validateInput('no', expectation);
      expect(result.valid).toBe(true);
      expect(result.matchedValue).toBe('no');
    });
    
    it('should ignore pure filler "uh"', () => {
      const result = validateInput('uh', expectation);
      expect(result.valid).toBe(false);
    });
    
    it('should ignore pure filler "umm"', () => {
      const result = validateInput('umm', expectation);
      expect(result.valid).toBe(false);
    });
    
    it('should handle natural speech "yes I am ready"', () => {
      const result = validateInput('yes I am ready', expectation);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('Router Brand Validation', () => {
    const routerNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_router_identify')!;
    const expectation = buildExpectationWindow(routerNode);
    
    it('should accept "TP-Link"', () => {
      const result = validateInput('TP-Link', expectation);
      expect(result.valid).toBe(true);
    });
    
    it('should accept "it says TP-Link on it"', () => {
      const result = validateInput('it says TP-Link on it', expectation);
      expect(result.valid).toBe(true);
    });
    
    it('should accept "netgear"', () => {
      const result = validateInput('netgear', expectation);
      expect(result.valid).toBe(true);
    });
    
    it('should accept "MR600" model', () => {
      const result = validateInput('MR600', expectation);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('Control Loop State Machine', () => {
    it('should start in idle state', () => {
      const loop = new VoiceControlLoop({
        onStateChange: () => {},
        onSpeak: () => {},
        onAdvance: () => {},
      });
      
      expect(loop.getState().voiceState).toBe('idle');
    });
    
    it('should transition to speaking when node is set', () => {
      let capturedState: any = null;
      const loop = new VoiceControlLoop({
        onStateChange: (state) => { capturedState = state; },
        onSpeak: () => {},
        onAdvance: () => {},
      });
      
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      loop.setNode(node);
      
      expect(capturedState.voiceState).toBe('speaking');
      expect(capturedState.currentNode).toBe(node);
    });
    
    it('should transition to listening after speech complete', () => {
      let capturedState: any = null;
      const loop = new VoiceControlLoop({
        onStateChange: (state) => { capturedState = state; },
        onSpeak: () => {},
        onAdvance: () => {},
      });
      
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      loop.setNode(node);
      loop.onSpeechComplete();
      
      expect(capturedState.voiceState).toBe('listening');
    });
    
    it('should ignore input when not listening', () => {
      let advanceCalled = false;
      const loop = new VoiceControlLoop({
        onStateChange: () => {},
        onSpeak: () => {},
        onAdvance: () => { advanceCalled = true; },
      });
      
      // Try to process input without setting node
      loop.processInput('yes');
      
      expect(advanceCalled).toBe(false);
    });
    
    it('should advance on valid input', () => {
      let advancedTo: string | null = null;
      const loop = new VoiceControlLoop({
        onStateChange: () => {},
        onSpeak: () => {},
        onAdvance: (nodeId) => { advancedTo = nodeId; },
      });
      
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      loop.setNode(node);
      loop.onSpeechComplete();
      loop.processInput('yes');
      
      expect(advancedTo).toBe('entry_router_identify');
    });
    
    it('should ignore noise while listening', () => {
      let advanceCalled = false;
      const loop = new VoiceControlLoop({
        onStateChange: () => {},
        onSpeak: () => {},
        onAdvance: () => { advanceCalled = true; },
      });
      
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      loop.setNode(node);
      loop.onSpeechComplete();
      loop.processInput('uh');  // Noise
      
      expect(advanceCalled).toBe(false);
      expect(loop.isListening()).toBe(true);  // Still listening
    });
  });
  
  describe('Real World Scenarios', () => {
    it('should handle background TV (ignored)', () => {
      expect(isNoise('[background noise]')).toBe(true);
    });
    
    it('should handle cough (ignored)', () => {
      expect(isNoise('cough')).toBe(true);
    });
    
    it('should handle "thinking out loud" filler', () => {
      expect(isNoise('hmm')).toBe(true);
      expect(isNoise('ah')).toBe(true);
    });
    
    it('should NOT ignore actual answers even if short', () => {
      const node = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start')!;
      const expectation = buildExpectationWindow(node);
      
      // "ok" is a valid answer
      const result = validateInput('ok', expectation);
      expect(result.valid).toBe(true);
    });
  });
});
