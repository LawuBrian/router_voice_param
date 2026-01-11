// ============================================
// PathRAG Type Definitions
// Voice-Guided Router Diagnosis System
// ============================================

// Diagnostic Phases
export enum DiagnosticPhase {
  ENTRY = "PHASE_0",
  PHYSICAL_LAYER = "PHASE_1",
  LOCAL_NETWORK = "PHASE_2",
  ROUTER_LOGIN = "PHASE_3",
  WAN_INSPECTION = "PHASE_4",
  CORRECTIVE_ACTIONS = "PHASE_5",
  VERIFICATION = "PHASE_6",
  ESCALATION = "PHASE_7",
  POST_SESSION = "PHASE_8",
}

export const PHASE_LABELS: Record<DiagnosticPhase, string> = {
  [DiagnosticPhase.ENTRY]: "Entry & Setup",
  [DiagnosticPhase.PHYSICAL_LAYER]: "Physical Check",
  [DiagnosticPhase.LOCAL_NETWORK]: "Network Check",
  [DiagnosticPhase.ROUTER_LOGIN]: "Router Access",
  [DiagnosticPhase.WAN_INSPECTION]: "WAN Status",
  [DiagnosticPhase.CORRECTIVE_ACTIONS]: "Fix Actions",
  [DiagnosticPhase.VERIFICATION]: "Verification",
  [DiagnosticPhase.ESCALATION]: "Escalation",
  [DiagnosticPhase.POST_SESSION]: "Complete",
};

// Input types for diagnostic nodes
export type NodeInputType = "user_observation" | "user_action" | "confirmation" | "system_check";

// Allowed actions for corrective phase
export type AllowedAction = 
  | "RECONNECT_SESSION"
  | "SAVE_APPLY"
  | "SOFT_REBOOT"
  | "RESEAT_CABLE"
  | "POWER_CYCLE"
  | "RESET_CREDENTIALS"
  | "FACTORY_RESET";

// Escalation conditions
export interface EscalationConditions {
  user_uncertain?: boolean;
  screen_mismatch?: boolean;
  retry_exceeded?: boolean;
  max_retries?: number;
}

// Diagnostic Node Schema (canonical)
export interface DiagnosticNode {
  node_id: string;
  phase: DiagnosticPhase;
  input_type: NodeInputType;
  question: string;
  voice_instruction: string;
  allowed_assets: string[];
  expected_answers: Record<string, string>; // answer_key -> next_node_id
  actions_allowed: AllowedAction[];
  escalation_conditions: EscalationConditions;
  metadata?: {
    vendor?: string;
    firmware?: string;
    category?: string;
  };
}

// Asset metadata for screenshots and guides
export interface RouterAsset {
  asset_id: string;
  vendor: string;
  firmware: string;
  node_id: string;
  type: "screenshot" | "diagram" | "video" | "document";
  url: string;
  alt_text: string;
  landmarks?: string[]; // UI elements to highlight
}

// Router vendor profiles
export interface VendorProfile {
  vendor_id: string;
  name: string;
  default_gateway: string;
  alt_gateway?: string;
  login_page_path: string;
  supported_firmwares: string[];
  led_indicators: Record<string, string[]>;
}

// Session state
export interface DiagnosticSession {
  session_id: string;
  started_at: number;
  current_node_id: string;
  current_phase: DiagnosticPhase;
  vendor_profile?: VendorProfile;
  history: SessionHistoryEntry[];
  observations: Record<string, string>;
  actions_attempted: ActionAttempt[];
  escalation_payload?: EscalationPayload;
  status: "active" | "resolved" | "escalated" | "abandoned";
}

export interface SessionHistoryEntry {
  node_id: string;
  timestamp: number;
  user_response?: string;
  action_taken?: AllowedAction;
  outcome?: "success" | "failure" | "uncertain";
}

export interface ActionAttempt {
  action: AllowedAction;
  timestamp: number;
  result: "success" | "failure" | "pending";
  notes?: string;
}

export interface EscalationPayload {
  trigger: keyof EscalationConditions;
  steps_completed: string[];
  observations: Record<string, string>;
  actions_attempted: ActionAttempt[];
  suspected_fault_domain: string;
  timestamp: number;
}

// Voice types
export enum VoiceName {
  Verse = "verse",
  Alloy = "alloy",
  Echo = "echo",
  Shimmer = "shimmer",
  Coral = "coral",
}

// Test scenarios
export enum Scenario {
  NoIssues = "NO_ISSUES",
  WanDown = "WAN_DOWN",
  SlowSpeed = "SLOW_SPEED",
  WifiAuthFail = "WIFI_AUTH_FAIL",
  NoWifiSignal = "NO_WIFI_SIGNAL",
  Intermittent = "INTERMITTENT",
}

export interface ScenarioOption {
  id: Scenario;
  label: string;
  description: string;
}

export interface VoiceOption {
  id: VoiceName;
  label: string;
  description: string;
}

// WebRTC message types
export interface WebRTCMessage {
  type: 'connected' | 'disconnected' | 'speech_started' | 'speech_stopped' | 'transcript' | 'error' | 'node_advance';
  content?: string;
  role?: 'user' | 'model';
  error?: string;
  node_id?: string;
  timestamp: number;
}

// Transcript entry
export interface TranscriptEntry {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  node_id?: string;
  asset_id?: string;
}

// Path traversal result
export interface PathTraversalResult {
  next_node: DiagnosticNode | null;
  should_escalate: boolean;
  escalation_reason?: string;
  assets_to_show: RouterAsset[];
}
