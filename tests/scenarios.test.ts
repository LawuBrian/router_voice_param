// ============================================
// Diagnostic Scenario Tests
// Test specific troubleshooting scenarios
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  processResponse,
  advanceSession,
  getCurrentNode,
  getProgressPercentage,
} from '../lib/pathrag-engine';
import { DiagnosticSession, DiagnosticPhase } from '../lib/types';

describe('Diagnostic Scenarios', () => {
  describe('Scenario: Happy Path - All Systems Working', () => {
    it('should complete full diagnosis when everything works', () => {
      let session = createSession();
      
      // Entry
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      // Router identification
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      expect(session.current_phase).toBe(DiagnosticPhase.PHYSICAL_LAYER);
      
      // Power LED on
      result = processResponse(session, 'on');
      session = advanceSession(session, 'on', result);
      
      // Internet LED on/green
      result = processResponse(session, 'on');
      session = advanceSession(session, 'on', result);
      
      // Session should progress normally
      expect(session.status).toBe('active');
      expect(getProgressPercentage(session)).toBeGreaterThan(0);
    });
  });

  describe('Scenario: Power Light Off', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
      // Navigate to power LED check
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
    });

    it('should handle power light off', () => {
      const result = processResponse(session, 'off');
      session = advanceSession(session, 'off', result);
      
      // Should go to power troubleshooting
      expect(session.current_node_id).toBeTruthy();
      expect(session.current_node_id).not.toBe('physical_power_led');
    });

    it('should handle power light blinking', () => {
      const result = processResponse(session, 'blinking');
      session = advanceSession(session, 'blinking', result);
      
      // Should have a path for blinking
      expect(session.current_node_id).toBeTruthy();
    });
  });

  describe('Scenario: Internet LED Issues', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
      // Navigate to internet LED check
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      result = processResponse(session, 'on'); // Power is on
      session = advanceSession(session, 'on', result);
    });

    it('should handle internet LED off', () => {
      const result = processResponse(session, 'off');
      session = advanceSession(session, 'off', result);
      
      // Should continue to next troubleshooting step
      expect(session.status).toBe('active');
      expect(session.current_node_id).not.toBe('physical_internet_led');
    });

    it('should handle internet LED blinking', () => {
      const result = processResponse(session, 'blinking');
      session = advanceSession(session, 'blinking', result);
      
      expect(session.status).toBe('active');
    });

    it('should handle internet LED red', () => {
      const result = processResponse(session, 'red');
      session = advanceSession(session, 'red', result);
      
      // Red usually indicates a problem
      expect(session.status).toBe('active');
    });
  });

  describe('Scenario: User Uncertainty', () => {
    it('should escalate when user says "I dont know" at entry', () => {
      let session = createSession();
      
      // "don't know" triggers escalation due to user_uncertain condition
      const result = processResponse(session, "I don't know");
      session = advanceSession(session, "I don't know", result);
      
      expect(session.status).toBe('escalated');
    });

    it('should escalate when user is "not sure"', () => {
      let session = createSession();
      
      const result = processResponse(session, "not sure");
      session = advanceSession(session, "not sure", result);
      
      expect(session.status).toBe('escalated');
    });

    it('should escalate when user is "confused"', () => {
      let session = createSession();
      
      const result = processResponse(session, "confused");
      session = advanceSession(session, "confused", result);
      
      expect(session.status).toBe('escalated');
    });

    it('should escalate when user cannot locate something', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      // At power LED check, user can't find the light
      result = processResponse(session, "I can't find the power light");
      session = advanceSession(session, "I can't find the power light", result);
      
      expect(session.status).toBe('escalated');
      expect(session.escalation_payload?.trigger).toBeTruthy();
    });

    it('should escalate on various "cant find" phrases', () => {
      const cantFindPhrases = [
        "can't find it",
        "cant find it",
        "cannot find",
        "don't see it",
        "cant see the light",
      ];
      
      for (const phrase of cantFindPhrases) {
        let session = createSession();
        let result = processResponse(session, 'yes');
        session = advanceSession(session, 'yes', result);
        result = processResponse(session, 'tp-link');
        session = advanceSession(session, 'tp-link', result);
        
        result = processResponse(session, phrase);
        session = advanceSession(session, phrase, result);
        
        expect(session.status).toBe('escalated');
      }
    });

    it('should escalate when screen does not match', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      // At power LED check, user says screen looks different
      result = processResponse(session, "my screen looks different");
      session = advanceSession(session, "my screen looks different", result);
      
      expect(session.status).toBe('escalated');
    });

    it('should escalate on various screen mismatch phrases', () => {
      const mismatchPhrases = [
        "doesn't match what I see",
        "looks different from mine",
        "not what i see",
        "that's not what i have",
      ];
      
      for (const phrase of mismatchPhrases) {
        let session = createSession();
        let result = processResponse(session, 'yes');
        session = advanceSession(session, 'yes', result);
        result = processResponse(session, 'tp-link');
        session = advanceSession(session, 'tp-link', result);
        
        result = processResponse(session, phrase);
        session = advanceSession(session, phrase, result);
        
        expect(session.status).toBe('escalated');
      }
    });
  });

  describe('Scenario: Multiple Retries', () => {
    it('should allow retries before escalation', () => {
      let session = createSession();
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      
      // At router identify, give invalid responses
      for (let i = 0; i < 2; i++) {
        result = processResponse(session, 'invalid brand xyz');
        session = advanceSession(session, 'invalid brand xyz', result);
        expect(session.status).toBe('active'); // Still active
      }
      
      // Should still be at same node after retries
      expect(session.current_node_id).toBe('entry_router_identify');
    });
  });

  describe('Scenario: Different Router Brands', () => {
    let session: DiagnosticSession;

    beforeEach(() => {
      session = createSession();
      const result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
    });

    it('should handle TP-Link detection', () => {
      const result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      expect(session.vendor_profile?.vendor_id).toBe('tplink_4g');
    });

    it('should handle Netgear detection', () => {
      const result = processResponse(session, 'netgear');
      session = advanceSession(session, 'netgear', result);
      
      // Should set vendor profile
      expect(session.vendor_profile).toBeTruthy();
    });

    it('should handle D-Link detection', () => {
      const result = processResponse(session, 'd-link');
      session = advanceSession(session, 'd-link', result);
      
      expect(session.vendor_profile).toBeTruthy();
    });

    it('should handle unknown brand gracefully', () => {
      const result = processResponse(session, 'some random brand');
      session = advanceSession(session, 'some random brand', result);
      
      // Should use generic profile
      expect(session.vendor_profile?.vendor_id).toBe('generic');
    });
  });

  describe('Scenario: Voice Recognition Variants', () => {
    it('should understand various ways of saying yes', () => {
      // Core yes variants
      const yesVariants = [
        'yes',
        'yeah',
        'yep',
        'sure',
        'ok',
        'okay',
        'ready',
      ];

      for (const variant of yesVariants) {
        const session = createSession();
        const result = processResponse(session, variant);
        expect(result.next_node?.node_id).toBe('entry_router_identify');
      }
    });

    it('should understand extended yes variants like "absolutely"', () => {
      const extendedYesVariants = [
        'absolutely',
        'definitely',
        "let's go",
        'lets go',
        'go ahead',
        'start',
      ];

      for (const variant of extendedYesVariants) {
        const session = createSession();
        const result = processResponse(session, variant);
        expect(result.next_node?.node_id).toBe('entry_router_identify');
      }
    });

    it('should understand various ways of saying no', () => {
      const noVariants = [
        'no',
        'nope',
        'not now',
        'no thanks',
      ];

      for (const variant of noVariants) {
        const session = createSession();
        const result = processResponse(session, variant);
        // Should go to postpone node
        expect(result.next_node?.node_id).toBe('entry_postpone');
      }
    });

    it('should understand LED status variations', () => {
      // Core LED status variants
      const onVariants = ['on', 'solid', 'green', 'white'];
      
      for (const variant of onVariants) {
        // Create fresh session at power LED check
        let testSession = createSession();
        let testResult = processResponse(testSession, 'yes');
        testSession = advanceSession(testSession, 'yes', testResult);
        testResult = processResponse(testSession, 'tp-link');
        testSession = advanceSession(testSession, 'tp-link', testResult);
        
        // Now test the LED variant
        testResult = processResponse(testSession, variant);
        expect(testResult.next_node?.node_id).toBe('physical_internet_led');
      }
    });

    it('should understand extended LED variants like "lit"', () => {
      // Extended LED status variants
      const extendedVariants = ['lit', 'lit up', 'yes'];
      
      for (const variant of extendedVariants) {
        // Create fresh session at power LED check
        let testSession = createSession();
        let testResult = processResponse(testSession, 'yes');
        testSession = advanceSession(testSession, 'yes', testResult);
        testResult = processResponse(testSession, 'tp-link');
        testSession = advanceSession(testSession, 'tp-link', testResult);
        
        // Now test the LED variant
        testResult = processResponse(testSession, variant);
        expect(testResult.next_node?.node_id).toBe('physical_internet_led');
      }
    });
  });

  describe('Scenario: Session Recovery', () => {
    it('should maintain valid state after partial flow', () => {
      let session = createSession();
      
      // Partial flow
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      
      // "Save" and "restore" session (simulate page refresh)
      const savedSession = JSON.parse(JSON.stringify(session));
      
      // Continue from saved state
      const restoredSession = savedSession as DiagnosticSession;
      expect(restoredSession.current_node_id).toBe('physical_power_led');
      expect(restoredSession.history).toHaveLength(2);
      
      // Should be able to continue
      result = processResponse(restoredSession, 'on');
      const finalSession = advanceSession(restoredSession, 'on', result);
      expect(finalSession.current_node_id).toBe('physical_internet_led');
    });
  });

  describe('Scenario: Edge Cases', () => {
    it('should handle empty strings', () => {
      const session = createSession();
      const result = processResponse(session, '');
      
      // Should retry, not crash
      expect(result.next_node?.node_id).toBe('entry_start');
    });

    it('should handle whitespace-only input', () => {
      const session = createSession();
      const result = processResponse(session, '   \n\t  ');
      
      // Should retry
      expect(result.next_node?.node_id).toBe('entry_start');
    });

    it('should handle very long input', () => {
      const session = createSession();
      const longInput = 'yes '.repeat(1000);
      const result = processResponse(session, longInput);
      
      // Should still detect "yes"
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });

    it('should handle unicode characters', () => {
      const session = createSession();
      const result = processResponse(session, 'yes 👍');
      
      // Should still work
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });
  });
});
