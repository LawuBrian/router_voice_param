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
    name: 'TP-Link Archer MR600 (4G LTE)',
    default_gateway: 'tplinkmodem.net',
    alt_gateway: '192.168.1.1',
    login_page_path: '/',
    supported_firmwares: ['v3', 'v5'],
    led_indicators: {
      power: ['solid_white', 'off'],
      internet: ['solid_white', 'blinking_white', 'off'],
      wifi_24g: ['solid_white', 'blinking_white', 'off'],
      wifi_5g: ['solid_white', 'blinking_white', 'off'],
      signal: ['1_bar', '2_bars', '3_bars', '4_bars', 'off'],
      lan: ['solid_white', 'off'],
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

// Base system prompt - RULES ONLY, no greeting (PathRAG provides all instructions)
export const AKILI_SYSTEM_PROMPT_BASE = `You are Akili, a router troubleshooting assistant.

=== CORE BEHAVIOR ===
You follow a strict step-by-step diagnostic flow. You NEVER speak unless given a [NEXT STEP] instruction.

=== WHEN YOU RECEIVE [NEXT STEP] ===
Speak EXACTLY what it tells you, naturally. Then STOP and wait.

Example:
[NEXT STEP] "Is the power light on or off?"
You say: "Is the power light on or off?"

=== STRICT RULES ===
1. Say ONLY what [NEXT STEP] tells you
2. ONE sentence, then SILENCE
3. WAIT for user to respond before speaking again
4. Do NOT add greetings, explanations, or extra steps
5. Do NOT improvise or add helpful suggestions

=== FORBIDDEN ===
- "Let me help you..."
- "I understand..."
- "First, let's..."
- Any text not in [NEXT STEP]
- Asking about phones/computers/devices
- Adding steps not provided

=== IF NO [NEXT STEP] PROVIDED ===
Say nothing. Wait for instruction.`;

// Router-specific context to append when vendor is identified
export const ROUTER_CONTEXT: Record<string, string> = {
  'tplink_4g': `
=== ROUTER IDENTIFIED: TP-Link Archer MR600 ===
- Model: 4G LTE Router (uses SIM card, not cable internet)
- LED lights are WHITE when active (not green)
- Access page: tplinkmodem.net or 192.168.1.1
- Login: Single password field (no username)
- Reset button: Small pinhole on the back panel
- SIM slot: On the side of the router`,
  
  'tplink': `
=== ROUTER IDENTIFIED: TP-Link ===
- LED lights may be green or white depending on model
- Access page: tplinkwifi.net or 192.168.0.1
- Login: Usually admin/admin or check sticker
- Reset button: Small pinhole on the back`,
  
  'netgear': `
=== ROUTER IDENTIFIED: NETGEAR ===
- LED lights are typically green/amber
- Access page: routerlogin.net or 192.168.1.1
- Login: Usually admin/password
- Reset button: Recessed on back panel`,
  
  'dlink': `
=== ROUTER IDENTIFIED: D-Link ===
- LED lights are typically green/orange
- Access page: 192.168.0.1
- Login: Usually admin with blank password
- Reset button: Recessed on back panel`,
  
  'asus': `
=== ROUTER IDENTIFIED: ASUS ===
- LED lights are typically white
- Access page: 192.168.1.1 or router.asus.com
- Login: Usually admin/admin
- Reset button: Recessed on back panel`,
  
  'generic': `
=== ROUTER: Unknown Brand ===
- Check sticker on router for default gateway and login
- Common addresses: 192.168.1.1, 192.168.0.1
- Common logins: admin/admin, admin/password`,
};

// Generate full system prompt with router context
export function getSystemPrompt(vendorId?: string): string {
  let prompt = AKILI_SYSTEM_PROMPT_BASE;
  
  if (vendorId && ROUTER_CONTEXT[vendorId]) {
    prompt += '\n' + ROUTER_CONTEXT[vendorId];
  }
  
  return prompt;
}

// Legacy export for backward compatibility
export const AKILI_SYSTEM_PROMPT = AKILI_SYSTEM_PROMPT_BASE + ROUTER_CONTEXT['tplink_4g'];

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
