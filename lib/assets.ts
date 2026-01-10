// ============================================
// Router Assets & Screenshot Metadata
// Curated visual guides for PathRAG nodes
// ============================================

import { RouterAsset } from './types';

// Base URL for assets (can be configured for CDN)
const ASSET_BASE_URL = '/assets/router-guides';

export const ROUTER_ASSETS: RouterAsset[] = [
  // ========================================
  // General / Intro Assets
  // ========================================
  {
    asset_id: 'intro_diagram',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'entry_start',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/intro-diagram.svg`,
    alt_text: 'Router diagnosis flow overview showing the step-by-step process',
    landmarks: ['power_check', 'led_check', 'login', 'wan_status'],
  },
  {
    asset_id: 'router_brands_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'entry_router_identify',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/router-brands.svg`,
    alt_text: 'Common router brands: TP-Link, NETGEAR, D-Link, ASUS logos',
    landmarks: ['tplink_logo', 'netgear_logo', 'dlink_logo', 'asus_logo'],
  },

  // ========================================
  // LED Guide Assets
  // ========================================
  {
    asset_id: 'led_power_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_power_led',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/led-power-guide.svg`,
    alt_text: 'Power LED status guide: green=on, orange=issue, blinking=booting, off=no power',
    landmarks: ['power_led', 'status_green', 'status_orange', 'status_off'],
  },
  {
    asset_id: 'tplink_led_diagram',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'physical_power_led',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/tplink-led-layout.svg`,
    alt_text: 'TP-Link router LED layout showing Power, Internet, WiFi, and LAN lights',
    landmarks: ['power', 'internet', 'wifi', '2.4G', '5G', 'lan_ports'],
  },
  {
    asset_id: 'led_internet_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_internet_led',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/led-internet-guide.svg`,
    alt_text: 'Internet LED status guide: green=connected, orange/red=issue, blinking=connecting',
    landmarks: ['internet_led', 'status_green', 'status_orange', 'status_blinking'],
  },

  // ========================================
  // Cable & Connection Assets
  // ========================================
  {
    asset_id: 'power_cable_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_power_off',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/power-cable-guide.svg`,
    alt_text: 'Router power cable connection diagram showing power adapter and outlet',
    landmarks: ['power_port', 'adapter', 'outlet'],
  },
  {
    asset_id: 'power_cycle_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_power_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/power-cycle-guide.svg`,
    alt_text: 'Power cycle instructions: unplug, wait 10 seconds, plug back in',
    landmarks: ['step1_unplug', 'step2_wait', 'step3_plugin'],
  },
  {
    asset_id: 'wan_port_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_wan_cable_check',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/wan-port-guide.svg`,
    alt_text: 'WAN port location on router back panel - usually blue or yellow colored port',
    landmarks: ['wan_port', 'lan_ports', 'ethernet_cable'],
  },
  {
    asset_id: 'cable_check_diagram',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_wan_cable_check',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/cable-check.svg`,
    alt_text: 'Check ethernet cable is clicked in securely at both ends',
    landmarks: ['cable_end_1', 'cable_end_2', 'click_indicator'],
  },
  {
    asset_id: 'ont_connection_diagram',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_wan_connect',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/ont-connection.svg`,
    alt_text: 'Connection from fiber ONT box to router WAN port',
    landmarks: ['ont_box', 'ethernet_cable', 'router_wan_port'],
  },
  {
    asset_id: 'cable_reseat_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'physical_wan_reseat',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/cable-reseat.svg`,
    alt_text: 'Steps to reseat ethernet cable: unplug, inspect, plug back firmly',
    landmarks: ['unplug', 'inspect', 'replug'],
  },

  // ========================================
  // Network Connection Assets
  // ========================================
  {
    asset_id: 'connection_types_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'local_network_check',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/connection-types.svg`,
    alt_text: 'WiFi vs Ethernet connection types illustration',
    landmarks: ['wifi_icon', 'ethernet_cable', 'device'],
  },
  {
    asset_id: 'wifi_icon_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'local_wifi_connected',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/wifi-icons.svg`,
    alt_text: 'WiFi icon states: connected (full bars), disconnected (x mark), no network',
    landmarks: ['connected', 'disconnected', 'no_network'],
  },
  {
    asset_id: 'wifi_connect_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'local_wifi_reconnect',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/wifi-connect.svg`,
    alt_text: 'Steps to connect to WiFi: Settings > WiFi > Select Network > Enter Password',
    landmarks: ['settings', 'wifi_list', 'password_prompt'],
  },
  {
    asset_id: 'ethernet_connection_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'local_ethernet_check',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/ethernet-connection.svg`,
    alt_text: 'Ethernet cable connected from computer to router LAN port',
    landmarks: ['computer_port', 'router_lan_port', 'cable'],
  },

  // ========================================
  // Router UI Assets - TP-Link
  // ========================================
  {
    asset_id: 'browser_address_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'local_browser_test',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/browser-address.svg`,
    alt_text: 'Type 192.168.0.1 in browser address bar',
    landmarks: ['address_bar', 'ip_address'],
  },
  {
    asset_id: 'router_login_tplink',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'local_browser_test',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-login.png`,
    alt_text: 'TP-Link router login page with username and password fields',
    landmarks: ['username_field', 'password_field', 'login_button'],
  },
  {
    asset_id: 'default_credentials_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'router_login_prompt',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/default-credentials.svg`,
    alt_text: 'Default router credentials: admin/admin or admin/password',
    landmarks: ['username', 'password', 'sticker_location'],
  },
  {
    asset_id: 'router_sticker_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'router_login_failed',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/router-sticker.svg`,
    alt_text: 'Look for credentials sticker on bottom or back of router',
    landmarks: ['sticker_bottom', 'sticker_back', 'credentials_area'],
  },
  {
    asset_id: 'tplink_dashboard',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'router_dashboard_confirm',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-dashboard.png`,
    alt_text: 'TP-Link router main dashboard showing network map and status',
    landmarks: ['network_map', 'internet_status', 'connected_devices', 'menu'],
  },
  {
    asset_id: 'dashboard_overview_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'router_dashboard_confirm',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/dashboard-overview.svg`,
    alt_text: 'Router dashboard layout with sidebar menu and status panels',
    landmarks: ['sidebar', 'status_panel', 'quick_actions'],
  },
  {
    asset_id: 'tplink_navigation_guide',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'router_navigate_status',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-nav.png`,
    alt_text: 'TP-Link navigation menu highlighting Network Status option',
    landmarks: ['network_menu', 'status_option', 'internet_option'],
  },

  // ========================================
  // WAN Status Assets
  // ========================================
  {
    asset_id: 'wan_status_connected',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'wan_status_check',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-wan-connected.png`,
    alt_text: 'TP-Link WAN status showing Connected with IP address',
    landmarks: ['status_connected', 'ip_address', 'gateway', 'dns'],
  },
  {
    asset_id: 'wan_status_disconnected',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'wan_status_check',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-wan-disconnected.png`,
    alt_text: 'TP-Link WAN status showing Disconnected',
    landmarks: ['status_disconnected', 'connect_button'],
  },
  {
    asset_id: 'wan_status_connecting',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'wan_status_wait',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-wan-connecting.png`,
    alt_text: 'TP-Link WAN status showing Connecting with progress indicator',
    landmarks: ['status_connecting', 'progress'],
  },
  {
    asset_id: 'wan_ip_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'wan_ip_check',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/wan-ip-guide.svg`,
    alt_text: 'WAN IP address display - valid IP vs 0.0.0.0',
    landmarks: ['valid_ip', 'invalid_ip'],
  },

  // ========================================
  // Action Assets
  // ========================================
  {
    asset_id: 'wan_reconnect_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'action_reconnect_wan',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/wan-reconnect.svg`,
    alt_text: 'Click Connect or Apply button to reconnect WAN',
    landmarks: ['connect_button', 'apply_button'],
  },
  {
    asset_id: 'reboot_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'action_reboot_router',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/reboot-guide.svg`,
    alt_text: 'Navigate to System Tools > Reboot',
    landmarks: ['system_tools', 'reboot_option', 'confirm_button'],
  },
  {
    asset_id: 'tplink_system_tools',
    vendor: 'tplink',
    firmware: 'v2',
    node_id: 'action_reboot_router',
    type: 'screenshot',
    url: `${ASSET_BASE_URL}/tplink-system-reboot.png`,
    alt_text: 'TP-Link System Tools page with Reboot option',
    landmarks: ['system_tools_menu', 'reboot_button'],
  },

  // ========================================
  // Verification & Success Assets
  // ========================================
  {
    asset_id: 'internet_test_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'verification_internet_test',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/internet-test.svg`,
    alt_text: 'Open browser and visit google.com to test connection',
    landmarks: ['browser', 'google_page'],
  },
  {
    asset_id: 'success_diagram',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'verification_complete',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/success.svg`,
    alt_text: 'Connection successful! Green checkmark with connected diagram',
    landmarks: ['checkmark', 'connected_path'],
  },

  // ========================================
  // Escalation Assets
  // ========================================
  {
    asset_id: 'escalation_hardware_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_hardware',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/escalation-hardware.svg`,
    alt_text: 'Hardware issue - contact manufacturer or ISP',
    landmarks: ['router', 'warning', 'support_contact'],
  },
  {
    asset_id: 'escalation_isp_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_wan_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/escalation-isp.svg`,
    alt_text: 'ISP issue - contact internet service provider',
    landmarks: ['isp_logo', 'phone', 'support'],
  },
  {
    asset_id: 'escalation_wifi_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_wifi_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/escalation-wifi.svg`,
    alt_text: 'WiFi troubleshooting - try different device or wired connection',
    landmarks: ['wifi_icon', 'alternate_device', 'ethernet_option'],
  },
  {
    asset_id: 'escalation_access_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_access_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/escalation-access.svg`,
    alt_text: 'Cannot access router - check network settings or contact support',
    landmarks: ['network_settings', 'support_contact'],
  },
  {
    asset_id: 'factory_reset_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_login_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/factory-reset.svg`,
    alt_text: 'Factory reset button location and instructions',
    landmarks: ['reset_button', 'paperclip', 'hold_duration'],
  },
  {
    asset_id: 'dns_settings_guide',
    vendor: 'generic',
    firmware: 'generic',
    node_id: 'escalation_dns_issue',
    type: 'diagram',
    url: `${ASSET_BASE_URL}/dns-settings.svg`,
    alt_text: 'Change DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)',
    landmarks: ['dns_field', 'google_dns', 'cloudflare_dns'],
  },
];

// Get assets for a specific node
export function getAssetsForNode(nodeId: string): RouterAsset[] {
  return ROUTER_ASSETS.filter(asset => asset.node_id === nodeId);
}

// Get assets by vendor
export function getAssetsForVendor(vendorId: string): RouterAsset[] {
  return ROUTER_ASSETS.filter(asset => 
    asset.vendor === vendorId || asset.vendor === 'generic'
  );
}

// Get specific asset by ID
export function getAssetById(assetId: string): RouterAsset | null {
  return ROUTER_ASSETS.find(asset => asset.asset_id === assetId) || null;
}

// Generate placeholder SVG for missing assets
export function getPlaceholderSvg(altText: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#1a222d" width="400" height="300"/>
      <rect fill="#2a3544" x="20" y="20" width="360" height="260" rx="8"/>
      <text fill="#6b7a8f" font-family="system-ui" font-size="14" x="200" y="150" text-anchor="middle">
        ${altText.substring(0, 50)}
      </text>
      <path fill="none" stroke="#00d4aa" stroke-width="2" d="M180 120 L200 100 L220 120 M200 100 V180"/>
    </svg>
  `)}`;
}
