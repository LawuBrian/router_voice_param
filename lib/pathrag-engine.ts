// ============================================
// PathRAG Diagnostic Path Engine
// Deterministic graph traversal for router diagnosis
// ============================================

import {
  DiagnosticNode,
  DiagnosticSession,
  DiagnosticPhase,
  PathTraversalResult,
  EscalationPayload,
  SessionHistoryEntry,
  AllowedAction,
  ActionAttempt,
  PHASE_LABELS,
} from './types';
import { DIAGNOSTIC_NODES, getNodeById } from './nodes';
import { getAssetsForNode } from './assets';
import { VENDOR_PROFILES, getSystemPrompt, ROUTER_CONTEXT } from './constants';

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new diagnostic session
export function createSession(vendorId?: string): DiagnosticSession {
  const entryNode = DIAGNOSTIC_NODES.find(n => n.node_id === 'entry_start');
  
  return {
    session_id: generateSessionId(),
    started_at: Date.now(),
    current_node_id: entryNode?.node_id || 'entry_start',
    current_phase: DiagnosticPhase.ENTRY,
    history: [],
    observations: {},
    actions_attempted: [],
    status: 'active',
  };
}

// Get the current node for a session
export function getCurrentNode(session: DiagnosticSession): DiagnosticNode | null {
  return getNodeById(session.current_node_id);
}

// Process user response and determine next node
export function processResponse(
  session: DiagnosticSession,
  response: string
): PathTraversalResult {
  const currentNode = getCurrentNode(session);
  
  if (!currentNode) {
    return {
      next_node: null,
      should_escalate: true,
      escalation_reason: 'Current node not found',
      assets_to_show: [],
    };
  }

  // Normalize response for matching
  const normalizedResponse = response.toLowerCase().trim();
  
  // Check for escalation triggers
  if (shouldEscalate(currentNode, normalizedResponse, session)) {
    return {
      next_node: null,
      should_escalate: true,
      escalation_reason: getEscalationReason(currentNode, normalizedResponse, session),
      assets_to_show: [],
    };
  }

  // Find matching answer
  const nextNodeId = findMatchingAnswer(currentNode, normalizedResponse);
  
  if (!nextNodeId) {
    // No matching answer - check if we should retry or escalate
    const retryCount = countRetries(session, currentNode.node_id);
    const maxRetries = currentNode.escalation_conditions.max_retries || 3;
    
    if (retryCount >= maxRetries) {
      return {
        next_node: null,
        should_escalate: true,
        escalation_reason: 'Maximum retries exceeded',
        assets_to_show: getAssetsForNode(currentNode.node_id),
      };
    }
    
    // Return same node for retry
    return {
      next_node: currentNode,
      should_escalate: false,
      assets_to_show: getAssetsForNode(currentNode.node_id),
    };
  }

  // Get next node
  const nextNode = getNodeById(nextNodeId);
  
  if (!nextNode) {
    return {
      next_node: null,
      should_escalate: true,
      escalation_reason: `Next node '${nextNodeId}' not found in path`,
      assets_to_show: [],
    };
  }

  return {
    next_node: nextNode,
    should_escalate: false,
    assets_to_show: getAssetsForNode(nextNode.node_id),
  };
}

// Detect vendor from user response
function detectVendor(response: string): string | null {
  const normalizedResponse = response.toLowerCase().trim();
  
  // TP-Link detection (prioritize 4G/MR600 for now)
  if (normalizedResponse.includes('tp-link') || 
      normalizedResponse.includes('tplink') || 
      normalizedResponse.includes('tp link') ||
      normalizedResponse.includes('mr600') ||
      normalizedResponse.includes('archer')) {
    return 'tplink_4g'; // Default to MR600 for demo
  }
  
  if (normalizedResponse.includes('netgear')) {
    return 'netgear';
  }
  
  if (normalizedResponse.includes('d-link') || normalizedResponse.includes('dlink')) {
    return 'dlink';
  }
  
  if (normalizedResponse.includes('asus')) {
    return 'asus';
  }
  
  return null;
}

// Advance session to next node
export function advanceSession(
  session: DiagnosticSession,
  response: string,
  result: PathTraversalResult
): DiagnosticSession {
  const historyEntry: SessionHistoryEntry = {
    node_id: session.current_node_id,
    timestamp: Date.now(),
    user_response: response,
    outcome: result.should_escalate ? 'failure' : 'success',
  };

  const newSession: DiagnosticSession = {
    ...session,
    history: [...session.history, historyEntry],
    observations: {
      ...session.observations,
      [session.current_node_id]: response,
    },
  };

  // Detect vendor when at router identification node
  if (session.current_node_id === 'entry_router_identify' && !newSession.vendor_profile) {
    const vendorId = detectVendor(response);
    if (vendorId && VENDOR_PROFILES[vendorId]) {
      newSession.vendor_profile = VENDOR_PROFILES[vendorId];
      console.log(`[PathRAG] Vendor detected: ${VENDOR_PROFILES[vendorId].name}`);
    } else {
      // Default to generic if not recognized
      newSession.vendor_profile = VENDOR_PROFILES['generic'];
      console.log('[PathRAG] Using generic vendor profile');
    }
  }

  if (result.should_escalate) {
    newSession.status = 'escalated';
    newSession.escalation_payload = createEscalationPayload(
      newSession,
      result.escalation_reason || 'Unknown'
    );
  } else if (result.next_node) {
    newSession.current_node_id = result.next_node.node_id;
    newSession.current_phase = result.next_node.phase;
    
    // Check if we've reached resolution
    if (result.next_node.node_id === 'verification_complete') {
      newSession.status = 'resolved';
    }
  }

  return newSession;
}

// Record an action attempt
export function recordAction(
  session: DiagnosticSession,
  action: AllowedAction,
  result: 'success' | 'failure' | 'pending'
): DiagnosticSession {
  const attempt: ActionAttempt = {
    action,
    timestamp: Date.now(),
    result,
  };

  return {
    ...session,
    actions_attempted: [...session.actions_attempted, attempt],
  };
}

// Check if response should trigger escalation
function shouldEscalate(
  node: DiagnosticNode,
  response: string,
  session: DiagnosticSession
): boolean {
  const { escalation_conditions } = node;
  
  // User expresses uncertainty
  if (escalation_conditions.user_uncertain) {
    const uncertainPhrases = ['not sure', "don't know", 'confused', "can't tell", 'help', 'unsure', "i don't see"];
    if (uncertainPhrases.some(phrase => response.includes(phrase))) {
      return true;
    }
  }

  // Screen mismatch
  if (escalation_conditions.screen_mismatch) {
    const mismatchPhrases = ["doesn't match", 'different', 'not the same', "don't see that", 'looks different'];
    if (mismatchPhrases.some(phrase => response.includes(phrase))) {
      return true;
    }
  }

  // Retry exceeded
  if (escalation_conditions.retry_exceeded) {
    const retryCount = countRetries(session, node.node_id);
    const maxRetries = escalation_conditions.max_retries || 3;
    if (retryCount >= maxRetries) {
      return true;
    }
  }

  return false;
}

// Get reason for escalation
function getEscalationReason(
  node: DiagnosticNode,
  response: string,
  session: DiagnosticSession
): string {
  const uncertainPhrases = ['not sure', "don't know", 'confused', "can't tell", 'help', 'unsure'];
  const mismatchPhrases = ["doesn't match", 'different', 'not the same', "don't see that"];

  if (uncertainPhrases.some(phrase => response.includes(phrase))) {
    return 'User expressed uncertainty';
  }
  
  if (mismatchPhrases.some(phrase => response.includes(phrase))) {
    return 'Screen does not match expected layout';
  }

  const retryCount = countRetries(session, node.node_id);
  if (retryCount >= (node.escalation_conditions.max_retries || 3)) {
    return 'Maximum retry attempts exceeded';
  }

  return 'Unable to proceed with diagnosis';
}

// Find matching answer from expected answers
function findMatchingAnswer(node: DiagnosticNode, response: string): string | null {
  const { expected_answers } = node;
  
  // Direct key match
  if (expected_answers[response]) {
    return expected_answers[response];
  }

  // Fuzzy matching for common responses
  for (const [answerKey, nextNodeId] of Object.entries(expected_answers)) {
    const keyVariants = getAnswerVariants(answerKey);
    if (keyVariants.some(variant => response.includes(variant))) {
      return nextNodeId;
    }
  }

  // Handle yes/no confirmations
  if (response.includes('yes') || response.includes('correct') || response.includes('right') || response.includes('confirmed')) {
    if (expected_answers['yes'] || expected_answers['confirmed'] || expected_answers['correct']) {
      return expected_answers['yes'] || expected_answers['confirmed'] || expected_answers['correct'];
    }
  }
  
  if (response.includes('no') || response.includes('wrong') || response.includes("didn't work")) {
    if (expected_answers['no'] || expected_answers['failed'] || expected_answers['wrong']) {
      return expected_answers['no'] || expected_answers['failed'] || expected_answers['wrong'];
    }
  }

  return null;
}

// Get variants for answer matching
function getAnswerVariants(answerKey: string): string[] {
  const variantMap: Record<string, string[]> = {
    'green': ['green', 'solid green', 'steady green'],
    'red': ['red', 'solid red', 'steady red'],
    'orange': ['orange', 'amber', 'solid orange', 'solid amber'],
    'blinking': ['blinking', 'flashing', 'flickering'],
    'off': ['off', 'no light', 'dark', 'not lit'],
    'connected': ['connected', 'online', 'working'],
    'disconnected': ['disconnected', 'offline', 'not working', 'down'],
    'yes': ['yes', 'yeah', 'yep', 'correct', 'right', 'ok', 'okay', 'confirmed', 'done', 'i see it'],
    'no': ['no', 'nope', "can't", 'wrong', 'not'],
  };

  return variantMap[answerKey] || [answerKey];
}

// Count retries for a specific node
function countRetries(session: DiagnosticSession, nodeId: string): number {
  return session.history.filter(entry => entry.node_id === nodeId).length;
}

// Create escalation payload
function createEscalationPayload(
  session: DiagnosticSession,
  trigger: string
): EscalationPayload {
  const completedNodes = session.history.map(h => h.node_id);
  
  // Determine suspected fault domain based on phase
  let faultDomain = 'Unknown';
  switch (session.current_phase) {
    case DiagnosticPhase.PHYSICAL_LAYER:
      faultDomain = 'Physical/Hardware';
      break;
    case DiagnosticPhase.LOCAL_NETWORK:
      faultDomain = 'Local Network/Device';
      break;
    case DiagnosticPhase.ROUTER_LOGIN:
      faultDomain = 'Router Access/Authentication';
      break;
    case DiagnosticPhase.WAN_INSPECTION:
      faultDomain = 'WAN/ISP Connection';
      break;
    case DiagnosticPhase.CORRECTIVE_ACTIONS:
      faultDomain = 'Configuration/Settings';
      break;
    default:
      faultDomain = 'Undetermined';
  }

  return {
    trigger: 'user_uncertain', // Simplified - actual implementation would map properly
    steps_completed: completedNodes,
    observations: session.observations,
    actions_attempted: session.actions_attempted,
    suspected_fault_domain: faultDomain,
    timestamp: Date.now(),
  };
}

// Get progress percentage through diagnostic path
export function getProgressPercentage(session: DiagnosticSession): number {
  const phaseOrder = [
    DiagnosticPhase.ENTRY,
    DiagnosticPhase.PHYSICAL_LAYER,
    DiagnosticPhase.LOCAL_NETWORK,
    DiagnosticPhase.ROUTER_LOGIN,
    DiagnosticPhase.WAN_INSPECTION,
    DiagnosticPhase.CORRECTIVE_ACTIONS,
    DiagnosticPhase.VERIFICATION,
  ];
  
  const currentIndex = phaseOrder.indexOf(session.current_phase);
  if (currentIndex === -1) return 100;
  
  return Math.round((currentIndex / (phaseOrder.length - 1)) * 100);
}

// Generate voice context for current node - this is what PathRAG feeds to Akili
export function generateVoiceContext(session: DiagnosticSession): string {
  const node = getCurrentNode(session);
  if (!node) return '';

  const expectedKeys = Object.keys(node.expected_answers);
  const phase = PHASE_LABELS[node.phase] || node.phase;

  // Get router-specific context
  const vendorId = session.vendor_profile?.vendor_id;
  const routerContext = vendorId && ROUTER_CONTEXT[vendorId] ? ROUTER_CONTEXT[vendorId] : '';

  // Build a clear, structured context for Akili
  let context = `
NODE_ID: ${node.node_id}
PHASE: ${phase}
${routerContext}

YOUR TASK: ${node.voice_instruction}

VALID RESPONSES: ${expectedKeys.slice(0, 5).join(', ')}

RULES:
- Say the instruction above naturally
- ONE sentence, then STOP
- Wait for user response
`;

  // Add router-specific LED info if we're checking LEDs
  if (node.node_id.includes('led') || node.node_id.includes('power') || node.node_id.includes('internet')) {
    if (vendorId === 'tplink_4g') {
      context += `\nNOTE: MR600 LEDs are WHITE when active, not green.\n`;
    }
  }

  // Add gateway info if we're checking browser access
  if (node.node_id.includes('browser') || node.node_id.includes('login') || node.node_id.includes('gateway')) {
    const profile = session.vendor_profile;
    if (profile) {
      context += `\nROUTER ACCESS: ${profile.default_gateway}`;
      if (profile.alt_gateway) {
        context += ` or ${profile.alt_gateway}`;
      }
      context += '\n';
    }
  }

  return context.trim();
}
