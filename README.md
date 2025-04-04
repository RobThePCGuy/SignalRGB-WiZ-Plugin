# WIZ Lighting for SignalRGB

## Getting Started

This SignalRGB plugin allows you to control WIZ smart lighting devices (bulbs, strips, lamps) directly from SignalRGB using your local network. No WIZ cloud account or app connection is required for control after initial setup.

## Installation

**Recommended:** Click the link below or copy/paste the URI into your browser's address bar.

`signalrgb://addon/install?url=https://github.com/RobThePCGuy/SignalRGB-WiZ-Plugin/releases/download/v1.2.0/WiZ_Plugin.zip`

(![Add to SignalRGB](https://github.com/user-attachments/assets/7fcd3918-1b73-4657-a2ed-c4618305d196)](signalrgb://addon/install?url=https://github.com/RobThePCGuy/SignalRGB-WiZ-Plugin/releases/download/v1.2.0/WiZ_Plugin.zip)

## Key Requirements & Limitations

*   WIZ devices **must** be on your **2.4GHz** WiFi network.
*   Your PC running SignalRGB must be on the **same local network**.
*   Firewall must allow **UDP ports 38899 & 38900** for SignalRGB on your local network (incoming/outgoing).
*   WIZ **Groups** and **Scenes** (from the WIZ app) are **not** supported. This plugin controls individual devices.
*   Tunable White (TW) only devices use a fixed color temperature set in plugin settings; effects only control brightness for these.
*   WIZ Smart Plugs are detected but cannot be controlled as lights.
