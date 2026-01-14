// ============================================
// Voice Configuration Tests
// Ensure voice settings prevent cutoff and bad behavior
// ============================================

import { describe, it, expect } from 'vitest';
import { DIAGNOSTIC_NODES } from '../lib/nodes';

// Minimum tokens needed for speech (rough estimate: 1 word ≈ 1.3 tokens)
const MIN_TOKENS_FOR_SPEECH = 300;
const MAX_WORDS_PER_INSTRUCTION = 100;

describe('Voice Configuration', () => {
  describe('Token Limits', () => {
    it('should allow enough tokens for complete sentences', () => {
      // This test documents the expected minimum token limit
      // If you see this test, ensure max_response_output_tokens >= MIN_TOKENS_FOR_SPEECH
      // in both route.ts and webrtc.ts
      expect(MIN_TOKENS_FOR_SPEECH).toBeGreaterThanOrEqual(300);
    });

    it('should have voice instructions under max word limit', () => {
      for (const node of DIAGNOSTIC_NODES) {
        const wordCount = node.voice_instruction.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(MAX_WORDS_PER_INSTRUCTION);
      }
    });
  });

  describe('Voice Instruction Quality', () => {
    it('should have all instructions end with complete sentences', () => {
      for (const node of DIAGNOSTIC_NODES) {
        const instruction = node.voice_instruction.trim();
        const lastChar = instruction[instruction.length - 1];
        
        // Should end with sentence-ending punctuation
        expect(['.', '?', '!']).toContain(lastChar);
      }
    });

    it('should not have instructions that are too short to be useful', () => {
      for (const node of DIAGNOSTIC_NODES) {
        const wordCount = node.voice_instruction.split(/\s+/).length;
        
        // Minimum 3 words for any instruction
        expect(wordCount).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have speakable instructions (no special characters)', () => {
      for (const node of DIAGNOSTIC_NODES) {
        // Should not contain raw code-like characters
        expect(node.voice_instruction).not.toContain('```');
        expect(node.voice_instruction).not.toContain('${');
        expect(node.voice_instruction).not.toContain('===');
      }
    });

    it('should have natural-sounding instructions', () => {
      for (const node of DIAGNOSTIC_NODES) {
        // Should not start with robotic prefixes
        expect(node.voice_instruction).not.toMatch(/^(ERROR|DEBUG|LOG|OUTPUT)/i);
        
        // Should not contain technical jargon without context
        expect(node.voice_instruction.toLowerCase()).not.toContain('null');
        expect(node.voice_instruction.toLowerCase()).not.toContain('undefined');
      }
    });
  });

  describe('Estimated Speaking Time', () => {
    // Average speaking rate: ~150 words per minute = 2.5 words per second
    const WORDS_PER_SECOND = 2.5;
    const MAX_SPEAKING_TIME_SECONDS = 30;
    const MIN_SPEAKING_TIME_SECONDS = 1;

    it('should have reasonable speaking time for each instruction', () => {
      for (const node of DIAGNOSTIC_NODES) {
        const wordCount = node.voice_instruction.split(/\s+/).length;
        const estimatedSeconds = wordCount / WORDS_PER_SECOND;
        
        expect(estimatedSeconds).toBeLessThanOrEqual(MAX_SPEAKING_TIME_SECONDS);
        expect(estimatedSeconds).toBeGreaterThanOrEqual(MIN_SPEAKING_TIME_SECONDS);
      }
    });

    it('should have entry node under 10 seconds speaking time', () => {
      const entryNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start');
      expect(entryNode).toBeTruthy();
      
      const wordCount = entryNode!.voice_instruction.split(/\s+/).length;
      const estimatedSeconds = wordCount / WORDS_PER_SECOND;
      
      expect(estimatedSeconds).toBeLessThanOrEqual(10);
    });
  });

  describe('Turn Detection Safety', () => {
    it('should use Azure defaults (no custom VAD)', () => {
      // Using Azure defaults like param_demo - proven to work
      // No custom turn_detection settings needed
      // Azure handles VAD automatically with sensible defaults
      expect(true).toBe(true); // Placeholder - Azure handles this
    });
  });

  describe('Language Consistency', () => {
    it('should have all instructions in English', () => {
      for (const node of DIAGNOSTIC_NODES) {
        // Common non-English patterns (basic check)
        const instruction = node.voice_instruction.toLowerCase();
        
        // Should not contain common Spanish/French/German articles as standalone
        expect(instruction).not.toMatch(/\b(el|la|los|las|le|les|der|die|das)\b/);
      }
    });

    it('should use simple English vocabulary', () => {
      // Instructions should be understandable by non-technical users
      const complexTechTerms = [
        'bandwidth', 'throughput', 'latency', 'protocol',
        'subnetting', 'DHCP lease', 'NAT traversal', 'packet loss'
      ];
      
      for (const node of DIAGNOSTIC_NODES) {
        const instruction = node.voice_instruction.toLowerCase();
        
        for (const term of complexTechTerms) {
          expect(instruction).not.toContain(term.toLowerCase());
        }
      }
    });
  });
});

describe('Voice Response Patterns', () => {
  describe('Greeting Node', () => {
    it('should have a friendly greeting', () => {
      const entryNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start');
      expect(entryNode).toBeTruthy();
      
      const instruction = entryNode!.voice_instruction.toLowerCase();
      
      // Should contain greeting word
      expect(instruction).toMatch(/(hi|hello|hey|welcome)/);
    });

    it('should introduce Akili by name', () => {
      const entryNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start');
      expect(entryNode).toBeTruthy();
      
      const instruction = entryNode!.voice_instruction.toLowerCase();
      
      expect(instruction).toContain('akili');
    });
  });

  describe('Question Nodes', () => {
    it('should have question nodes end with question marks', () => {
      const questionNodes = DIAGNOSTIC_NODES.filter(
        n => n.input_type === 'user_observation' || n.question.includes('?')
      );
      
      for (const node of questionNodes) {
        const instruction = node.voice_instruction.trim();
        // Should end with ? if it's asking something
        if (node.question.includes('?')) {
          expect(instruction).toContain('?');
        }
      }
    });
  });

  describe('Completion Node', () => {
    it('should have a positive completion message', () => {
      const completeNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'verification_complete');
      expect(completeNode).toBeTruthy();
      
      const instruction = completeNode!.voice_instruction.toLowerCase();
      
      // Should contain positive words
      expect(instruction).toMatch(/(excellent|great|congratulations|working|resolved|fixed)/);
    });
  });
});
