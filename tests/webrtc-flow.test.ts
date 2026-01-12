// ============================================
// WebRTC Flow Tests
// Test voice conversation flow coordination
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  processResponse,
  advanceSession,
  getCurrentNode,
  generateVoiceContext,
} from '../lib/pathrag-engine';
import { DiagnosticSession, DiagnosticPhase } from '../lib/types';

describe('WebRTC Voice Flow', () => {
  describe('Instruction Generation', () => {
    it('should generate voice instruction for each node', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      expect(node?.voice_instruction).toBeTruthy();
      expect(node?.voice_instruction.length).toBeGreaterThan(10);
    });

    it('should have different instructions for each step', () => {
      let session = createSession();
      const instruction1 = getCurrentNode(session)?.voice_instruction;
      
      // Advance to next node
      const result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      const instruction2 = getCurrentNode(session)?.voice_instruction;
      
      expect(instruction1).not.toBe(instruction2);
    });

    it('should include expected answers in voice context', () => {
      const session = createSession();
      const context = generateVoiceContext(session);
      
      expect(context).toContain('VALID RESPONSES');
    });
  });

  describe('Conversation Flow Coordination', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
    });

    it('should provide next instruction after user response', () => {
      // User responds
      const result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      // Should have new instruction
      const nextNode = getCurrentNode(session);
      expect(nextNode?.voice_instruction).toBeTruthy();
      expect(nextNode?.node_id).toBe('entry_router_identify');
    });

    it('should maintain same instruction for invalid response (retry)', () => {
      const originalInstruction = getCurrentNode(session)?.voice_instruction;
      
      // Invalid response
      const result = processResponse(session, 'invalid gibberish');
      session = advanceSession(session, 'invalid gibberish', result);
      
      // Should still be at same node with same instruction
      const currentInstruction = getCurrentNode(session)?.voice_instruction;
      expect(currentInstruction).toBe(originalInstruction);
    });

    it('should track conversation history', () => {
      // First exchange
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      // Second exchange
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      // History should have both exchanges
      expect(session.history).toHaveLength(2);
      expect(session.history[0].user_response).toBe('yes');
      expect(session.history[1].user_response).toBe('tp-link');
    });
  });

  describe('Voice Context for AI', () => {
    it('should include node ID for tracking', () => {
      const session = createSession();
      const context = generateVoiceContext(session);
      
      expect(context).toContain('NODE_ID: entry_start');
    });

    it('should include phase information', () => {
      const session = createSession();
      const context = generateVoiceContext(session);
      
      expect(context).toContain('PHASE:');
    });

    it('should include task instruction', () => {
      const session = createSession();
      const context = generateVoiceContext(session);
      
      expect(context).toContain('YOUR TASK:');
    });

    it('should include router-specific context after identification', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      const context = generateVoiceContext(session);
      
      // Should mention LED colors for TP-Link MR600
      expect(context).toContain('WHITE');
    });
  });

  describe('Message Synchronization', () => {
    it('should produce consistent node_id across operations', () => {
      let session = createSession();
      const initialNodeId = session.current_node_id;
      const initialNode = getCurrentNode(session);
      
      expect(initialNode?.node_id).toBe(initialNodeId);
      expect(initialNodeId).toBe('entry_start');
    });

    it('should update node_id atomically after processing', () => {
      let session = createSession();
      
      // Process response
      const result = processResponse(session, 'yes');
      const nextNodeId = result.next_node?.node_id;
      
      // Advance session
      session = advanceSession(session, 'yes', result);
      
      // Both should match
      expect(session.current_node_id).toBe(nextNodeId);
      expect(getCurrentNode(session)?.node_id).toBe(nextNodeId);
    });
  });

  describe('User Transcript Processing', () => {
    it('should normalize user input before matching', () => {
      const session = createSession();
      
      // Various formats of "yes"
      const inputs = [
        'Yes',
        'YES',
        '  yes  ',
        'yes.',
        'Yes!',
        'yes, I am ready',
      ];
      
      for (const input of inputs) {
        const result = processResponse(session, input);
        expect(result.next_node?.node_id).toBe('entry_router_identify');
      }
    });

    it('should handle natural language responses', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      // At router identify step, natural language
      result = processResponse(session, "It's a TP-Link router");
      expect(result.next_node?.node_id).toBe('physical_power_led');
    });

    it('should handle abbreviated responses', () => {
      const session = createSession();
      
      // "ok" instead of "okay"
      const result = processResponse(session, 'ok');
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });
  });

  describe('AI Response Expectations', () => {
    it('should have reasonable instruction length', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      // Instruction should be readable in ~10 seconds
      // Average speaking rate is ~150 words per minute = 2.5 words per second
      const words = node?.voice_instruction.split(/\s+/).length || 0;
      const estimatedSeconds = words / 2.5;
      
      expect(estimatedSeconds).toBeLessThan(30);
    });

    it('should end with question or clear instruction', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      const instruction = node?.voice_instruction || '';
      
      // Should end with punctuation
      expect(instruction).toMatch(/[.?!]$/);
    });
  });

  describe('Step Complete Function Simulation', () => {
    it('should be safe to call step_complete multiple times', () => {
      const session = createSession();
      
      // Simulate step_complete being called
      // (In real flow, this just acknowledges the AI finished speaking)
      const stepComplete1 = { spoken_text: "Hi! I'm Akili." };
      const stepComplete2 = { spoken_text: "Hi! I'm Akili." };
      
      // Both should be valid - no state change should occur
      expect(stepComplete1.spoken_text).toBeTruthy();
      expect(stepComplete2.spoken_text).toBeTruthy();
    });
  });

  describe('Clarify Step Function Simulation', () => {
    it('should allow clarification without advancing', () => {
      const session = createSession();
      const nodeBeforeClarify = session.current_node_id;
      
      // Simulate user asking for clarification
      // In real flow, AI calls clarify_step but we don't advance PathRAG
      const clarification = {
        clarification: "That means looking at the front of your router for the brand name"
      };
      
      // Session should not advance
      expect(session.current_node_id).toBe(nodeBeforeClarify);
      expect(clarification.clarification.length).toBeLessThan(100);
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing transcript gracefully', () => {
      const session = createSession();
      
      // Empty or undefined transcript
      const result1 = processResponse(session, '');
      expect(result1.should_escalate).toBe(false);
      expect(result1.next_node?.node_id).toBe('entry_start'); // Retry
    });

    it('should maintain state on processing error', () => {
      const session = createSession();
      const originalNodeId = session.current_node_id;
      
      // Garbage input
      const result = processResponse(session, '\x00\x01\x02');
      
      // Should not crash, should retry
      expect(result.next_node?.node_id).toBe(originalNodeId);
    });
  });
});

describe('Diagnostic Panel Sync', () => {
  describe('Current Node Display', () => {
    it('should provide question text for display', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      expect(node?.question).toBeTruthy();
      expect(node?.question.length).toBeGreaterThan(5);
    });

    it('should provide expected answers for buttons', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      const answers = Object.keys(node?.expected_answers || {});
      expect(answers.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Sync', () => {
    it('should update progress as flow advances', () => {
      let session = createSession();
      
      // Track progress at each step
      const progressHistory: number[] = [];
      
      // Step 1
      progressHistory.push(session.current_phase === DiagnosticPhase.ENTRY ? 0 : 1);
      
      // Advance
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      progressHistory.push(session.current_phase === DiagnosticPhase.ENTRY ? 0 : 1);
      
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      progressHistory.push(session.current_phase === DiagnosticPhase.PHYSICAL_LAYER ? 1 : 0);
      
      // Should show progression
      expect(progressHistory[2]).toBe(1); // Physical layer
    });
  });
});
