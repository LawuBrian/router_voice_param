// ============================================
// API Routes Integration Tests
// Test PathRAG API endpoints
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the session store to avoid Redis dependency
vi.mock('../lib/session-store', () => {
  const sessions = new Map();
  return {
    saveSession: vi.fn(async (session) => {
      sessions.set(session.session_id, session);
    }),
    getSession: vi.fn(async (sessionId) => {
      return sessions.get(sessionId) || null;
    }),
    deleteSession: vi.fn(async (sessionId) => {
      sessions.delete(sessionId);
    }),
    isRedisEnabled: vi.fn(() => false),
  };
});

import {
  createSession,
  processResponse,
  advanceSession,
  getCurrentNode,
} from '../lib/pathrag-engine';
import { saveSession, getSession } from '../lib/session-store';
import { DiagnosticPhase } from '../lib/types';

describe('PathRAG API Flow', () => {
  describe('Session Lifecycle', () => {
    it('should create and persist a session', async () => {
      const session = createSession();
      await saveSession(session);
      
      const retrieved = await getSession(session.session_id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.session_id).toBe(session.session_id);
    });

    it('should maintain session state across operations', async () => {
      // Create session
      let session = createSession();
      await saveSession(session);
      
      // Process first response
      const result1 = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result1);
      await saveSession(session);
      
      // Retrieve and verify state
      const retrieved = await getSession(session.session_id);
      expect(retrieved?.current_node_id).toBe('entry_router_identify');
      expect(retrieved?.history).toHaveLength(1);
    });
  });

  describe('Full API Flow Simulation', () => {
    it('should handle complete diagnostic flow', async () => {
      // Step 1: Create session
      let session = createSession();
      await saveSession(session);
      expect(session.current_node_id).toBe('entry_start');
      
      // Step 2: User says "yes" to start
      let result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      await saveSession(session);
      expect(session.current_node_id).toBe('entry_router_identify');
      
      // Step 3: User identifies router as TP-Link
      result = processResponse(session, 'tp-link');
      session = advanceSession(session, 'tp-link', result);
      await saveSession(session);
      expect(session.current_node_id).toBe('physical_power_led');
      expect(session.vendor_profile?.vendor_id).toBe('tplink_4g');
      
      // Step 4: User says power light is on
      result = processResponse(session, 'on');
      session = advanceSession(session, 'on', result);
      await saveSession(session);
      expect(session.current_node_id).toBe('physical_internet_led');
      
      // Verify history has all steps
      expect(session.history.length).toBeGreaterThanOrEqual(3);
      expect(session.status).toBe('active');
    });

    it('should handle escalation flow', async () => {
      let session = createSession();
      await saveSession(session);
      
      // User expresses uncertainty
      const result = processResponse(session, "I don't know what to do");
      session = advanceSession(session, "I don't know what to do", result);
      await saveSession(session);
      
      expect(session.status).toBe('escalated');
      expect(session.escalation_payload).toBeTruthy();
      expect(session.escalation_payload?.trigger).toBeTruthy();
    });
  });

  describe('Response Data Structure', () => {
    it('should return correct response structure for create', () => {
      const session = createSession();
      const node = getCurrentNode(session);
      
      // Simulate API response structure
      const response = {
        session_id: session.session_id,
        current_node: node,
        phase: session.current_phase,
        status: session.status,
      };
      
      expect(response.session_id).toBeTruthy();
      expect(response.current_node).toBeTruthy();
      expect(response.current_node?.voice_instruction).toBeTruthy();
      expect(response.phase).toBe(DiagnosticPhase.ENTRY);
      expect(response.status).toBe('active');
    });

    it('should return correct response structure for process', () => {
      let session = createSession();
      const result = processResponse(session, 'yes');
      session = advanceSession(session, 'yes', result);
      const node = getCurrentNode(session);
      
      // Simulate API response structure
      const response = {
        session_id: session.session_id,
        current_node: node,
        phase: session.current_phase,
        status: session.status,
        assets: [],
        voice_context: node?.voice_instruction,
      };
      
      expect(response.current_node?.node_id).toBe('entry_router_identify');
      expect(response.voice_context).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response gracefully', () => {
      const session = createSession();
      const result = processResponse(session, '');
      
      // Should retry on empty response
      expect(result.should_escalate).toBe(false);
      expect(result.next_node?.node_id).toBe('entry_start');
    });

    it('should handle very long response', () => {
      const session = createSession();
      const longResponse = 'yes '.repeat(100);
      const result = processResponse(session, longResponse);
      
      // Should still detect "yes" in the response
      expect(result.should_escalate).toBe(false);
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });

    it('should handle special characters in response', () => {
      const session = createSession();
      const result = processResponse(session, 'yes! I\'m ready!!!');
      
      expect(result.should_escalate).toBe(false);
      expect(result.next_node?.node_id).toBe('entry_router_identify');
    });

    it('should handle case-insensitive responses', () => {
      const session = createSession();
      
      const variations = ['YES', 'Yes', 'yEs', 'YES!', '  yes  '];
      for (const response of variations) {
        const result = processResponse(session, response);
        expect(result.next_node?.node_id).toBe('entry_router_identify');
      }
    });
  });

  describe('Concurrent Session Handling', () => {
    it('should handle multiple sessions independently', async () => {
      // Create two sessions
      const session1 = createSession();
      const session2 = createSession();
      await saveSession(session1);
      await saveSession(session2);
      
      // Advance session1
      let result1 = processResponse(session1, 'yes');
      const advancedSession1 = advanceSession(session1, 'yes', result1);
      await saveSession(advancedSession1);
      
      // Session2 should still be at start
      const retrieved2 = await getSession(session2.session_id);
      expect(retrieved2?.current_node_id).toBe('entry_start');
      
      // Session1 should be advanced
      const retrieved1 = await getSession(advancedSession1.session_id);
      expect(retrieved1?.current_node_id).toBe('entry_router_identify');
    });
  });
});
