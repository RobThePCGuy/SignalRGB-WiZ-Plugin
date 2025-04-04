// --- START OF FILE WIZ.js.txt ---

export function Name() { return "WIZ Interface"; }
export function Version() { return "1.1.2"; } // Incremented version for fix
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
service: readonly, // Global service object
udp: writeonly,    // Global device-level UDP object
TurnOffOnShutdown: readonly,
AutoStartStream: readwrite,
forcedColor: readwrite,
minBrightness: readwrite,
dimmColor: readwrite,
forceColor: readwrite,
*/

// --- Explicitly Capture Globals ---
// This might help with scope resolution within functions/classes
const _service = service;
const _udp = udp; // Capture udp for the protocol class

// --- Constants ---
const MIN_WIZ_BRIGHTNESS = 10;
const MAX_WIZ_BRIGHTNESS = 100;
const DEFAULT_TW_TEMP = 4000;

// --- User Controllable Parameters ---
export function ControllableParameters() {
    return [
        { "property": "AutoStartStream", "group": "settings", "label": "Automatically Control on Startup", "type": "boolean", "default": true },
        { "property": "forceColor", "group": "settings", "label": "Force Color (Overrides SignalRGB)", "type": "boolean", "default": false },
        { "property": "forcedColor", "group": "lighting", "label": "Forced Color", "type": "color", "default": "#009bde" },
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": "10" },
        { "property": "dimmColor", "group": "lighting", "label": "Color When SignalRGB is Black/Dim", "type": "color", "default": "#101010" },
    ];
}

/** @type {WizProtocol} */
let wizProtocol;
let isInitialized = false;

// --- Main Device Functions (Initialize, Render, Shutdown) ---
export function Initialize() {
    device.log(`Initializing WIZ Device: ${controller.id} (${controller.modelName || 'Unknown Model'})`);
    device.addFeature("udp");
    device.setName(`WIZ ${controller.modelName ? controller.modelName : ''} (${controller.id.substring(controller.id.length - 4)})`);

    if (controller.wizType && controller.wizType.imageUrl) { /* device.setIconUrl(controller.wizType.imageUrl); */ }

    device.setControllableLeds(["LED 1"], [[0, 0]]);
    device.setSize([1, 1]);

    if (controller.isTW && !controller.isRGB) {
        device.removeProperty("forcedColor");
        device.removeProperty("forceColor");
        device.removeProperty("dimmColor");
        device.log("Device is Tunable White only. Color properties removed.");
    }

    // Pass captured _udp to WizProtocol if needed (it uses global udp directly now)
    wizProtocol = new WizProtocol(controller.ip, controller.port, controller.isTW && !controller.isRGB);
    isInitialized = true;

    if (AutoStartStream) {
        device.log("AutoStartStream enabled. Initializing state.");
        Render();
    } else {
        device.log("AutoStartStream disabled. Device will wait for SignalRGB data.");
    }
}

export function Render() {
    if (!isInitialized || !wizProtocol) { return; }
    if (!AutoStartStream) { return; }

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
const WIZDeviceLibrary = { /* ... (definition unchanged) ... */
    "ESP01_SHDW_01":    { productName: "WIZ Smart Plug", imageUrl: "", supportRGB: false, supportDimming: false, supportWhiteColor: false, ledCount: 0 },
    "ESP03_SHRGB3_01":  { productName: "WRGB LED Strip", imageUrl: "https://www.assets.signify.com/is/image/Signify/WiFi-BLE-LEDstrip-2M-1600lm-startkit-SPP?&wid=200&hei=200&qlt=100", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP15_SHTW_01I":   { productName: "WIZ Tunable White A60 E27", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP06_SHRGB_01":   { productName: "WIZ Color A60 E27", imageUrl: "https://www.assets.signify.com/is/image/PhilipsLighting/9290023835-IMS-en_SG?wid=400&hei=400&$pnglarge$", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP20_SHRGBW_01B": { productName: "WIZ Squire Table Lamp", imageUrl: "", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "default":          { productName: "Unknown WIZ Device", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 }
};

// --- Discovery Service ---
export function DiscoveryService() {

    // Assign properties directly to 'this' for the instance
    this.running = false;
    this.discoveryTimer = null;
    this.livenessTimer = null;
    this.controllers = {}; // Track discovered devices internally

    const BROADCAST_INTERVAL = 60000;
    const LIVENESS_CHECK_INTERVAL = 30000;
    const DEVICE_TIMEOUT = BROADCAST_INTERVAL * 3.5; // ~3.5 minutes

    // --- Service Methods ---

    this.Initialize = function () {
        _service.log("WIZ Discovery Service Initializing..."); // Use captured global
        this.running = true;
        this.controllers = {};
        this.broadcastDiscovery(); // Initial broadcast

        // FIX: Use captured _service for timers
        this.discoveryTimer = _service.setInterval(() => {
            if (this.running) {
                this.broadcastDiscovery();
            }
        }, BROADCAST_INTERVAL);

        this.livenessTimer = _service.setInterval(() => {
            if (this.running) {
                this.checkDeviceLiveness();
            }
        }, LIVENESS_CHECK_INTERVAL);

        _service.log("WIZ Discovery Service Started.");
    };

    this.Update = function() {
        // Empty Update function to prevent log spam
    };

    this.Shutdown = function () {
        _service.log("WIZ Discovery Service Shutting Down..."); // Use captured global
        this.running = false;
        if (this.discoveryTimer) {
            _service.stopTimer(this.discoveryTimer); // Use captured global
            this.discoveryTimer = null;
        }
        if (this.livenessTimer) {
            _service.stopTimer(this.livenessTimer); // Use captured global
            this.livenessTimer = null;
        }
        this.controllers = {};
        _service.log("WIZ Discovery Service Stopped.");
    };

    // --- Internal Helper Methods ---

    this.broadcastDiscovery = function() {
        _service.log("Broadcasting WIZ discovery packet..."); // Use captured global
        const discoveryPacket = JSON.stringify({
            "method": "registration",
            "params": { "phoneMac": "AAAAAAAAAAAA", "register": false, "phoneIp": "1.2.3.4", "id": "1" }
        });
        _service.broadcast(discoveryPacket, 38899); // Use captured global
    };

    this.requestSystemConfig = function(ip) {
         _service.log(`Requesting System Config from ${ip}`); // Use captured global
         const configPacket = JSON.stringify({ "method": "getSystemConfig", "id": 1 });
         _service.send(ip, 38899, configPacket); // FIX: Use captured _service for unicast
    };

    this.requestPilot = function(ip) {
        const pilotPacket = JSON.stringify({ "method": "getPilot", "id": 1 });
        _service.send(ip, 38899, pilotPacket); // FIX: Use captured _service for unicast
    }

    this.checkDeviceLiveness = function() {
        const now = Date.now();
        let controllersToRemove = [];

        for (const id in this.controllers) {
            const controller = this.controllers[id];
            if (now - controller.lastSeen > DEVICE_TIMEOUT) {
                _service.log(`Device ${id} (${controller.ip}) timed out. Last seen ${Math.round((now - controller.lastSeen)/1000)}s ago. Removing.`);
                controllersToRemove.push(id);
            } else {
                 if (now - controller.lastSeen < LIVENESS_CHECK_INTERVAL * 2) {
                    this.requestPilot(controller.ip); // Check if alive
                 }
            }
        }

        controllersToRemove.forEach(id => {
            _service.removeControllerById(id); // Use captured global
            delete this.controllers[id];
        });

        // Check for controllers that might need announcing (less critical now)
        // _service.controllers.forEach(c => { ... }); // Accessing _service.controllers should be fine
    };

    this.CreateOrUpdateController = function(macId, ip, port) {
         let created = false;
        if (!this.controllers[macId]) {
            _service.log(`Creating new WIZ controller entry for ${macId} at ${ip}:${port}`);
            const newController = new WIZDevice(macId, ip, port);
            this.controllers[macId] = newController;
            created = true;
        } else {
            this.controllers[macId].lastSeen = Date.now();
        }
        return created;
    };

    // --- Discovered Packet Handler ---

    this.Discovered = function (value) {
        let packet;
        try { packet = JSON.parse(value.response); }
        catch (e) { _service.log(`Error parsing JSON response from ${value.ip}: ${e}. Raw: ${value.response}`); return; }

        const potentialMac = packet.result?.mac || packet.params?.mac || value.id;
        if (!potentialMac) { return; }
        const macId = potentialMac.toUpperCase();

        if (this.controllers[macId]) {
            this.controllers[macId].lastSeen = Date.now();
            let ipChanged = (value.ip && this.controllers[macId].ip !== value.ip);
            let portChanged = (value.port && this.controllers[macId].port !== value.port);

            if (ipChanged) { _service.log(`IP changed for ${macId}: ${this.controllers[macId].ip} -> ${value.ip}`); this.controllers[macId].ip = value.ip; }
            if (portChanged) { _service.log(`Port changed for ${macId}: ${this.controllers[macId].port} -> ${value.port}`); this.controllers[macId].port = value.port; }

            if(ipChanged || portChanged) {
                 const ctrlToUpdate = _service.getController(macId); // Use captured global
                 if (ctrlToUpdate) {
                    if(ipChanged) ctrlToUpdate.ip = value.ip;
                    if(portChanged) ctrlToUpdate.port = value.port;
                    _service.updateController(ctrlToUpdate); // Use captured global
                 }
            }
        } else if (!['registration', 'syncPilot', 'firstBeat'].includes(packet.method)) {
            // Ignore non-discovery packets from unknown devices
            return;
        }

        // Handle packet methods
        switch (packet.method) {
            case `registration`:
                if (packet.result?.success && packet.result.mac) {
                    const created = this.CreateOrUpdateController(macId, value.ip, value.port);
                    if (created || !this.controllers[macId]?.deviceInfoLoaded) { // Check internal controller state
                        this.requestSystemConfig(value.ip);
                    }
                } // else: Optional logging for failed registration
                break;

            case `getSystemConfig`:
                if (packet.result) {
                    const controller = this.controllers[macId];
                    if (controller) {
                        const previouslyAnnounced = controller.announced;
                        controller.setDeviceInfo(packet.result);
                         if (!previouslyAnnounced) {
                            _service.announceController(controller); // Use captured global
                            controller.announced = true;
                            _service.log(`Controller ${macId} (${controller.modelName}) announced.`);
                         } else {
                            _service.updateController(controller); // Use captured global
                         }
                    } else { _service.log(`Received SysConfig for untracked MAC ${macId}. Requesting registration.`); this.broadcastDiscovery(); }
                } // else: Optional logging for error
                break;

            case `getPilot`:
                 const pilotController = this.controllers[macId];
                 if (pilotController) { // Check if we are tracking it
                     if (!pilotController.deviceInfoLoaded) { this.requestSystemConfig(pilotController.ip); }
                     if (!pilotController.announced && pilotController.deviceInfoLoaded) {
                         _service.announceController(pilotController); // Use captured global
                         pilotController.announced = true;
                     }
                 }
                break;

            case `syncPilot`:
            case `firstBeat`:
                 if (!this.controllers[macId]) { // If detected via passive broadcast
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    this.requestSystemConfig(value.ip); // Query its config
                 } else { this.controllers[macId].lastSeen = Date.now(); } // Update liveness
                break;
        }
    };

    // --- Service Properties ---
    this.IconUrl = "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
    this.UdpBroadcastPort = 38899;
    this.UdpBroadcastAddress = "255.255.255.255";
    this.UdpListenPort = 38900;

} // End DiscoveryService

// --- WIZ Device Class ---
class WIZDevice {
    constructor(id, ip, port) { /* ... (definition unchanged) ... */
        this.id = id; this.ip = ip; this.port = port || 38899; this.lastSeen = Date.now();
        this.initialized = true; this.deviceInfoLoaded = false; this.announced = false;
        this.homeId = null; this.fwVersion = "N/A"; this.roomId = null; this.groupId = null;
        this.moduleName = "Unknown"; this.modelName = "WIZ Device"; this.isRGB = false; this.isTW = false; this.wizType = null;
    }
    setDeviceInfo(data) { /* ... (definition unchanged) ... */
        this.homeId = data.homeId; this.fwVersion = data.fwVersion || "N/A"; this.roomId = data.roomId; this.groupId = data.groupId;
        this.moduleName = data.moduleName || "Unknown"; this.isRGB = this.moduleName.includes("RGB"); this.isTW = this.moduleName.includes("TW") || this.moduleName.includes("DW");
        if(this.isRGB) { this.isTW = true; } this.wizType = WIZDeviceLibrary[this.moduleName] || WIZDeviceLibrary["default"]; this.modelName = this.wizType.productName;
        if (this.wizType !== WIZDeviceLibrary["default"]) { this.isRGB = this.wizType.supportRGB ?? this.isRGB; this.isTW = this.wizType.supportWhiteColor ?? this.isTW; }
        else { if (!this.isRGB && !this.isTW) { this.isTW = true; } }
        this.deviceInfoLoaded = true; this.lastSeen = Date.now();
     }
}

// --- WIZ Protocol Handler ---
class WizProtocol {
    constructor(ip, port, isTwOnly = false) {
        this.ip = ip; this.port = port || 38899; this.isTwOnly = isTwOnly;
        this.lastState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: null };
        this.lastSendTime = 0; this.minSendInterval = 50;
    }
    _canSend() { const now = Date.now(); if (now - this.lastSendTime > this.minSendInterval) { this.lastSendTime = now; return true; } return false; }
    _sendPilot(params) {
        if (!this._canSend()) { return; }
        const command = { "method": "setPilot", "params": params };
        // FIX: Use captured global _udp for device-level sending
        _udp.send(this.ip, this.port, command);
    }
    setPilotRgb(r, g, b, brightness) { /* ... (unchanged) ... */
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        if (this.lastState.r !== r || this.lastState.g !== g || this.lastState.b !== b || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "r": r, "g": g, "b": b, "dimming": brightness, "state": true });
            this.lastState = { r, g, b, brightness, power: true, temp: -1 };
        }
    }
    setPilotTw(temperature, brightness) { /* ... (unchanged) ... */
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        temperature = Math.max(2200, Math.min(6500, Math.round(temperature)));
         if (this.lastState.temp !== temperature || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "temp": temperature, "dimming": brightness, "state": true });
             this.lastState = { r: -1, g: -1, b: -1, temp: temperature, brightness, power: true };
         }
     }
    setPilotState(isOn) { /* ... (unchanged) ... */
        if (this.lastState.power !== isOn) { this._sendPilot({ "state": isOn }); this.lastState.power = isOn; }
     }
}

// --- ImageUrl ---
export function ImageUrl() {
    return "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
}

// --- END OF FILE WIZ.js.txt ---
