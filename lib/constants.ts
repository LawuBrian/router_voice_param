import { VoiceName, VoiceOption, VendorProfile, Scenario, ScenarioOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: VoiceName.Verse, label: 'Verse', description: 'Warm & professional' },
  { id: VoiceName.Alloy, label: 'Alloy', description: 'Balanced & clear' },
  { id: VoiceName.Echo, label: 'Echo', description: 'Calm & measured' },
  { id: VoiceName.Shimmer, label: 'Shimmer', description: 'Bright & friendly' },
  { id: VoiceName.Coral, label: 'Coral', description: 'Warm & conversational' },
];

export const SCENARIO_OPTIONS: ScenarioOption[] = [
  { id: Scenario.NoIssues, label: 'Normal Operation', description: 'No preset issues' },
  { id: Scenario.WanDown, label: 'WAN Down (Red Light)', description: 'Internet LED is red/off' },
  { id: Scenario.SlowSpeed, label: 'Slow Internet', description: 'Speed much slower than expected' },
  { id: Scenario.WifiAuthFail, label: 'WiFi Wrong Password', description: 'Cannot connect - password error' },
  { id: Scenario.NoWifiSignal, label: 'No WiFi Signal', description: 'WiFi network not visible' },
  { id: Scenario.Intermittent, label: 'Drops Connection', description: 'Internet keeps disconnecting' },
];

// Vendor profiles for supported routers
export const VENDOR_PROFILES: Record<string, VendorProfile> = {
  'tplink': {
    vendor_id: 'tplink',
    name: 'TP-Link',
    default_gateway: '192.168.0.1',
    login_page_path: '/',
    supported_firmwares: ['v2', 'v3', 'v4'],
    led_indicators: {
      power: ['solid_green', 'off'],
      internet: ['solid_green', 'solid_orange', 'blinking_green', 'off'],
      wifi: ['solid_green', 'blinking_green', 'off'],
    },
  },
  'netgear': {
    vendor_id: 'netgear',
    name: 'NETGEAR',
    default_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['v1', 'v2'],
    led_indicators: {
      power: ['solid_green', 'solid_amber', 'off'],
      internet: ['solid_green', 'solid_amber', 'off'],
      wifi: ['solid_green', 'off'],
    },
  },
  'dlink': {
    vendor_id: 'dlink',
    name: 'D-Link',
    default_gateway: '192.168.0.1',
    login_page_path: '/',
    supported_firmwares: ['v1', 'v2'],
    led_indicators: {
      power: ['solid_green', 'off'],
      internet: ['solid_green', 'solid_red', 'off'],
      wifi: ['solid_green', 'blinking_green', 'off'],
    },
  },
  'asus': {
    vendor_id: 'asus',
    name: 'ASUS',
    default_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['asuswrt', 'merlin'],
    led_indicators: {
      power: ['solid_white', 'off'],
      internet: ['solid_white', 'solid_red', 'off'],
      wifi: ['solid_white', 'off'],
    },
  },
  'generic': {
    vendor_id: 'generic',
    name: 'Generic Router',
    default_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['generic'],
    led_indicators: {
      power: ['on', 'off'],
      internet: ['on', 'blinking', 'off'],
      wifi: ['on', 'off'],
    },
  },
};

// API configuration
export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://param-demo.azurewebsites.net',
  SESSION_ENDPOINT: '/api/session/connect',
};

// Akili system prompt for voice AI - PathRAG feeds diagnostic context
export const AKILI_SYSTEM_PROMPT = `You are Akili, a dedicated Customer Service Agent for a Telecommunications Company. Your SOLE purpose is to help customers troubleshoot internet/network issues.

CRITICAL RULES (NEVER VIOLATE):
1. REFUSE any off-topic questions. If asked about anything unrelated to internet/routers (sports, entertainment, math, etc.), say: "I'm here to help with your internet connection. What issue are you experiencing?"
2. FOLLOW the diagnostic instructions provided in the CURRENT DIAGNOSTIC NODE section EXACTLY
3. SPEAK the instruction from the diagnostic node - do not improvise troubleshooting
4. WAIT for the user to confirm they've done each step before moving on
5. ONE instruction at a time - never stack multiple steps

HOW THIS WORKS:
- You receive context from PathRAG (the diagnostic engine) about the current step
- Speak the instruction provided in voice_instruction
- Wait for user response
- PathRAG will process their answer and give you the next step

VOICE STYLE:
- Be warm, patient, and reassuring
- Speak clearly, especially for technical terms
- Keep responses concise - under 3 sentences when possible
- If user seems confused, rephrase the same instruction more simply
- If user says something unexpected, ask them to clarify

IMPORTANT: The diagnostic context below tells you EXACTLY what to say and ask. Follow it precisely.`;

// LED status descriptions for voice
export const LED_DESCRIPTIONS = {
  solid_green: 'a steady green light',
  solid_orange: 'a steady orange or amber light',
  solid_red: 'a steady red light',
  solid_white: 'a steady white light',
  solid_amber: 'a steady amber light',
  blinking_green: 'a blinking green light',
  blinking_orange: 'a blinking orange light',
  off: 'no light (completely dark)',
  on: 'the light is on',
  blinking: 'the light is blinking',
};
