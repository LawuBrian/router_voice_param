// ============================================
// PathRAG Engine Tests
// Test-driven development for diagnostic flow
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  getCurrentNode,
  processResponse,
  advanceSession,
  getProgressPercentage,
  generateVoiceContext,
} from '../lib/pathrag-engine';
import { DiagnosticSession, DiagnosticPhase } from '../lib/types';

describe('PathRAG Engine', () => {
  describe('Session Creation', () => {
    it('should create a new session with entry_start node', () => {
      const session = createSession();
      
      expect(session.session_id).toBeTruthy();
      expect(session.session_id).toMatch(/^session_/);
      expect(session.current_node_id).toBe('entry_start');
      expect(session.current_phase).toBe(DiagnosticPhase.ENTRY);
      expect(session.status).toBe('active');
      expect(session.history).toHaveLength(0);
    });

    it('should generate unique session IDs', () => {
      const session1 = createSession();
      const session2 = createSession();
      
      expect(session1.session_id).not.toBe(session2.session_id);
    });
  });

  describe('getCurrentNode', () => {
    it('should return the current node for a session', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      expect(node).toBeTruthy();
      expect(node?.node_id).toBe('entry_start');
      expect(node?.voice_instruction).toBeTruthy();
    });

    it('should return null for invalid node_id', () => {
      const session = createSession();
      session.current_node_id = 'nonexistent_node';
      const node = getCurrentNode(session);
      
      expect(node).toBeNull();
    });
  });

  describe('Response Processing', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
    });

    it('should advance from entry_start to entry_router_identify on "yes"', () => {
      const result = processResponse(session, 'yes');
      
      expect(result.should_escalate).toBe(false);
      expect(result.next_node).toBeTruthy();
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });

    it('should advance on variations of yes', () => {
      const yesVariants = ['yes', 'yeah', 'yep', 'okay', 'ok', 'ready', 'sure'];
      
      for (const variant of yesVariants) {
        const result = processResponse(session, variant);
        expect(result.should_escalate).toBe(false);
        expect(result.next_node?.node_id).toBe('entry_router_identify');
      }
    });

    it('should stay on same node for unrecognized response (retry)', () => {
      const result = processResponse(session, 'random gibberish xyz');
      
      expect(result.should_escalate).toBe(false);
      expect(result.next_node?.node_id).toBe('entry_start');
    });

    it('should escalate after max retries', () => {
      // Move to entry_router_identify which is more appropriate for retry testing
      const advanceResult = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', advanceResult);
      expect(session.current_node_id).toBe('entry_router_identify');
      
      // Add history to simulate retries (need 3 retries at this node)
      session.history = [
        ...session.history,
        { node_id: 'entry_router_identify', timestamp: Date.now(), user_response: 'invalid1', outcome: 'success' },
        { node_id: 'entry_router_identify', timestamp: Date.now(), user_response: 'invalid2', outcome: 'success' },
        { node_id: 'entry_router_identify', timestamp: Date.now(), user_response: 'invalid3', outcome: 'success' },
      ];
      
      const result = processResponse(session, 'still not a valid router brand');
      
      expect(result.should_escalate).toBe(true);
      expect(result.escalation_reason).toContain('retries');
    });

    it('should escalate when user expresses uncertainty', () => {
      const uncertainPhrases = ["I don't know", "not sure", "confused", "can't tell"];
      
      for (const phrase of uncertainPhrases) {
        const result = processResponse(session, phrase);
        expect(result.should_escalate).toBe(true);
        expect(result.escalation_reason).toContain('uncertain');
      }
    });
  });

  describe('Router Brand Identification', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
      // Move to router identify step
      const firstResult = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', firstResult);
    });

    it('should detect TP-Link brand', () => {
      expect(session.current_node_id).toBe('entry_router_identify');
      
      const result = processResponse(session, 'tp-link');
      const newSession = advanceSession(session, 'tp-link', result);
      
      expect(newSession.vendor_profile).toBeTruthy();
      expect(newSession.vendor_profile?.vendor_id).toBe('tplink_4g');
    });

    it('should detect TP-Link variations', () => {
      const variations = ['tplink', 'tp link', 'TP-Link', 'TPLINK', 'mr600', 'MR600', 'archer'];
      
      for (const brand of variations) {
        const result = processResponse(session, brand);
        const newSession = advanceSession(session, brand, result);
        
        expect(newSession.vendor_profile?.vendor_id).toBe('tplink_4g');
      }
    });

    it('should advance to physical_power_led after brand identification', () => {
      const result = processResponse(session, 'tp-link');
      
      expect(result.next_node?.node_id).toBe('physical_power_led');
    });

    it('should use generic profile for unknown brand', () => {
      const result = processResponse(session, 'unknown brand xyz');
      const newSession = advanceSession(session, 'unknown brand xyz', result);
      
      // Should stay on same node but set generic profile
      expect(newSession.vendor_profile?.vendor_id).toBe('generic');
    });
  });

  describe('Physical Layer Flow', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      // Navigate to physical_power_led
      session = createSession();
      
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      expect(session.current_node_id).toBe('physical_power_led');
    });

    it('should be at physical_power_led node', () => {
      expect(session.current_node_id).toBe('physical_power_led');
      expect(session.current_phase).toBe(DiagnosticPhase.PHYSICAL_LAYER);
    });

    it('should advance to physical_internet_led when power is on', () => {
      const result = processResponse(session, 'on');
      
      expect(result.next_node?.node_id).toBe('physical_internet_led');
    });

    it('should handle blinking power light', () => {
      const result = processResponse(session, 'blinking');
      
      expect(result.next_node).toBeTruthy();
      // Should go to reboot or troubleshooting node
    });

    it('should handle power light off', () => {
      const result = processResponse(session, 'off');
      
      expect(result.next_node).toBeTruthy();
      // Should go to power check node
    });
  });

  describe('Session Advancement', () => {
    it('should update history when advancing', () => {
      const session = createSession();
      const result = processResponse(session, 'yes');
      const newSession = advanceSession(session, 'yes', result);
      
      expect(newSession.history).toHaveLength(1);
      expect(newSession.history[0].node_id).toBe('entry_start');
      expect(newSession.history[0].user_response).toBe('yes');
    });

    it('should update observations when advancing', () => {
      const session = createSession();
      const result = processResponse(session, 'yes');
      const newSession = advanceSession(session, 'yes', result);
      
      expect(newSession.observations['entry_start']).toBe('yes');
    });

    it('should update phase when moving to new phase', () => {
      let session = createSession();
      
      // Entry -> Router Identify
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      expect(session.current_phase).toBe(DiagnosticPhase.ENTRY);
      
      // Router Identify -> Physical Power LED
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      expect(session.current_phase).toBe(DiagnosticPhase.PHYSICAL_LAYER);
    });

    it('should set status to escalated on escalation', () => {
      const session = createSession();
      const result = processResponse(session, "I don't know");
      const newSession = advanceSession(session, "I don't know", result);
      
      expect(newSession.status).toBe('escalated');
      expect(newSession.escalation_payload).toBeTruthy();
    });
  });

  describe('Progress Tracking', () => {
    it('should return 0% at entry phase', () => {
      const session = createSession();
      const progress = getProgressPercentage(session);
      
      expect(progress).toBe(0);
    });

    it('should increase progress as phases advance', () => {
      let session = createSession();
      let progress = getProgressPercentage(session);
      expect(progress).toBe(0);
      
      // Move to physical layer
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      progress = getProgressPercentage(session);
      expect(progress).toBeGreaterThan(0);
    });
  });

  describe('Voice Context Generation', () => {
    it('should generate context with node info', () => {
      const session = createSession();
      const context = generateVoiceContext(session);
      
      expect(context).toContain('NODE_ID: entry_start');
      expect(context).toContain('YOUR TASK:');
    });

    it('should include router-specific context for TP-Link', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      const context = generateVoiceContext(session);
      
      // Should mention white LEDs for MR600
      expect(context).toContain('WHITE');
    });

    it('should return empty string for invalid node', () => {
      const session = createSession();
      session.current_node_id = 'nonexistent';
      const context = generateVoiceContext(session);
      
      expect(context).toBe('');
    });
  });

  describe('Full Diagnostic Flow - Happy Path', () => {
    it('should complete full happy path without escalation', () => {
      let session = createSession();
      
      // Entry Start -> Ready
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      expect(session.current_node_id).toBe('entry_router_identify');
      
      // Router Identify -> TP-Link
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      expect(session.current_node_id).toBe('physical_power_led');
      
      // Power LED -> On
      result = processResponse(session, 'on');
      session = advanceSession(session, 'on', result);
      expect(session.current_node_id).toBe('physical_internet_led');
      
      // Session should still be active
      expect(session.status).toBe('active');
    });
  });
});
