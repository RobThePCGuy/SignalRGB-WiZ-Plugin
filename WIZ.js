export function Name() { return "WIZ Interface"; }
export function Version() { return "1.1.0"; } // Incremented version
export function VendorId() { return 0x0; } // Standard for Network plugins
export function ProductId() { return 0x0; } // Standard for Network plugins
export function Type() { return "network"; }
export function Publisher() { return "GreenSky Productions (Enhanced)"; } // Added acknowledgement
export function Size() { return [1, 1]; } // Represents a single controllable zone
export function DefaultPosition() { return [75, 70]; }
export function DefaultScale() { return 10.0; }
export function DefaultComponentBrand() { return "WIZ"; }
export function SubdeviceController() { return false; } // This plugin controls devices directly

/* global
controller: readonly,
discovery: readonly,
device: writeonly,
service: readonly,
udp: writeonly,
TurnOffOnShutdown: readonly, // Standard SignalRGB Global variable
AutoStartStream: readwrite,  // User controllable parameter
forcedColor: readwrite,      // User controllable parameter
minBrightness: readwrite,  // User controllable parameter (Corrected typo)
dimmColor: readwrite,        // User controllable parameter
forceColor: readwrite,       // User controllable parameter
*/

// Constants
const MIN_WIZ_BRIGHTNESS = 10; // WIZ brightness range is 10-100
const MAX_WIZ_BRIGHTNESS = 100;
const DEFAULT_TW_TEMP = 4000; // Default Kelvin for TW devices if forcing color

// User Controllable Parameters
export function ControllableParameters() {
    return [
        { "property": "AutoStartStream", "group": "settings", "label": "Automatically Control on Startup", "type": "boolean", "default": true }, // Defaulting to true seems more user-friendly
        { "property": "forceColor", "group": "settings", "label": "Force Color (Overrides SignalRGB)", "type": "boolean", "default": false },
        { "property": "forcedColor", "group": "lighting", "label": "Forced Color", "type": "color", "default": "#009bde" },
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": "10" }, // Corrected typo, adjusted range/type
        { "property": "dimmColor", "group": "lighting", "label": "Color When SignalRGB is Black/Dim", "type": "color", "default": "#101010" }, // Slightly brighter default dim color
    ];
}

/** @type {WizProtocol} */
let wizProtocol;
let isInitialized = false;

// Main device initialization
export function Initialize() {
    device.log(`Initializing WIZ Device: ${controller.id} (${controller.modelName || 'Unknown Model'})`);
    device.addFeature("udp");

    // Set a more descriptive name
    device.setName(`WIZ ${controller.modelName ? controller.modelName : ''} (${controller.id.substring(controller.id.length - 4)})`);

    // Set Icon based on type if available in library
    if (controller.wizType && controller.wizType.imageUrl) {
        // device.setIconUrl(controller.wizType.imageUrl); // Use setIconUrl
    }

    // Define the controllable LED(s) - WIZ bulbs/strips are typically single-zone
    device.setControllableLeds(["LED 1"], [[0, 0]]);
    device.setSize([1, 1]); // Confirm size matches LED layout

    // Remove color forcing options if the device is Tunable White only
    if (controller.isTW && !controller.isRGB) {
        device.removeProperty("forcedColor");
        device.removeProperty("forceColor");
        device.removeProperty("dimmColor"); // dimmColor relies on RGB
        device.log("Device is Tunable White only. Color properties removed.");
    }

    wizProtocol = new WizProtocol(controller.ip, controller.port, controller.isTW && !controller.isRGB);
    isInitialized = true;

    // Start stream immediately if AutoStart is enabled
    if (AutoStartStream) {
        device.log("AutoStartStream enabled. Initializing state.");
        Render(); // Send initial state
    } else {
        device.log("AutoStartStream disabled. Device will wait for SignalRGB data.");
    }
}

// Called periodically to send color/brightness data
export function Render() {
    if (!isInitialized || !wizProtocol) {
        // device.log("Render called before initialization or missing protocol handler.");
        return;
    }

    // If AutoStartStream is off, don't send commands unless SignalRGB is actively sending data (implicitly handled by effect engine)
    // However, we might need to handle the "forced color" case even if AutoStart is off? Let's assume AutoStart gates all control for simplicity now.
    if (!AutoStartStream) {
         // If autostart is off, we might want to ensure the light is off or in a known state?
         // For now, do nothing if autostart is off. The light remains in its previous state.
        return;
    }

    let r, g, b, brightnessPercent;

    if (forceColor && controller.isRGB) { // Force color only works reliably on RGB devices
        [r, g, b] = device.hexToRgb(forcedColor);
        // Use device brightness slider when forcing color? Or fixed brightness? Let's use device brightness.
        brightnessPercent = device.getBrightness();
        // device.log(`Forcing color: ${r},${g},${b} at ${brightnessPercent}% brightness`);
    } else {
        // Get color from SignalRGB's [0,0] pixel
        [r, g, b] = device.color(0, 0);
        brightnessPercent = device.getBrightness();
        // device.log(`SignalRGB color: ${r},${g},${b} at ${brightnessPercent}% brightness`);
    }

    // Map SignalRGB brightness (0-100) to WIZ brightness (10-100), respecting minBrightness setting
    let wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness, Math.round(brightnessPercent / 100 * (MAX_WIZ_BRIGHTNESS - MIN_WIZ_BRIGHTNESS) + MIN_WIZ_BRIGHTNESS));
    wizBrightness = Math.min(MAX_WIZ_BRIGHTNESS, wizBrightness); // Clamp to WIZ max

    // Handle the "dim color" case when SignalRGB output is very dark/black
    const isSignalDark = r < 5 && g < 5 && b < 5; // Threshold for "dark"

    if (isSignalDark && controller.isRGB) { // dimmColor only makes sense for RGB devices
        [r, g, b] = device.hexToRgb(dimmColor);
        // Use minBrightness when dimmed, or should it be a separate setting? Let's use minBrightness.
        wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness);
        // device.log(`SignalRGB is dark. Using dimmColor: ${r},${g},${b} at ${wizBrightness} WIZ brightness`);
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);

    } else if (controller.isTW && !controller.isRGB) {
        // Handle Tunable White device - use brightness only
        // device.log(`Setting TW device brightness: ${wizBrightness}`);
        wizProtocol.setPilotTw(DEFAULT_TW_TEMP, wizBrightness); // Use default temp, only control brightness

    } else {
        // Handle RGB or RGB+TW device with SignalRGB color
        // device.log(`Setting RGB device: ${r},${g},${b} at ${wizBrightness} WIZ brightness`);
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    }
}


// Called when the plugin or SignalRGB shuts down
export function Shutdown(suspend) {
    device.log(`Shutdown called (suspend: ${suspend})`);
    if (wizProtocol) {
        if (TurnOffOnShutdown && AutoStartStream) {
            device.log("Turning off device due to TurnOffOnShutdown setting.");
            wizProtocol.setPilotState(false); // Send power off command
        } else {
            // Optional: Send a final neutral color/brightness state if not turning off?
            // Or just leave it as is. Leaving it is usually preferred.
             device.log("Leaving device in current state on shutdown.");
        }
    }
    isInitialized = false; // Mark as uninitialized
}

// --- WIZ Device Data Structure (Placeholder - real data comes from discovery) ---
/**
 * @typedef {object} WizTypeInfo
 * @property {string} productName
 * @property {string} imageUrl
 * @property {number} [sku]
 * @property {boolean} supportRGB
 * @property {boolean} supportDimming
 * @property {boolean} supportWhiteColor - Indicates controllable white temp/channels
 * @property {boolean} supportCostumLedCount - Usually false for bulbs
 * @property {number} ledCount - Usually 1 for bulbs/simple strips
 */

/** @type {Object.<string, WizTypeInfo>} */
const WIZDeviceLibrary = {
    // Key should ideally be the 'moduleName' reported by the device
    "ESP01_SHDW_01":    { productName: "WIZ Smart Plug", imageUrl: "", supportRGB: false, supportDimming: false, supportWhiteColor: false, ledCount: 0 },
    "ESP03_SHRGB3_01":  { productName: "WRGB LED Strip", imageUrl: "https://www.assets.signify.com/is/image/Signify/WiFi-BLE-LEDstrip-2M-1600lm-startkit-SPP?&wid=200&hei=200&qlt=100", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP15_SHTW_01I":   { productName: "WIZ Tunable White A60 E27", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP06_SHRGB_01":   { productName: "WIZ Color A60 E27", imageUrl: "https://www.assets.signify.com/is/image/PhilipsLighting/9290023835-IMS-en_SG?wid=400&hei=400&$pnglarge$", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
     "ESP20_SHRGBW_01B": { productName: "WIZ Squire Table Lamp", imageUrl: "", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    // Add more known devices here using their 'moduleName'
    "default":          { productName: "Unknown WIZ Device", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 } // Default fallback
};

// --- Discovery Service ---
export function DiscoveryService() {

    this.running = false;
    this.discoveryTimer = null;
    this.livenessTimer = null;
    this.controllers = {}; // Store controller objects keyed by MAC ID

    const BROADCAST_INTERVAL = 60000; // 60 seconds
    const LIVENESS_CHECK_INTERVAL = 30000; // 30 seconds
    const DEVICE_TIMEOUT = BROADCAST_INTERVAL * 3.5; // ~3.5 minutes timeout

    this.Initialize = function () {
        service.log("WIZ Discovery Service Initializing...");
        this.running = true;
        this.controllers = {}; // Clear previous state

        // Initial broadcast
        this.broadcastDiscovery();

        // Set up periodic discovery broadcast
        this.discoveryTimer = service.setInterval(() => {
            if (this.running) {
                this.broadcastDiscovery();
            }
        }, BROADCAST_INTERVAL);

        // Set up periodic liveness checks and removal
        this.livenessTimer = service.setInterval(() => {
            if (this.running) {
                this.checkDeviceLiveness();
            }
        }, LIVENESS_CHECK_INTERVAL);

        service.log("WIZ Discovery Service Started.");
    };

    this.broadcastDiscovery = function() {
        service.log("Broadcasting WIZ discovery packet...");
        // Standard WIZ registration request to discover devices
        const discoveryPacket = JSON.stringify({
            "method": "registration",
            "params": {
                "phoneMac": "AAAAAAAAAAAA", // Fake MAC
                "register": false,
                "phoneIp": "1.2.3.4",        // Fake IP
                "id": "1"                   // Arbitrary ID
            }
        });
        // Port 38899 is standard for WIZ broadcast discovery
        service.broadcast(discoveryPacket, 38899);
    };

    this.requestSystemConfig = function(ip) {
         service.log(`Requesting System Config from ${ip}`);
         const configPacket = JSON.stringify({ "method": "getSystemConfig", "id": 1 });
         // Send directly to device IP, port 38899 seems common for commands too
         service.send(ip, 38899, configPacket);
    };

    this.requestPilot = function(ip) {
        // service.log(`Requesting Pilot state from ${ip}`);
        const pilotPacket = JSON.stringify({ "method": "getPilot", "id": 1 });
        service.send(ip, 38899, pilotPacket);
    }

    this.checkDeviceLiveness = function() {
        const now = Date.now();
        let controllersToRemove = [];

        // Check existing controllers
        for (const id in this.controllers) {
            const controller = this.controllers[id];
            if (now - controller.lastSeen > DEVICE_TIMEOUT) {
                service.log(`Device ${id} (${controller.ip}) timed out. Last seen ${Math.round((now - controller.lastSeen)/1000)}s ago. Removing.`);
                controllersToRemove.push(id);
            } else {
                 // Optionally send a getPilot to confirm it's still alive if recently seen
                 if (now - controller.lastSeen < LIVENESS_CHECK_INTERVAL * 2) {
                    this.requestPilot(controller.ip);
                 }
            }
        }

        // Remove timed-out controllers
        controllersToRemove.forEach(id => {
            service.removeControllerById(id); // Use SignalRGB's service function
            delete this.controllers[id];
        });

        // Also request updates from recently added but not fully initialized controllers
         service.controllers.forEach(c => {
            const ctrl = c.obj; // Access the underlying JS object
            if (this.controllers[ctrl.id] && !ctrl.deviceInfoLoaded && ctrl.initialized) {
                this.requestSystemConfig(ctrl.ip);
            }
         });
    };

    this.Shutdown = function () {
        service.log("WIZ Discovery Service Shutting Down...");
        this.running = false;
        if (this.discoveryTimer) {
            service.stopTimer(this.discoveryTimer);
            this.discoveryTimer = null;
        }
        if (this.livenessTimer) {
            service.stopTimer(this.livenessTimer);
            this.livenessTimer = null;
        }
        this.controllers = {}; // Clear controllers on shutdown
        service.log("WIZ Discovery Service Stopped.");
    };

    // Process incoming UDP packets (listens on 38900 by default via service)
    this.Discovered = function (value) {
        // service.log(`Received UDP packet from ${value.ip}:${value.port}`);
        let packet;
        try {
            packet = JSON.parse(value.response);
            // service.log(`Parsed Packet: ${JSON.stringify(packet)}`);
        } catch (e) {
            service.log(`Error parsing JSON response from ${value.ip}: ${e}`);
            service.log(`Raw response: ${value.response}`);
            return;
        }

        // Extract potential MAC ID from the packet if available (sometimes in result/params)
        const potentialMac = packet.result?.mac || packet.params?.mac || value.id; // Use value.id (MAC from WIZDevice) as fallback
        if (!potentialMac) {
            service.log(`Packet from ${value.ip} doesn't contain identifiable MAC.`);
            return;
        }
        const macId = potentialMac.toUpperCase(); // Standardize MAC format


        // Update last seen time for the device
        if (this.controllers[macId]) {
            this.controllers[macId].lastSeen = Date.now();
             // Update IP and Port if they changed (DHCP)
            if (value.ip && this.controllers[macId].ip !== value.ip) {
                service.log(`IP changed for ${macId}: ${this.controllers[macId].ip} -> ${value.ip}`);
                this.controllers[macId].ip = value.ip;
                 // Update the controller object in SignalRGB service too
                 const ctrlToUpdate = service.getController(macId);
                 if (ctrlToUpdate) {
                    ctrlToUpdate.ip = value.ip;
                    service.updateController(ctrlToUpdate); // Notify SignalRGB of the change
                 }
            }
             // Port changes less likely but possible
             if (value.port && this.controllers[macId].port !== value.port) {
                service.log(`Port changed for ${macId}: ${this.controllers[macId].port} -> ${value.port}`);
                 this.controllers[macId].port = value.port;
                 const ctrlToUpdate = service.getController(macId);
                 if (ctrlToUpdate) {
                    ctrlToUpdate.port = value.port;
                    service.updateController(ctrlToUpdate);
                 }
            }
        }

        // Handle different WIZ methods
        switch (packet.method) {
            case `registration`:
                if (packet.result?.success && packet.result.mac) {
                    service.log(`Successful registration response from MAC: ${packet.result.mac} at IP: ${value.ip}`);
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    // Once registered, immediately request its config
                    this.requestSystemConfig(value.ip);
                } else if (!packet.result?.success) {
                    service.log(`Registration failed for ${value.ip}. Error: ${packet.error?.message || 'Unknown'}`);
                }
                break;

            case `getSystemConfig`:
                if (packet.result) {
                    service.log(`Received System Config for ${macId}: ${JSON.stringify(packet.result.moduleName)}`);
                    const controller = this.controllers[macId];
                    if (controller) {
                        controller.setDeviceInfo(packet.result);
                        // Announce only after config is received
                         if (!controller.announced) {
                            service.announceController(controller); // Announce to SignalRGB
                            controller.announced = true;
                            service.log(`Controller ${macId} announced.`);
                         } else {
                            service.updateController(controller); // Update existing controller info
                            service.log(`Controller ${macId} info updated.`);
                         }
                    } else {
                        service.log(`Received SysConfig for unknown MAC ${macId}, requesting registration info.`);
                         // It responded to getSystemConfig, so it exists. Try to add it.
                         this.CreateOrUpdateController(macId, value.ip, value.port);
                         // Re-request config to ensure we process it correctly now controller exists
                         this.requestSystemConfig(value.ip);
                    }
                } else {
                     service.log(`getSystemConfig error for ${macId}: ${packet.error?.message || 'Unknown'}`);
                }
                break;

            case `getPilot`:
                // Received pilot state - confirms device is alive. We already updated lastSeen.
                // We don't typically need to parse the pilot state in discovery, but could log it.
                // service.log(`Received Pilot state from ${macId}`);
                 const pilotController = this.controllers[macId];
                 if (pilotController && !pilotController.deviceInfoLoaded) {
                    // If we got pilot but still missing config, request config again.
                     service.log(`Got pilot from ${macId} but still missing SysConfig. Requesting again.`);
                    this.requestSystemConfig(pilotController.ip);
                 }
                 if(pilotController && !pilotController.announced && pilotController.deviceInfoLoaded){
                     service.log(`Got pilot from ${macId}, info loaded but not announced. Announcing now.`);
                     service.announceController(pilotController); // Announce to SignalRGB
                     pilotController.announced = true;
                 }
                break;

            case `syncPilot`:
            case `firstBeat`:
                // These are often broadcast by the lights themselves. Good for discovery/liveness.
                // service.log(`Received ${packet.method} from ${macId} at ${value.ip}`);
                 if (!this.controllers[macId]) {
                    // If we detect a device via its own broadcasts, try to add and query it
                    service.log(`Detected new device ${macId} via ${packet.method}. Adding and querying.`);
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    this.requestSystemConfig(value.ip);
                 } else {
                     // Just confirms liveness
                     this.controllers[macId].lastSeen = Date.now();
                 }
                break;

            default:
                // service.log(`Received unhandled method '${packet.method}' from ${macId}`);
                break;
        }
    };

    // Handles adding or updating controller info
    this.CreateOrUpdateController = function(macId, ip, port) {
        if (!this.controllers[macId]) {
            service.log(`Creating new WIZ controller entry for ${macId} at ${ip}:${port}`);
            const newController = new WIZDevice(macId, ip, port);
            this.controllers[macId] = newController;
            // Don't announce yet - wait for getSystemConfig response
        } else {
            // Update existing controller's IP/Port and lastSeen (already handled in Discovered)
            service.log(`Updating existing WIZ controller entry for ${macId}`);
            this.controllers[macId].lastSeen = Date.now(); // Ensure lastSeen is updated
        }
    };

    this.IconUrl = "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw"; // Keep the icon
    this.UdpBroadcastPort = 38899; // Port to send discovery packets TO
    this.UdpBroadcastAddress = "255.255.255.255"; // Standard broadcast
    this.UdpListenPort = 38900; // Port SignalRGB should listen ON for replies

} // End DiscoveryService

// --- WIZ Device Class (Represents a discovered device) ---
class WIZDevice {
    constructor(id, ip, port) {
        this.id = id; // MAC address (unique identifier)
        this.ip = ip;
        this.port = port || 38899; // Default WIZ port if not provided
        this.lastSeen = Date.now();

        // Flags
        this.initialized = true; // Initialized in the sense that the object exists
        this.deviceInfoLoaded = false; // Becomes true after successful getSystemConfig
        this.announced = false; // Becomes true after service.announceController()

        // Device Info (populated by setDeviceInfo)
        this.homeId = null;
        this.fwVersion = "N/A";
        this.roomId = null;
        this.groupId = null;
        this.moduleName = "Unknown"; // WIZ internal model name
        this.modelName = "WIZ Device"; // User-friendly name from library
        this.isRGB = false;
        this.isTW = false; // Tunable White
        this.wizType = null; // Reference to WIZDeviceLibrary entry

        service.log(`WIZDevice object created for ${this.id}`);
    }

    setDeviceInfo(data) {
        service.log(`Setting device info for ${this.id} from data: ${JSON.stringify(data)}`);
        this.homeId = data.homeId;
        this.fwVersion = data.fwVersion || "N/A";
        this.roomId = data.roomId;
        this.groupId = data.groupId;
        this.moduleName = data.moduleName || "Unknown";

        // Determine capabilities based on moduleName (heuristic)
        // Prioritize RGB if both keywords are present
        this.isRGB = this.moduleName.includes("RGB");
        this.isTW = this.moduleName.includes("TW") || this.moduleName.includes("DW"); // DW often means tunable white too

        // If it's RGB, it usually also supports TW adjustments via RGB channels
        if(this.isRGB) {
            this.isTW = true;
        }

        // Look up in library
        this.wizType = WIZDeviceLibrary[this.moduleName] || WIZDeviceLibrary["default"];
        this.modelName = this.wizType.productName;

        // Update capabilities based on library if more specific
        if (this.wizType && this.wizType !== WIZDeviceLibrary["default"]) {
             this.isRGB = this.wizType.supportRGB ?? this.isRGB; // Use library value if defined, else keep detected
             this.isTW = this.wizType.supportWhiteColor ?? this.isTW;
        } else {
            // Fallback logic if not in library
            if (!this.isRGB && !this.isTW) {
                // If no keywords found, assume basic dimmable non-color bulb
                this.isTW = true; // At least allow brightness control
                service.log(`Module name '${this.moduleName}' not recognized fully, assuming basic Tunable White/Dimmable.`);
            }
        }


        this.deviceInfoLoaded = true;
        this.lastSeen = Date.now(); // Update lastSeen when info is set/updated
        service.log(`Device info processed for ${this.id}: Name=${this.modelName}, RGB=${this.isRGB}, TW=${this.isTW}`);

        // Note: Announcing is handled by the DiscoveryService after this returns
    }

    // update() method is no longer needed here, liveness/updates handled by DiscoveryService
}

// --- WIZ Protocol Handler ---
class WizProtocol {
    constructor(ip, port, isTwOnly = false) {
        this.ip = ip;
        this.port = port || 38899;
        this.isTwOnly = isTwOnly;

        // Rate limiting state
        this.lastState = {
            r: -1, g: -1, b: -1,
            temp: -1,
            brightness: -1,
            power: null // Track power state separately
        };
        this.lastSendTime = 0;
        this.minSendInterval = 50; // Milliseconds - throttle commands (WIZ can be overwhelmed)
    }

    _canSend() {
        const now = Date.now();
        if (now - this.lastSendTime > this.minSendInterval) {
            this.lastSendTime = now;
            return true;
        }
        return false;
    }

    _sendPilot(params) {
        if (!this._canSend()) {
            // device.log("Throttling WIZ command.");
            return;
        }
        const command = { "method": "setPilot", "params": params };
        // device.log(`Sending to ${this.ip}:${this.port} -> ${JSON.stringify(command)}`);
        udp.send(this.ip, this.port, command);
    }

    setPilotRgb(r, g, b, brightness) {
        // Clamp brightness to WIZ range
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));

        if (this.lastState.r !== r || this.lastState.g !== g || this.lastState.b !== b || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            // device.log(`Setting RGB: ${r}, ${g}, ${b}, Brightness: ${brightness}`);
            this._sendPilot({ "r": r, "g": g, "b": b, "dimming": brightness, "state": true });
            this.lastState = { r, g, b, brightness, power: true, temp: -1 };
        }
    }

    setPilotTw(temperature, brightness) {
         // Clamp brightness to WIZ range
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        // Clamp temperature (typical WIZ range is ~2200-6500K)
        temperature = Math.max(2200, Math.min(6500, Math.round(temperature)));

         if (this.lastState.temp !== temperature || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            // device.log(`Setting TW: Temp: ${temperature}, Brightness: ${brightness}`);
            this._sendPilot({ "temp": temperature, "dimming": brightness, "state": true });
             this.lastState = { r: -1, g: -1, b: -1, temp: temperature, brightness, power: true };
         }
    }

    setPilotState(isOn) {
        // device.log(`Setting Power State: ${isOn}`);
        if (this.lastState.power !== isOn) {
            this._sendPilot({ "state": isOn });
             // Don't clear color state when turning off, allows turning back on to previous color
             this.lastState.power = isOn;
        }
    }
}

// --- Helper Functions ---
// (device.hexToRgb is built-in now, no need for custom one)

export function ImageUrl() {
    return "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
}