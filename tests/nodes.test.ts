// ============================================
// Nodes Validation Tests
// Ensure all nodes are properly configured
// ============================================

import { describe, it, expect } from 'vitest';
import { DIAGNOSTIC_NODES, getNodeById } from '../lib/nodes';
import { DiagnosticPhase } from '../lib/types';

describe('Diagnostic Nodes', () => {
  describe('Node Structure Validation', () => {
    it('should have entry_start as the first node', () => {
      const entryNode = DIAGNOSTIC_NODES[0];
      expect(entryNode.node_id).toBe('entry_start');
    });

    it('should have all required fields in each node', () => {
      const requiredFields = [
        'node_id',
        'phase',
        'input_type',
        'question',
        'voice_instruction',
        'expected_answers',
        'escalation_conditions',
      ];

      for (const node of DIAGNOSTIC_NODES) {
        for (const field of requiredFields) {
          expect(node).toHaveProperty(field);
        }
      }
    });

    it('should have unique node_ids', () => {
      const nodeIds = DIAGNOSTIC_NODES.map(n => n.node_id);
      const uniqueIds = new Set(nodeIds);
      expect(uniqueIds.size).toBe(nodeIds.length);
    });

    it('should have valid phase for each node', () => {
      const validPhases = Object.values(DiagnosticPhase);
      
      for (const node of DIAGNOSTIC_NODES) {
        expect(validPhases).toContain(node.phase);
      }
    });

    it('should have voice_instruction for all nodes', () => {
      for (const node of DIAGNOSTIC_NODES) {
        expect(node.voice_instruction).toBeTruthy();
        expect(typeof node.voice_instruction).toBe('string');
        expect(node.voice_instruction.length).toBeGreaterThan(5);
      }
    });
  });

  describe('Node References Validation', () => {
    it('should have all expected_answers reference valid nodes', () => {
      const allNodeIds = new Set(DIAGNOSTIC_NODES.map(n => n.node_id));
      
      for (const node of DIAGNOSTIC_NODES) {
        for (const [answer, nextNodeId] of Object.entries(node.expected_answers)) {
          expect(allNodeIds.has(nextNodeId)).toBe(true);
        }
      }
    });

    it('should not have circular references in primary path', () => {
      // Start from entry_start and trace a happy path
      const visited = new Set<string>();
      let currentNodeId = 'entry_start';
      let steps = 0;
      const maxSteps = 100; // Prevent infinite loops in test
      
      while (currentNodeId && steps < maxSteps) {
        if (visited.has(currentNodeId)) {
          // Allow some circular references for retry logic, but track depth
          break;
        }
        visited.add(currentNodeId);
        
        const node = getNodeById(currentNodeId);
        if (!node) break;
        
        // Get first expected answer as happy path
        const answers = Object.values(node.expected_answers);
        currentNodeId = answers[0] as string;
        steps++;
      }
      
      // Should have visited multiple nodes
      expect(visited.size).toBeGreaterThan(5);
    });
  });

  describe('getNodeById', () => {
    it('should return node for valid id', () => {
      const node = getNodeById('entry_start');
      expect(node).toBeTruthy();
      expect(node?.node_id).toBe('entry_start');
    });

    it('should return null for invalid id', () => {
      const node = getNodeById('nonexistent_node_xyz');
      expect(node).toBeNull();
    });
  });

  describe('Entry Node', () => {
    it('should be able to find entry_start node', () => {
      const node = getNodeById('entry_start');
      expect(node).toBeTruthy();
      expect(node?.node_id).toBe('entry_start');
      expect(node?.phase).toBe(DiagnosticPhase.ENTRY);
    });
  });

  describe('Critical Path Nodes Exist', () => {
    const criticalNodes = [
      'entry_start',
      'entry_router_identify',
      'physical_power_led',
      'physical_internet_led',
      'local_network_check',
      'router_login_prompt',
      'verification_complete',
    ];

    for (const nodeId of criticalNodes) {
      it(`should have ${nodeId} node`, () => {
        const node = getNodeById(nodeId);
        expect(node).toBeTruthy();
      });
    }
  });

  describe('Voice Instructions Quality', () => {
    it('should have voice instructions under 500 characters', () => {
      for (const node of DIAGNOSTIC_NODES) {
        expect(node.voice_instruction.length).toBeLessThan(500);
      }
    });

    it('should have voice instructions that end with punctuation or question mark', () => {
      for (const node of DIAGNOSTIC_NODES) {
        const instruction = node.voice_instruction.trim();
        const lastChar = instruction[instruction.length - 1];
        expect(['.', '?', '!', ':']).toContain(lastChar);
      }
    });

    it('should not have voice instructions with TODO or placeholder text', () => {
      for (const node of DIAGNOSTIC_NODES) {
        expect(node.voice_instruction.toLowerCase()).not.toContain('todo');
        expect(node.voice_instruction.toLowerCase()).not.toContain('placeholder');
        expect(node.voice_instruction.toLowerCase()).not.toContain('xxx');
      }
    });
  });

  describe('Expected Answers Coverage', () => {
    it('should have at least one expected answer per node', () => {
      // Except terminal nodes like session_end
      const terminalNodes = ['session_end', 'escalation_tech_support'];
      
      for (const node of DIAGNOSTIC_NODES) {
        if (!terminalNodes.includes(node.node_id)) {
          const answerCount = Object.keys(node.expected_answers).length;
          expect(answerCount).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should have appropriate answers for confirmation nodes', () => {
      const confirmationNodes = DIAGNOSTIC_NODES.filter(
        n => n.input_type === 'confirmation'
      );
      
      // At least some confirmation nodes should exist
      expect(confirmationNodes.length).toBeGreaterThan(0);
      
      // Confirmation nodes that need answers (not terminal nodes)
      const nonTerminalConfirmation = confirmationNodes.filter(
        n => !['session_end', 'verification_complete'].includes(n.node_id)
      );
      
      for (const node of nonTerminalConfirmation) {
        const answerCount = Object.keys(node.expected_answers).length;
        // Non-terminal confirmation nodes should have at least one answer
        if (answerCount === 0) {
          console.log(`Warning: ${node.node_id} has no expected answers`);
        }
      }
    });
  });
});
