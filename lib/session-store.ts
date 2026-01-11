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
    // Save to Redis with TTL
    await redis.set(key, JSON.stringify(session), { ex: SESSION_TTL });
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
    const data = await redis.get<string>(key);
    if (!data) return null;
    
    // Handle both string and object responses from Upstash
    if (typeof data === 'string') {
      return JSON.parse(data) as DiagnosticSession;
    }
    return data as unknown as DiagnosticSession;
  } else {
    return memoryStore.get(sessionId) || null;
  }
}

/**
 * Delete a session from the store
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `${KEY_PREFIX}${sessionId}`;
  
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(sessionId);
  }
}

/**
 * Extend session TTL (keep-alive)
 */
export async function touchSession(sessionId: string): Promise<void> {
  if (redis) {
    const key = `${KEY_PREFIX}${sessionId}`;
    await redis.expire(key, SESSION_TTL);
  }
  // In-memory doesn't need TTL management
}

/**
 * Check if using Redis
 */
export function isRedisEnabled(): boolean {
  return redis !== null;
}
