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
    default_gateway: 'tplinkmodem.net',
    alt_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['v2', 'v3', 'v4', 'v5'],
    led_indicators: {
      power: ['solid_green', 'off'],
      internet: ['solid_green', 'solid_orange', 'blinking_green', 'off'],
      wifi: ['solid_green', 'blinking_green', 'off'],
      signal: ['1_bar', '2_bars', '3_bars', '4_bars', 'off'],
    },
  },
  'tplink_4g': {
    vendor_id: 'tplink_4g',
    name: 'TP-Link 4G/LTE Router',
    default_gateway: 'tplinkmodem.net',
    alt_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['v3', 'v5'],
    led_indicators: {
      power: ['solid_green', 'off'],
      internet: ['solid_green', 'solid_orange', 'off'],
      wifi_24g: ['solid_green', 'blinking_green', 'off'],
      wifi_5g: ['solid_green', 'blinking_green', 'off'],
      signal: ['1_bar', '2_bars', '3_bars', '4_bars', 'off'],
      lan: ['solid_green', 'off'],
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
export const AKILI_SYSTEM_PROMPT = `You are Akili, a customer service agent helping troubleshoot internet issues.

CRITICAL RULES:
1. ONLY speak what is in YOUR TASK below - do not add extra information
2. Say EXACTLY what YOUR TASK says, then STOP and wait for the user to respond
3. Do NOT mention lights, LEDs, or technical details until the diagnostic step tells you to
4. Do NOT skip ahead or combine steps
5. ONE instruction only, then wait

HOW TO RESPOND:
- Speak the instruction in YOUR TASK naturally
- Stop talking and wait for the user
- If user is confused, rephrase the SAME instruction simply
- If user answers, PathRAG will give you the next step

VOICE STYLE:
- Warm and patient
- Concise - under 2 sentences when possible
- Do not ramble or over-explain

IMPORTANT: Only say what YOUR TASK tells you. Nothing more.`;

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
