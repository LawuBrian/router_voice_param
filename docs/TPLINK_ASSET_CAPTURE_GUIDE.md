# TP-Link Archer MR600 Asset Capture Guide

This document maps each diagnostic node to the specific TP-Link FAQ pages and screenshots needed.

## Router Info
- **Model**: Archer MR600 (4G LTE Router)
- **Default Access**: `http://tplinkmodem.net` or `192.168.1.1`
- **Support Page**: https://www.tp-link.com/za/support/download/archer-mr600/#FAQs

---

## Quick Capture Checklist

### Priority 1: Critical Screenshots (Demo Essentials)

| Asset ID | Node | What to Capture | Source FAQ |
|----------|------|-----------------|------------|
| `tplink_mr600_login` | router_login_prompt | Login page screenshot | [How to log in](https://www.tp-link.com/za/support/faq/3385/) |
| `tplink_mr600_dashboard` | router_dashboard_confirm | Main dashboard/status page | After login |
| `tplink_mr600_wan_connected` | wan_status_check | Network Status showing "Connected" | Network > Status |
| `tplink_mr600_wan_disconnected` | wan_status_check | Network Status showing "Disconnected" | Network > Status |
| `tplink_mr600_led_layout` | physical_power_led | Front panel LED layout | Product photos or setup guide |
| `tplink_mr600_back_panel` | physical_wan_cable_check | Back panel showing ports | Product photos |
| `tplink_mr600_reset_button` | router_factory_reset_locate | Reset button location | [Factory reset FAQ] |

### Priority 2: Troubleshooting Screenshots

| Asset ID | Node | What to Capture | Source FAQ |
|----------|------|-----------------|------------|
| `tplink_mr600_no_sim` | (new node) | "No SIM card" error | [SIM card detection](https://www.tp-link.com/za/support/faq/3025/) |
| `tplink_mr600_apn_settings` | (new node) | APN configuration page | [APN profile FAQ](https://www.tp-link.com/za/support/faq/2852/) |
| `tplink_mr600_system_reboot` | action_reboot_router | System Tools > Reboot page | Advanced > System Tools |
| `tplink_mr600_signal_strength` | (new node) | 4G signal strength display | Status page |

---

## Detailed Capture Instructions

### 1. LED Panel Photo
**Node**: `physical_power_led`, `physical_internet_led`

The Archer MR600 has these LEDs (left to right):
- Power (solid green = on)
- Internet (green = connected, orange = connecting, off = no connection)
- WiFi (2.4G and 5G)
- Signal Strength (bars)
- LAN

**Capture**: Take a photo of the front panel, or screenshot from TP-Link product page.

---

### 2. Login Page
**Node**: `router_login_prompt`
**URL**: `http://tplinkmodem.net` or `http://192.168.1.1`

**Capture**: 
1. Open browser
2. Navigate to router address
3. Screenshot the login page (shows password field)

**Note**: MR600 uses a single password field (no username), unlike older TP-Link models.

---

### 3. Dashboard / Status Page
**Node**: `router_dashboard_confirm`

**Capture**:
1. Login to router
2. Screenshot the main dashboard showing:
   - Network map/topology
   - Internet status
   - Connected devices count
   - Signal strength (for 4G)

---

### 4. WAN/Internet Status
**Node**: `wan_status_check`, `wan_ip_check`

**Navigate**: Advanced > Network > Internet

**Capture 3 states**:
1. **Connected** - Shows IP address, gateway, DNS
2. **Disconnected** - Shows error or "Not Connected"
3. **Connecting** - Shows "Obtaining IP" or progress

---

### 5. Back Panel / Ports
**Node**: `physical_wan_cable_check`, `physical_wan_connect`

The MR600 back panel has:
- Power port
- WAN/LAN port (yellow)
- LAN ports
- Reset button (pinhole)
- SIM card slot

**Capture**: Photo of back panel with ports labeled

---

### 6. Reset Button Location
**Node**: `router_factory_reset_locate`, `router_factory_reset_execute`

**Capture**: Close-up of the reset pinhole on back panel

---

### 7. System Tools / Reboot
**Node**: `action_reboot_router`

**Navigate**: Advanced > System > Reboot

**Capture**: Screenshot showing the Reboot button

---

### 8. SIM Card Slot (4G Specific)
**Node**: (potential new flow for 4G troubleshooting)

**Capture**: 
- SIM slot location (side of router)
- Correct SIM orientation

---

## FAQ Pages with Useful Images

### Must-Visit FAQ Articles:

1. **Login Guide**: 
   - https://www.tp-link.com/za/support/faq/3385/
   - Contains: Login page screenshots

2. **No Internet - Case 1**:
   - https://www.tp-link.com/za/support/faq/2870/
   - Contains: APN settings, network status screenshots

3. **No Internet - Case 2**:
   - https://www.tp-link.com/za/support/faq/2876/
   - Contains: Troubleshooting flow diagrams

4. **SIM Card Not Detected**:
   - https://www.tp-link.com/za/support/faq/3025/
   - Contains: SIM slot images, error screenshots

5. **APN Profile Issues**:
   - https://www.tp-link.com/za/support/faq/2852/
   - Contains: APN configuration page

6. **Low Speed Troubleshooting**:
   - https://www.tp-link.com/za/support/faq/3099/
   - Contains: Speed test, band settings

7. **Router Keeps Disconnecting**:
   - https://www.tp-link.com/za/support/faq/3360/
   - Contains: Connection logs, settings

8. **DDNS Setup**:
   - https://www.tp-link.com/za/support/faq/3421/
   - Contains: DDNS configuration page

---

## File Naming Convention

Save images to: `public/assets/router-guides/tplink-mr600/`

```
tplink-mr600/
├── led-front-panel.png
├── back-panel-ports.png
├── reset-button.png
├── sim-slot.png
├── login-page.png
├── dashboard-main.png
├── status-connected.png
├── status-disconnected.png
├── status-connecting.png
├── apn-settings.png
├── signal-strength.png
├── system-reboot.png
└── factory-reset-confirm.png
```

---

## After Capturing

Once you have the images, I can help you:
1. Update `assets.ts` with new TP-Link MR600 specific assets
2. Create vendor-specific asset selection logic
3. Add new 4G/LTE specific diagnostic nodes (SIM issues, APN config, signal strength)

---

## Tools for Capturing

### Browser Screenshots:
- **Windows**: Win + Shift + S (Snipping Tool)
- **Chrome DevTools**: Ctrl + Shift + P > "Capture screenshot"
- **Full page**: Use browser extension like "GoFullPage"

### Router Panel Photos:
- Good lighting
- Steady camera
- Focus on labels/text
- Include reference for scale

---

## Notes for MR600 Specifically

1. **This is a 4G LTE Router** - It uses a SIM card, not a WAN cable from a modem
2. **Default gateway**: `192.168.1.1` (not 192.168.0.1 like other TP-Link models)
3. **No WAN port in traditional sense** - Internet comes from 4G, but there is a WAN/LAN port for failover
4. **Single password login** - No username field on newer firmware

Consider adding 4G-specific diagnostic nodes:
- Check SIM card inserted correctly
- Check signal strength (bars)
- Check APN settings
- Check data plan/SIM activation
