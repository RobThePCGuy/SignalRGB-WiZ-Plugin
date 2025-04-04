export function Name() { return "WIZ Interface"; }
export function Version() { return "1.1.1"; } // Incremented version for fix
export function VendorId() { return 0x0; }
export function ProductId() { return 0x0; }
export function Type() { return "network"; }
export function Publisher() { return "GreenSky Productions (Enhanced)"; }
export function Size() { return [1, 1]; }
export function DefaultPosition() { return [75, 70]; }
export function DefaultScale() { return 10.0; }
export function DefaultComponentBrand() { return "WIZ"; }
export function SubdeviceController() { return false; }

/* global
controller: readonly,
discovery: readonly,
device: writeonly,
service: readonly, // Correct global object for service functions
udp: writeonly,    // Correct global object for device-level UDP send
TurnOffOnShutdown: readonly,
AutoStartStream: readwrite,
forcedColor: readwrite,
minBrightness: readwrite,
dimmColor: readwrite,
forceColor: readwrite,
*/

// Constants
const MIN_WIZ_BRIGHTNESS = 10;
const MAX_WIZ_BRIGHTNESS = 100;
const DEFAULT_TW_TEMP = 4000;

// User Controllable Parameters
export function ControllableParameters() {
    return [
        { "property": "AutoStartStream", "group": "settings", "label": "Automatically Control on Startup", "type": "boolean", "default": true },
        { "property": "forceColor", "group": "settings", "label": "Force Color (Overrides SignalRGB)", "type": "boolean", "default": false },
        { "property": "forcedColor", "group": "lighting", "label": "Forced Color", "type": "color", "default": "#009bde" },
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": 10 },
        { "property": "dimmColor", "group": "lighting", "label": "Color When SignalRGB is Black/Dim", "type": "color", "default": "#101010" },
    ];
}

/** @type {WizProtocol} */
let wizProtocol;
let isInitialized = false;

// Main device initialization
export function Initialize() {
    device.log(`Initializing WIZ Device: ${controller.id} (${controller.modelName || 'Unknown Model'})`);
    device.addFeature("udp");
    device.setName(`WIZ ${controller.modelName ? controller.modelName : ''} (${controller.id.substring(controller.id.length - 4)})`);

    if (controller.wizType && controller.wizType.imageUrl) {
        // device.setIconUrl(controller.wizType.imageUrl);
    }

    device.setControllableLeds(["LED 1"], [[0, 0]]);
    device.setSize([1, 1]);

    if (controller.isTW && !controller.isRGB) {
        device.removeProperty("forcedColor");
        device.removeProperty("forceColor");
        device.removeProperty("dimmColor");
        device.log("Device is Tunable White only. Color properties removed.");
    }

    wizProtocol = new WizProtocol(controller.ip, controller.port, controller.isTW && !controller.isRGB);
    isInitialized = true;

    if (AutoStartStream) {
        device.log("AutoStartStream enabled. Initializing state.");
        Render();
    } else {
        device.log("AutoStartStream disabled. Device will wait for SignalRGB data.");
    }
}

// Called periodically to send color/brightness data
export function Render() {
    if (!isInitialized || !wizProtocol) {
        return;
    }
    if (!AutoStartStream) {
        return;
    }

    let r, g, b, brightnessPercent;

    if (forceColor && controller.isRGB) {
        [r, g, b] = device.hexToRgb(forcedColor);
        brightnessPercent = device.getBrightness();
    } else {
        [r, g, b] = device.color(0, 0);
        brightnessPercent = device.getBrightness();
    }

    let wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness, Math.round(brightnessPercent / 100 * (MAX_WIZ_BRIGHTNESS - MIN_WIZ_BRIGHTNESS) + MIN_WIZ_BRIGHTNESS));
    wizBrightness = Math.min(MAX_WIZ_BRIGHTNESS, wizBrightness);

    const isSignalDark = r < 5 && g < 5 && b < 5;

    if (isSignalDark && controller.isRGB) {
        [r, g, b] = device.hexToRgb(dimmColor);
        wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness);
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    } else if (controller.isTW && !controller.isRGB) {
        wizProtocol.setPilotTw(DEFAULT_TW_TEMP, wizBrightness);
    } else {
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    }
}

// Called when the plugin or SignalRGB shuts down
export function Shutdown(suspend) {
    device.log(`Shutdown called (suspend: ${suspend})`);
    if (wizProtocol) {
        if (TurnOffOnShutdown && AutoStartStream) {
            device.log("Turning off device due to TurnOffOnShutdown setting.");
            wizProtocol.setPilotState(false);
        } else {
             device.log("Leaving device in current state on shutdown.");
        }
    }
    isInitialized = false;
}

// --- WIZ Device Data Structure ---
/** @typedef {object} WizTypeInfo ... */ // (keeping definitions concise)
const WIZDeviceLibrary = {
    "ESP01_SHDW_01":    { productName: "WIZ Smart Plug", imageUrl: "", supportRGB: false, supportDimming: false, supportWhiteColor: false, ledCount: 0 },
    "ESP03_SHRGB3_01":  { productName: "WRGB LED Strip", imageUrl: "https://www.assets.signify.com/is/image/Signify/WiFi-BLE-LEDstrip-2M-1600lm-startkit-SPP?&wid=200&hei=200&qlt=100", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP15_SHTW_01I":   { productName: "WIZ Tunable White A60 E27", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP06_SHRGB_01":   { productName: "WIZ Color A60 E27", imageUrl: "https://www.assets.signify.com/is/image/PhilipsLighting/9290023835-IMS-en_SG?wid=400&hei=400&$pnglarge$", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP20_SHRGBW_01B": { productName: "WIZ Squire Table Lamp", imageUrl: "", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "default":          { productName: "Unknown WIZ Device", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 }
};

// --- Discovery Service ---
export function DiscoveryService() {

    this.running = false;
    this.discoveryTimer = null;
    this.livenessTimer = null;
    this.controllers = {};

    const BROADCAST_INTERVAL = 60000;
    const LIVENESS_CHECK_INTERVAL = 30000;
    const DEVICE_TIMEOUT = BROADCAST_INTERVAL * 3.5;

    this.Initialize = function () {
        service.log("WIZ Discovery Service Initializing...");
        this.running = true;
        this.controllers = {};

        this.broadcastDiscovery();

        // FIX: Use service.setInterval
        this.discoveryTimer = service.setInterval(() => {
            if (this.running) {
                this.broadcastDiscovery();
            }
        }, BROADCAST_INTERVAL);

        // FIX: Use service.setInterval
        this.livenessTimer = service.setInterval(() => {
            if (this.running) {
                this.checkDeviceLiveness();
            }
        }, LIVENESS_CHECK_INTERVAL);

        service.log("WIZ Discovery Service Started.");
    };

    // FIX: Added empty Update function to prevent log spam
    this.Update = function() {
        // Nothing needed here, timers handle periodic tasks
    };

    this.broadcastDiscovery = function() {
        service.log("Broadcasting WIZ discovery packet...");
        const discoveryPacket = JSON.stringify({
            "method": "registration",
            "params": { "phoneMac": "AAAAAAAAAAAA", "register": false, "phoneIp": "1.2.3.4", "id": "1" }
        });
        // Use service.broadcast for discovery
        service.broadcast(discoveryPacket, 38899);
    };

    this.requestSystemConfig = function(ip) {
         service.log(`Requesting System Config from ${ip}`);
         const configPacket = JSON.stringify({ "method": "getSystemConfig", "id": 1 });
         // FIX: Use service.send for unicast messages
         service.send(ip, 38899, configPacket);
    };

    this.requestPilot = function(ip) {
        // service.log(`Requesting Pilot state from ${ip}`);
        const pilotPacket = JSON.stringify({ "method": "getPilot", "id": 1 });
        // FIX: Use service.send for unicast messages
        service.send(ip, 38899, pilotPacket);
    }

    this.checkDeviceLiveness = function() {
        const now = Date.now();
        let controllersToRemove = [];

        for (const id in this.controllers) {
            const controller = this.controllers[id];
            if (now - controller.lastSeen > DEVICE_TIMEOUT) {
                service.log(`Device ${id} (${controller.ip}) timed out. Last seen ${Math.round((now - controller.lastSeen)/1000)}s ago. Removing.`);
                controllersToRemove.push(id);
            } else {
                 if (now - controller.lastSeen < LIVENESS_CHECK_INTERVAL * 2) {
                    this.requestPilot(controller.ip); // Check if alive
                 }
            }
        }

        controllersToRemove.forEach(id => {
            service.removeControllerById(id);
            delete this.controllers[id];
        });

         service.controllers.forEach(c => {
            const ctrl = c.obj;
            if (this.controllers[ctrl.id] && !ctrl.deviceInfoLoaded && ctrl.initialized) {
                 // Don't re-request config here aggressively, rely on discovery or pilot checks
                 // this.requestSystemConfig(ctrl.ip);
            }
         });
    };

    this.Shutdown = function () {
        service.log("WIZ Discovery Service Shutting Down...");
        this.running = false;
        if (this.discoveryTimer) {
             // FIX: Use service.stopTimer
            service.stopTimer(this.discoveryTimer);
            this.discoveryTimer = null;
        }
        if (this.livenessTimer) {
             // FIX: Use service.stopTimer
            service.stopTimer(this.livenessTimer);
            this.livenessTimer = null;
        }
        this.controllers = {};
        service.log("WIZ Discovery Service Stopped.");
    };

    this.Discovered = function (value) {
        let packet;
        try {
            packet = JSON.parse(value.response);
        } catch (e) {
            service.log(`Error parsing JSON response from ${value.ip}: ${e}. Raw: ${value.response}`);
            return;
        }

        const potentialMac = packet.result?.mac || packet.params?.mac || value.id;
        if (!potentialMac) {
            // Some WIZ responses might lack a MAC, especially errors from broadcasts
            // service.log(`Packet from ${value.ip} doesn't contain identifiable MAC. Method: ${packet.method}`);
            return;
        }
        const macId = potentialMac.toUpperCase();

        // Update last seen and IP/Port if the controller exists in our tracking
        if (this.controllers[macId]) {
            this.controllers[macId].lastSeen = Date.now();
            let ipChanged = false;
            let portChanged = false;

            if (value.ip && this.controllers[macId].ip !== value.ip) {
                service.log(`IP changed for ${macId}: ${this.controllers[macId].ip} -> ${value.ip}`);
                this.controllers[macId].ip = value.ip;
                ipChanged = true;
            }
            if (value.port && this.controllers[macId].port !== value.port) {
                service.log(`Port changed for ${macId}: ${this.controllers[macId].port} -> ${value.port}`);
                this.controllers[macId].port = value.port;
                 portChanged = true;
            }

            // Update the actual SignalRGB controller object if needed
            if(ipChanged || portChanged) {
                 const ctrlToUpdate = service.getController(macId);
                 if (ctrlToUpdate) {
                    if(ipChanged) ctrlToUpdate.ip = value.ip;
                    if(portChanged) ctrlToUpdate.port = value.port;
                    service.updateController(ctrlToUpdate); // Notify SignalRGB
                 }
            }

        } else if (packet.method !== 'registration' && packet.method !== 'syncPilot' && packet.method !== 'firstBeat') {
            // If we receive a non-discovery packet for an unknown device, ignore it for now
            // Avoids trying to handle pilot/config responses for devices not yet created
             // service.log(`Received ${packet.method} from unknown MAC ${macId}. Ignoring until registered.`);
            return;
        }


        switch (packet.method) {
            case `registration`:
                if (packet.result?.success && packet.result.mac) { // Ensure MAC is present
                    // service.log(`Successful registration response from MAC: ${macId} at IP: ${value.ip}`);
                    const created = this.CreateOrUpdateController(macId, value.ip, value.port);
                    if (created || !this.controllers[macId].deviceInfoLoaded) {
                         // Request config if newly created or info wasn't loaded before
                        this.requestSystemConfig(value.ip);
                    }
                } else if (!packet.result?.success) {
                    // service.log(`Registration failed for ${value.ip}. Error: ${packet.error?.message || 'Unknown'}`);
                }
                break;

            case `getSystemConfig`:
                if (packet.result) {
                    // service.log(`Received System Config for ${macId}: ${JSON.stringify(packet.result.moduleName)}`);
                    const controller = this.controllers[macId];
                    if (controller) {
                        const previouslyAnnounced = controller.announced;
                        controller.setDeviceInfo(packet.result);
                         if (!previouslyAnnounced) {
                            service.announceController(controller);
                            controller.announced = true;
                            service.log(`Controller ${macId} (${controller.modelName}) announced.`);
                         } else {
                            service.updateController(controller);
                            // service.log(`Controller ${macId} info updated.`);
                         }
                    } else {
                         // Should not happen often if we ignore packets from unknown MACs earlier
                         service.log(`Received SysConfig for untracked MAC ${macId}. Requesting registration.`);
                         this.broadcastDiscovery(); // Trigger a fresh discovery
                    }
                } else {
                     // service.log(`getSystemConfig error for ${macId}: ${packet.error?.message || 'Unknown'}`);
                }
                break;

            case `getPilot`:
                 const pilotController = this.controllers[macId];
                 if (pilotController && !pilotController.deviceInfoLoaded) {
                    // service.log(`Got pilot from ${macId} but still missing SysConfig. Requesting again.`);
                    this.requestSystemConfig(pilotController.ip);
                 }
                 if(pilotController && !pilotController.announced && pilotController.deviceInfoLoaded){
                     // service.log(`Got pilot from ${macId}, info loaded but not announced. Announcing now.`);
                     service.announceController(pilotController);
                     pilotController.announced = true;
                 }
                break;

            case `syncPilot`:
            case `firstBeat`:
                 if (!this.controllers[macId]) {
                    // service.log(`Detected new device ${macId} via ${packet.method}. Adding and querying.`);
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    this.requestSystemConfig(value.ip); // Query its config
                 } else {
                     this.controllers[macId].lastSeen = Date.now(); // Update liveness
                 }
                break;

            // default: service.log(`Received unhandled method '${packet.method}' from ${macId}`); break;
        }
    };

    this.CreateOrUpdateController = function(macId, ip, port) {
         let created = false;
        if (!this.controllers[macId]) {
            service.log(`Creating new WIZ controller entry for ${macId} at ${ip}:${port}`);
            const newController = new WIZDevice(macId, ip, port);
            this.controllers[macId] = newController;
            created = true;
        } else {
            // service.log(`Updating existing WIZ controller entry for ${macId}`);
            this.controllers[macId].lastSeen = Date.now(); // Ensure lastSeen is updated
             // IP/Port updates handled in Discovered()
        }
        return created; // Return true if a new controller object was created
    };

    this.IconUrl = "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
    this.UdpBroadcastPort = 38899;
    this.UdpBroadcastAddress = "255.255.255.255";
    this.UdpListenPort = 38900;

} // End DiscoveryService

// --- WIZ Device Class ---
class WIZDevice {
    constructor(id, ip, port) {
        this.id = id;
        this.ip = ip;
        this.port = port || 38899;
        this.lastSeen = Date.now();
        this.initialized = true;
        this.deviceInfoLoaded = false;
        this.announced = false;
        this.homeId = null;
        this.fwVersion = "N/A";
        this.roomId = null;
        this.groupId = null;
        this.moduleName = "Unknown";
        this.modelName = "WIZ Device";
        this.isRGB = false;
        this.isTW = false;
        this.wizType = null;
        // service.log(`WIZDevice object created for ${this.id}`); // Less verbose logging
    }

    setDeviceInfo(data) {
        // service.log(`Setting device info for ${this.id} from data: ${JSON.stringify(data)}`);
        this.homeId = data.homeId;
        this.fwVersion = data.fwVersion || "N/A";
        this.roomId = data.roomId;
        this.groupId = data.groupId;
        this.moduleName = data.moduleName || "Unknown";
        this.isRGB = this.moduleName.includes("RGB");
        this.isTW = this.moduleName.includes("TW") || this.moduleName.includes("DW");
        if(this.isRGB) { this.isTW = true; }

        this.wizType = WIZDeviceLibrary[this.moduleName] || WIZDeviceLibrary["default"];
        this.modelName = this.wizType.productName;

        if (this.wizType !== WIZDeviceLibrary["default"]) {
             this.isRGB = this.wizType.supportRGB ?? this.isRGB;
             this.isTW = this.wizType.supportWhiteColor ?? this.isTW;
        } else {
            if (!this.isRGB && !this.isTW) {
                this.isTW = true;
                // service.log(`Module name '${this.moduleName}' not recognized, assuming basic TW/Dimmable.`);
            }
        }

        this.deviceInfoLoaded = true;
        this.lastSeen = Date.now();
        // service.log(`Device info processed for ${this.id}: Name=${this.modelName}, RGB=${this.isRGB}, TW=${this.isTW}`);
    }
}

// --- WIZ Protocol Handler ---
class WizProtocol {
    constructor(ip, port, isTwOnly = false) {
        this.ip = ip;
        this.port = port || 38899;
        this.isTwOnly = isTwOnly;
        this.lastState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: null };
        this.lastSendTime = 0;
        this.minSendInterval = 50; // Throttle commands
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
        if (!this._canSend()) { return; }
        const command = { "method": "setPilot", "params": params };
        // Convert the command object to a JSON string before sending
        udp.send(this.ip, this.port, JSON.stringify(command));
    }

    setPilotRgb(r, g, b, brightness) {
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        if (this.lastState.r !== r || this.lastState.g !== g || this.lastState.b !== b || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "r": r, "g": g, "b": b, "dimming": brightness, "state": true });
            this.lastState = { r, g, b, brightness, power: true, temp: -1 };
        }
    }

    setPilotTw(temperature, brightness) {
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        temperature = Math.max(2200, Math.min(6500, Math.round(temperature)));
        if (this.lastState.temp !== temperature || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "temp": temperature, "dimming": brightness, "state": true });
            this.lastState = { r: -1, g: -1, b: -1, temp: temperature, brightness, power: true };
        }
    }

    setPilotState(isOn) {
        if (this.lastState.power !== isOn) {
            this._sendPilot({ "state": isOn });
            this.lastState.power = isOn;
        }
    }
}

export function ImageUrl() {
    return "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
}