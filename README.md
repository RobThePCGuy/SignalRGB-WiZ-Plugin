# SignalRGB WiZ Lighting Plugin

Control your WiZ smart lighting devices directly from SignalRGB using your local network. This plugin discovers WiZ bulbs, strips, lamps, and other compatible devices and allows SignalRGB effects to control their color and brightness.

This plugin is an enhanced version based on the original work by GreenSky Productions, updated for improved stability, compatibility, and features with modern SignalRGB versions.

## Features

*   **Automatic Discovery:** Discovers WiZ devices on your local network using UDP broadcasts.
*   **RGB Color Control:** Syncs WiZ RGB-capable devices with SignalRGB's lighting effects.
*   **Brightness Control:** Adjusts device brightness based on SignalRGB's master brightness slider.
*   **Tunable White Support:** Basic control for Tunable White (TW) only devices via a fixed temperature setting.
*   **Configurable Settings:**
    *   Enable/disable automatic control on startup.
    *   Force a specific static color, overriding SignalRGB effects.
    *   Set a minimum brightness level.
    *   Define a color to display when SignalRGB output is black/dim.
    *   Set a target white temperature for TW-only devices.
    *   Adjust discovery and liveness check intervals.
*   **Liveness Checking:** Periodically checks if devices are still online and removes unresponsive ones from SignalRGB.
*   **Device Info Display:** Shows basic device information (Model Name, IP, MAC, Room/Group ID) in the SignalRGB settings panel.
*   **Graceful Shutdown:** Optionally turns off devices when SignalRGB exits (respects the global `TurnOffOnShutdown` setting).

## Requirements

*   **SignalRGB:** Latest version recommended. Download from [signalrgb.com](https://signalrgb.com/).
*   **WiZ Smart Lighting Devices:** Compatible bulbs, strips, lamps, etc. (Smart Plugs are detected but not controllable).
*   **Network Configuration:**
    *   WiZ devices **must** be connected to your **2.4GHz** WiFi network.
    *   The computer running SignalRGB must be on the **same local network** as the WiZ devices.
    *   **Firewall:** Local UDP network communication must **not** be blocked by your computer's or router's firewall. Ensure ports **UDP 38899** (outgoing broadcast/commands, incoming replies) and **UDP 38900** (incoming replies) are allowed for SignalRGB on your local network.

## Installation

1.  **Download:** Get the `WiZ.qml` and `WiZ.js` files from this repository.
2.  **Navigate to Plugins Folder:** Open your SignalRGB plugins directory. This is typically located at:
    *   `%USERPROFILE%\Documents\WhirlwindFX\Plugins`
    (You can usually find this by opening SignalRGB, going to Settings -> System Information -> Show Plugins Folder).
3.  **Create Folder:** Inside the `Plugins` folder, create a new folder named exactly `WiZ`.
4.  **Copy Files:** Place both `WiZ.qml` and `WiZ.js` files inside the newly created `WiZ` folder.
    *   Your folder structure should look like: `...\Plugins\WiZ\WiZ.qml` and `...\Plugins\WiZ\WiZ.js`
5.  **Restart SignalRGB:** Completely close and restart SignalRGB for the new plugin to be loaded.

## Configuration and Usage

After installation and restarting SignalRGB, the plugin will automatically start scanning for WiZ devices. Discovered devices should appear under the "Devices" tab in SignalRGB after a short period (discovery can take a minute or two).

To configure a specific WiZ device:

1.  Go to the **Devices** tab in SignalRGB.
2.  Find your WiZ device in the list.
3.  Click the **Settings Cog (⚙️)** icon next to the device name.
4.  Adjust the available parameters:

    *   **Settings Tab:**
        *   `Automatically Control on Startup`: (Default: True) If checked, SignalRGB will start controlling this device as soon as SignalRGB loads. If unchecked, the device will remain in its last state until an effect is applied or this setting is changed.
        *   `Force Color (Overrides SignalRGB)`: (Default: False) If checked, the device will be set to the `Forced Color` defined below, ignoring any active SignalRGB effects. Useful for setting a static color. *(Only affects RGB-capable devices)*.
    *   **Lighting Tab:**
        *   `Forced Color`: The static color to use when `Force Color` is enabled. *(Only affects RGB-capable devices)*.
        *   `Minimum Brightness (%)`: (Range: 10-100, Default: 10) The lowest brightness level the plugin will send to the device, even if SignalRGB's master brightness is lower. WiZ devices have a minimum brightness level (usually 10%).
        *   `Color When SignalRGB is Black/Dim`: (Default: #101010) The color the device will show when the SignalRGB effect output for it is black or extremely dim (and `Force Color` is off). Useful to keep the light dimly lit instead of turning completely off with effects. *(Only affects RGB-capable devices)*.
        *   `Target White Temperature (K)`: (Range: 2200-6500, Default: 4000) The target color temperature (in Kelvin) to use for devices identified as **Tunable White only** (not full RGB). SignalRGB effects will only control the *brightness* of these devices; the temperature remains fixed at this value. *(Only appears for TW-only devices)*.
    *   **Discovery Tab:** (These settings affect the overall discovery process)
        *   `Discovery Broadcast Interval (seconds)`: (Default: 60) How often the plugin sends out a broadcast packet to find new WiZ devices. Lower values discover faster but increase network traffic slightly.
        *   `Device Liveness Check Interval (seconds)`: (Default: 30) How often the plugin actively sends a packet to known devices to ensure they are still online. This helps remove devices that have gone offline more quickly. Timeout is based on a multiple of this value.

## Device Compatibility

This plugin uses the standard WiZ UDP local control protocol. It *should* be compatible with most WiZ devices that support local network control, including:

*   Color Bulbs (A60, GU10, etc.)
*   Tunable White Bulbs
*   Filament Bulbs (Tunable White)
*   LED Strips
*   Lamps (Squire, Hero, etc.)

Compatibility is determined based on the `moduleName` reported by the device during discovery, using built-in heuristics (checking for "RGB", "TW", "DW") and a library of known device types (`WiZDeviceLibrary` in `WiZ.js`).

*   **Smart Plugs:** Devices like the "WiZ Smart Plug" (`ESP01_SHDW_01`) will be discovered but are not controllable as lighting devices.
*   **Unknown Devices:** If a device's `moduleName` is not recognized, the plugin attempts a best guess (assuming basic dimmable/TW capabilities). Full functionality may vary.

## Limitations & Known Issues

*   **No Group Control:** This plugin controls **individual** WiZ devices. It cannot control WiZ Rooms or Groups defined in the WiZ app directly. Group/Room IDs are displayed for informational purposes only.
*   **No Scene Control:** WiZ app scenes (e.g., "Ocean", "Forest") cannot be triggered via this plugin.
*   **Static White Temperature:** For Tunable White-only devices, the white temperature is fixed by the `Target White Temperature (K)` setting and is not dynamically controlled by SignalRGB effects. RGB devices handle white points based on the RGB values sent by SignalRGB.
*   **Network Dependency:** Performance and reliability depend heavily on your local network conditions. WiFi interference, network congestion, or UDP packet loss can cause lag, flickering, or devices becoming unresponsive.
*   **Discovery Time:** Initial discovery might take 1-2 minutes. Devices might temporarily disappear from SignalRGB if they become unresponsive on the network before the liveness check removes them.

## Troubleshooting

*   **Device Not Found:**
    *   Ensure the WiZ device is powered on and connected to your **2.4GHz** WiFi network.
    *   Verify the SignalRGB computer is on the *same* network subnet as the WiZ devices.
    *   Check your PC and router firewall settings to ensure **UDP ports 38899 and 38900** are not blocked for local traffic.
    *   Restart SignalRGB.
    *   Try power-cycling the WiZ device (unplug/replug).
*   **Device Unresponsive / Laggy:**
    *   Check for WiFi interference near the device or router.
    *   Reduce network congestion if possible.
    *   Restart the WiZ device and SignalRGB.
    *   Check the SignalRGB logs for errors: `%APPDATA%\SignalRgb\Logs` (paste into Explorer address bar).
*   **Incorrect Color / Brightness:**
    *   Ensure `Force Color` is disabled if you want SignalRGB effects.
    *   Check the `Minimum Brightness` and `Color When SignalRGB is Black/Dim` settings.
    *   Verify the device type (RGB vs TW) is detected correctly in the device info panel. If not, the `moduleName` might need to be added to the `WiZDeviceLibrary` in the JS file.

## Contributing

Contributions are welcome! If you find bugs, have suggestions for improvements, or want to add support for more device models (especially providing verified `moduleName` and `imageUrl` values), please feel free to:

*   Open an Issue.
*   Submit a Pull Request.

## Acknowledgements

*   Based on the original WiZ plugin foundation by **GreenSky Productions**.
*   Protocol information referenced from various open-source projects analyzing the WiZ UDP protocol.