# Diagnosis Questions End-to-End

This document lists all the diagnosis questions and corresponding voice instructions used in the TP-Link Router Diagnostic Path, defined in `lib/nodes.ts`.

## Phase 0: Entry & Context Setup

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `entry_start` | Ready to begin router diagnosis? | Hi! I'm Akili. I'll help fix your internet. Ready to start? |
| `entry_router_identify` | What brand is your router? | What brand is your router? Look at the front for the name - is it TP-Link, Netgear, D-Link, or something else? |
| `entry_postpone` | Would you like to continue later? | No problem! When you're ready, just say 'start diagnosis' and we can begin. Is there anything else I can help clarify before we end? |

## Phase 1: Physical Layer Verification

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `physical_power_led` | What color is the power LED? | Look at the front of your router. The Power light is on the left side. On TP-Link MR600, the lights are WHITE when on. Is the power light on, blinking, or off? |
| `physical_power_off` | Is the router plugged in? | The power light is off. Let's check the basics. First, confirm the power cable is firmly plugged into the back of the router. Then check that the other end is plugged into a working power outlet. Once you've checked both connections, tell me - is everything plugged in? |
| `physical_power_reconnect` | Please plug in the power cable | Please plug the power cable into the router and into a working outlet. Let me know when it's plugged in and any lights come on. |
| `physical_power_led_recheck` | What color is the power LED now? | Now look at the power light again. What color is it showing now - green, orange, blinking, or still off? |
| `physical_power_issue` | Router may have hardware issue | An orange power light usually indicates a hardware problem or the router is in recovery mode. Let's try a power cycle. Unplug the power cable, wait 10 seconds, then plug it back in. Tell me when you've done that. |
| `physical_power_booting` | Router is booting, please wait | The router is starting up - that's normal for a blinking light. Let's wait about 60 seconds for it to fully boot. Watch the power light and tell me when it becomes steady green. |
| `physical_internet_led` | What is the Internet LED doing? | Now look at the Internet light - it's the second light from the left. On TP-Link MR600 it will be WHITE when connected. Is it on, blinking, or off? |
| `physical_wan_cable_check` | Check WAN cable connection | The internet light suggests a connection problem. Look at the back of your router for a port labeled 'WAN' or 'Internet' - it's usually a different color, often blue or yellow. Check if there's a cable plugged in there. Is a cable connected to that port? |
| `physical_wan_connect` | Connect the WAN cable | You'll need to connect the cable from your modem or ONT box to the WAN port on your router. The cable should click in securely. Let me know when it's connected. |
| `physical_wan_reseat` | Reseat the WAN cable | Let's reseat that cable. Unplug the cable from the WAN port, wait 5 seconds, then firmly plug it back in until you hear a click. Also check the other end where it connects to your modem. Tell me when done. |
| `physical_wan_connecting` | WAN is attempting to connect | A blinking internet light means the router is trying to establish a connection. Let's wait 30 seconds. Watch the light - does it become solid green, or does it stay blinking or go orange? |
| `physical_internet_led_recheck` | What color is the Internet LED now? | Look at the Internet light again. What color is it showing now? |

## Phase 2: Local Network Sanity Check

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `local_network_check` | How are you connected to the router? | The router looks healthy. Now let's check your device's connection. Are you connected to the router via WiFi or with an ethernet cable plugged directly in? |
| `local_wifi_connected` | Is WiFi showing connected? | On your phone or computer, look at the WiFi icon in the corner of your screen. Does it show you're connected to your WiFi network? You should see the network name. |
| `local_wifi_reconnect` | Connect to WiFi network | Let's connect to your WiFi. Go to your WiFi settings, find your network name, and connect. You'll need your WiFi password. Let me know when you're connected. |
| `local_ethernet_check` | Is ethernet cable securely connected? | Check the ethernet cable is firmly connected at both ends - one end in your computer, the other in one of the numbered LAN ports on the router (not the WAN port). Are both ends secure? |
| `local_ethernet_reseat` | Reseat ethernet cable | Please firmly connect the ethernet cable at both ends. You should hear a click when it's properly seated. Let me know when done. |
| `local_browser_test` | Can you access the router admin page? | Open a web browser and type tplinkmodem.net in the address bar. Press Enter. Do you see a login page? |
| `local_gateway_alt` | Try alternate gateway address | Let's try a different address. Type 192.168.0.1 in the address bar instead. Some TP-Link models use this address. Do you see the router page now? |

## Phase 3: Router Login & Navigation

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `router_login_prompt` | Login to the router | Enter the password. Check the sticker on the bottom of your router for the default password. Did you get in? |
| `router_login_failed` | Check for password on router | The default password may have been changed. Look at the bottom or back of your router for a sticker with login details. Do you see any credentials printed there? |
| `router_login_retry` | Try credentials from sticker | Try logging in with the username and password from the sticker. Let me know if you get in. |
| `router_factory_reset_offer` | Would you like to factory reset the router? | We can't log in with the available credentials. I can guide you through a factory reset using the small reset button on your router. This will erase custom settings like your WiFi name and password, but it will restore the default login. Would you like to proceed with a factory reset? |
| `router_factory_reset_locate` | Find the reset button | Look at the back of your router for a tiny pinhole labeled Reset. You'll need a paperclip to press it. Have you found it? |
| `router_factory_reset_help` | Check all sides of router | The reset button is often hidden. Check the back panel near the ports, or sometimes it's on the bottom. It's a tiny pinhole, not a regular button. Look carefully at all sides. Have you found it now? |
| `router_factory_reset_execute` | Perform the factory reset | Insert your paperclip or pin into the reset hole. Press and hold the button firmly for about 10 to 15 seconds. You should see the lights on the router blink or all turn off, then come back on. Keep holding until the lights flash. Let me know when the lights start blinking. |
| `router_factory_reset_wait` | Wait for router to restart | The router is now resetting. This takes about 2 to 3 minutes. Wait until all the lights become steady again - especially the power light should be solid green. Let me know when the router seems fully restarted. |
| `router_factory_reset_reconnect` | Reconnect to the router | The router has been reset. Your WiFi network name is now back to the default - check the sticker on the router for the default WiFi name and password. Connect to that network, then try accessing the router page at 192.168.0.1 again. Let me know when you see the login page. |
| `router_factory_reset_login` | Login with default credentials | Now try logging in with the default credentials. The username is usually 'admin' and the password is either 'admin', 'password', or printed on the router sticker. Did you get in? |
| `router_dashboard_confirm` | Can you see the router dashboard? | Do you see the main dashboard with the network map and internet status? |
| `router_navigate_status` | Navigate to status page | Look for a menu item called 'Status', 'Network Status', or 'Internet' in the navigation. It might be in a sidebar on the left or tabs at the top. Click on it to see your connection status. |

## Phase 4: WAN / Internet Status Inspection

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `wan_status_check` | What is the WAN/Internet connection status? | On the status page, look for 'WAN' or 'Internet' connection status. It should show if you're connected or disconnected, and might display an IP address. What does it say - Connected, Disconnected, or something else? |
| `wan_status_wait` | Wait for connection to establish | The router is trying to connect. Let's wait 30 seconds. Watch the status - does it change to Connected, or does it show an error? |
| `wan_ip_check` | Do you see a WAN IP address? | Look for 'IP Address' or 'WAN IP' on this page. It should show numbers like 123.45.67.89. Do you see an IP address, or does it show 0.0.0.0 or blank? |

## Phase 5: Guided Corrective Actions

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `action_reconnect_wan` | Reconnect WAN connection | Let's try reconnecting. Look for a 'Connect' or 'Reconnect' button near the WAN status. If you see one, click it. Otherwise, look for 'Save' or 'Apply' button. Let me know when you've clicked it. |
| `action_wait_reconnect` | Wait for reconnection | Wait about 30 seconds for the router to reconnect. Watch the WAN status - does it change to Connected with an IP address? |
| `action_reboot_router` | Reboot the router | Let's try a soft reboot. In the router interface, look for 'System Tools', 'Administration', or 'Management' in the menu. Then find 'Reboot' or 'Restart'. Click it and confirm. The router will restart - this takes about 2 minutes. |
| `action_power_cycle` | Power cycle the router | Let's do a manual power cycle. Unplug the router's power cable, wait 30 seconds, then plug it back in. Wait for all the lights to come back on. Let me know when the router is fully restarted. |
| `action_reboot_wait` | Wait for router to restart | The router is restarting. Wait until you see all lights steady, then try accessing the router page again at 192.168.0.1. Let me know when you can access it. |

## Phase 6: Verification

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `verification_wan_recheck` | Check WAN status after reboot | After logging back in, check the WAN status again. Is it showing Connected with an IP address? |
| `verification_internet_test` | Test internet connection | Let's test if the internet is actually working. Open a new browser tab and try going to google.com. Does the Google page load? |
| `verification_dns_test` | Test with IP address | Let's try accessing a site directly by IP. Try going to 8.8.8.8 in your browser. This tests if the connection works without DNS. Does anything load? |
| `verification_complete` | Issue resolved! | Excellent! Your internet connection is working now. The issue has been resolved. Is there anything else you'd like help with? |
| `session_end` | Session complete | Thank you for contacting support. Your session is now complete. Have a great day! |

## Phase 7: Escalation Nodes

| Node ID | Question | Voice Instruction |
| :--- | :--- | :--- |
| `escalation_hardware` | Hardware issue detected | It appears there may be a hardware issue with your router. The power light not coming on after checking connections suggests the router may need replacement. I recommend contacting your internet service provider or the router manufacturer for a hardware check. |
| `escalation_wan_issue` | WAN connection issue | We've tried the main troubleshooting steps but the WAN connection isn't establishing. This could indicate an issue with your modem, the line from your ISP, or your ISP's network. I recommend contacting your internet service provider to check for outages or line issues. |
| `escalation_wifi_issue` | WiFi connection issue | There seems to be an issue connecting to the WiFi network. This might be a password problem or interference issue. Try connecting from a different device, or use an ethernet cable temporarily. If the problem persists, you may need to reset the WiFi settings on the router. |
| `escalation_access_issue` | Cannot access router | We're unable to access the router's admin page. This could mean the device isn't properly connected, or the router might need a factory reset. Alternatively, your device might have a different gateway address. I recommend checking your device's network settings or contacting support. |
| `escalation_login_issue` | Cannot login to router | Unfortunately, we weren't able to access the router's admin panel. You may need to contact your internet service provider for help, or if this is your own router, reach out to the manufacturer's support. They can help you regain access or replace the router if needed. |
| `escalation_ui_mismatch` | Router UI does not match | The router interface looks different from what I expected. Your router may have a different firmware version or be a different model. Without being able to match the interface, I cannot guide you safely. I recommend checking your router's documentation or contacting technical support. |
| `escalation_reboot_failed` | Router not responding after reboot | The router isn't responding after the restart. Try waiting a few more minutes - sometimes routers take longer to fully boot. If it still doesn't respond, there may be a hardware issue. Contact your ISP or router manufacturer for further assistance. |
| `escalation_persistent_issue` | Issue persists after troubleshooting | We've tried the main troubleshooting steps but the connection issue persists. This suggests a problem outside the router - likely with your modem, ISP service, or the line connection. Please contact your internet service provider to report the issue and request a line check. |
| `escalation_dns_issue` | DNS resolution issue | Your internet connection is working, but there's a DNS problem - the service that translates website names to addresses. Try changing your DNS servers to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1) in your router or device settings. This usually resolves the issue. |
| `escalation_connectivity_issue` | No internet connectivity | Even direct IP access isn't working, which confirms there's no internet connectivity through your router. The issue is likely with your modem, ISP service, or the physical line. Please contact your internet service provider to check for outages or line problems. |
