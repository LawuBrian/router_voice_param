// ============================================
// PathRAG Diagnostic Engine API Route
// Handles diagnostic path traversal and state management
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSession, 
  getCurrentNode, 
  processResponse, 
  advanceSession,
  generateVoiceContext,
  getProgressPercentage,
} from '@/lib/pathrag-engine';
import { getAssetsForNode } from '@/lib/assets';
import { saveSession, getSession, isRedisEnabled } from '@/lib/session-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, response, vendorId } = body;

    switch (action) {
      case 'create':
        return await handleCreateSession(vendorId);
      
      case 'process':
        return await handleProcessResponse(sessionId, response);
      
      case 'getState':
        return await handleGetState(sessionId);
      
      case 'getContext':
        return await handleGetContext(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[PathRAG] API error:', error);
    return NextResponse.json(
      { error: `PathRAG error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleCreateSession(vendorId?: string) {
  const session = createSession(vendorId);
  
  // Save to session store (Redis or in-memory)
  await saveSession(session);
  
  const currentNode = getCurrentNode(session);
  const assets = currentNode ? getAssetsForNode(currentNode.node_id) : [];
  
  console.log(`[PathRAG] Session created: ${session.session_id} (Redis: ${isRedisEnabled()})`);
  
  return NextResponse.json({
    session_id: session.session_id,
    current_node: currentNode,
    assets,
    phase: session.current_phase,
    progress: getProgressPercentage(session),
    voice_context: generateVoiceContext(session),
  });
}

async function handleProcessResponse(sessionId: string, response: string) {
  const session = await getSession(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  // Process the user response
  const result = processResponse(session, response);
  
  // Advance the session
  const updatedSession = advanceSession(session, response, result);
  
  // Save updated session
  await saveSession(updatedSession);
  
  // Get assets for the new node
  const assets = result.next_node ? getAssetsForNode(result.next_node.node_id) : [];
  
  console.log(`[PathRAG] Session ${sessionId}: ${session.current_node_id} -> ${updatedSession.current_node_id}`);
  
  return NextResponse.json({
    session_id: sessionId,
    current_node: result.next_node || getCurrentNode(updatedSession),
    assets,
    phase: updatedSession.current_phase,
    progress: getProgressPercentage(updatedSession),
    should_escalate: result.should_escalate,
    escalation_reason: result.escalation_reason,
    escalation_payload: updatedSession.escalation_payload,
    status: updatedSession.status,
    voice_context: generateVoiceContext(updatedSession),
  });
}

async function handleGetState(sessionId: string) {
  const session = await getSession(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  const currentNode = getCurrentNode(session);
  const assets = currentNode ? getAssetsForNode(currentNode.node_id) : [];
  
  return NextResponse.json({
    session_id: session.session_id,
    current_node: currentNode,
    assets,
    phase: session.current_phase,
    progress: getProgressPercentage(session),
    history: session.history,
    observations: session.observations,
    status: session.status,
    escalation_payload: session.escalation_payload,
  });
}

async function handleGetContext(sessionId: string) {
  const session = await getSession(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    voice_context: generateVoiceContext(session),
  });
}
