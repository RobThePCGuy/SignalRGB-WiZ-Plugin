# WIZ Lighting for SignalRGB

## Getting Started

This SignalRGB plugin allows you to control WIZ smart lighting devices (bulbs, strips, lamps) directly from SignalRGB using your local network. No WIZ cloud account or app connection is required for control after initial setup.

## Installation

**Recommended:** Copy/paste the URI into your browser's address bar.

[![Add to SignalRGB](https://raw.githubusercontent.com/RobThePCGuy/SignalRGB-WiZ-Plugin/refs/heads/main/add-extension-256.png)](#)

`signalrgb://addon/install?url=https://github.com/RobThePCGuy/SignalRGB-WiZ-Plugin`

## Key Requirements & Limitations

*   WIZ devices **must** be on your **2.4GHz** WiFi network.
*   Your PC running SignalRGB must be on the **same local network**.
*   Firewall must allow **UDP ports 38899 & 38900** for SignalRGB on your local network (incoming/outgoing).
*   WIZ **Groups** and **Scenes** (from the WIZ app) are **not** supported. This plugin controls individual devices.
*   Tunable White (TW) only devices use a fixed color temperature set in plugin settings; effects only control brightness for these.
*   WIZ Smart Plugs are detected but cannot be controlled as lights.
