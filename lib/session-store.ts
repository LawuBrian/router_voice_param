// ============================================
// Session Store - Redis with in-memory fallback
// Uses Upstash Redis in production, Map for local dev
// ============================================

import { Redis } from '@upstash/redis';
import { DiagnosticSession } from './types';

// Session TTL in seconds (1 hour)
const SESSION_TTL = 3600;

// Check if Redis is configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis if configured
let redis: Redis | null = null;
if (REDIS_URL && REDIS_TOKEN) {
  redis = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });
  console.log('[SessionStore] Using Upstash Redis');
} else {
  console.log('[SessionStore] Using in-memory store (Redis not configured)');
}

// Fallback in-memory store for local development
const memoryStore = new Map<string, DiagnosticSession>();

// Session key prefix
const KEY_PREFIX = 'pathrag:session:';

/**
 * Save a session to the store
 */
export async function saveSession(session: DiagnosticSession): Promise<void> {
  const key = `${KEY_PREFIX}${session.session_id}`;
  
  if (redis) {
    try {
      // Save to Redis with TTL
      await redis.set(key, JSON.stringify(session), { ex: SESSION_TTL });
    } catch (error) {
      console.error('[SessionStore] Redis save failed, using memory fallback:', error);
      // Fallback to in-memory
      memoryStore.set(session.session_id, session);
    }
  } else {
    // Save to in-memory
    memoryStore.set(session.session_id, session);
  }
}

/**
 * Get a session from the store
 */
export async function getSession(sessionId: string): Promise<DiagnosticSession | null> {
  const key = `${KEY_PREFIX}${sessionId}`;
  
  if (redis) {
    try {
      const data = await redis.get<string>(key);
      if (!data) {
        // Check memory fallback
        return memoryStore.get(sessionId) || null;
      }
      
      // Handle both string and object responses from Upstash
      if (typeof data === 'string') {
        return JSON.parse(data) as DiagnosticSession;
      }
      return data as unknown as DiagnosticSession;
    } catch (error) {
      console.error('[SessionStore] Redis get failed, checking memory:', error);
      // Fallback to in-memory
      return memoryStore.get(sessionId) || null;
    }
  } else {
    return memoryStore.get(sessionId) || null;
  }
}

/**
 * Delete a session from the store
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `${KEY_PREFIX}${sessionId}`;
  
  // Always clean memory store
  memoryStore.delete(sessionId);
  
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('[SessionStore] Redis delete failed:', error);
    }
  }
}

/**
 * Extend session TTL (keep-alive)
 */
export async function touchSession(sessionId: string): Promise<void> {
  if (redis) {
    try {
      const key = `${KEY_PREFIX}${sessionId}`;
      await redis.expire(key, SESSION_TTL);
    } catch (error) {
      console.error('[SessionStore] Redis touch failed:', error);
    }
  }
  // In-memory doesn't need TTL management
}

/**
 * Check if using Redis
 */
export function isRedisEnabled(): boolean {
  return redis !== null;
}
