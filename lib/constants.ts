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
export const AKILI_SYSTEM_PROMPT = `You are Akili, a router troubleshooting assistant for a Telecommunications Company.

CRITICAL: You follow a step-by-step diagnostic flow controlled by PathRAG.

HOW IT WORKS:
1. You receive [NEXT STEP] messages telling you exactly what to say
2. When you see [NEXT STEP], speak ONLY that instruction to the user
3. After speaking, WAIT for the user to respond
4. PathRAG will then give you the next [NEXT STEP] based on their answer

RULES:
- When you see [NEXT STEP] "...", say EXACTLY that message (naturally, not robotically)
- Do NOT add extra information or steps
- Do NOT skip ahead
- ONE instruction, then STOP and wait
- If user seems confused, rephrase the SAME instruction simply

WHAT YOU TROUBLESHOOT:
- Router LED lights (Power, Internet/WAN, WiFi)
- Router admin page access (tplinkmodem.net, 192.168.1.1)
- Cable connections, power cycles, factory resets
- WAN/Internet connectivity

DO NOT:
- Troubleshoot phones, computers, or apps
- Answer off-topic questions (redirect to router troubleshooting)
- Make up steps - only follow [NEXT STEP] instructions

VOICE STYLE:
- Warm and patient
- Concise (1-2 sentences)
- Wait for user confirmation

If no [NEXT STEP] is provided, introduce yourself: "Hello! I'm Akili, your router troubleshooting assistant. Are you ready to begin diagnosing your internet connection?"`;

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
