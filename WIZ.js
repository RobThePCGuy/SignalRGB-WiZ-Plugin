export function Name() { return "WIZ Interface"; }
<<<<<<< HEAD
export function Version() { return "1.1.1"; } // Incremented version for fix
=======
export function Version() { return "1.1.2"; } // Scope fix version
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
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
<<<<<<< HEAD
service: readonly, // Correct global object for service functions
udp: writeonly,    // Correct global object for device-level UDP send
=======
service: readonly, // Global service object
udp: writeonly,    // Global device-level UDP object
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
TurnOffOnShutdown: readonly,
AutoStartStream: readwrite,
forcedColor: readwrite,
minBrightness: readwrite,
dimmColor: readwrite,
forceColor: readwrite,
*/

<<<<<<< HEAD
// Constants
const MIN_WIZ_BRIGHTNESS = 10;
const MAX_WIZ_BRIGHTNESS = 100;
const DEFAULT_TW_TEMP = 4000;
=======
// --- Explicitly Capture Globals ---
// This helps resolve scope issues within functions/classes
const _service = service;
const _udp = udp;

// --- Constants ---
const MIN_WIZ_BRIGHTNESS = 10; // WIZ brightness range is 10-100
const MAX_WIZ_BRIGHTNESS = 100;
const DEFAULT_TW_TEMP = 4000; // Default Kelvin for TW devices
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716

// --- User Controllable Parameters ---
export function ControllableParameters() {
    return [
        { "property": "AutoStartStream", "group": "settings", "label": "Automatically Control on Startup", "type": "boolean", "default": true },
        { "property": "forceColor", "group": "settings", "label": "Force Color (Overrides SignalRGB)", "type": "boolean", "default": false },
        { "property": "forcedColor", "group": "lighting", "label": "Forced Color", "type": "color", "default": "#009bde" },
<<<<<<< HEAD
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": 10 },
=======
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": "10" },
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
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

    if (controller.wizType && controller.wizType.imageUrl) {
<<<<<<< HEAD
        // device.setIconUrl(controller.wizType.imageUrl);
=======
        // device.setIconUrl(controller.wizType.imageUrl); // Uncomment if using setIconUrl
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
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

export function Render() {
<<<<<<< HEAD
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

=======
    if (!isInitialized || !wizProtocol) { return; } // Guard against calls before init
    if (!AutoStartStream) { return; } // Don't control if auto-start is off

    let r, g, b, brightnessPercent;

    // Determine color source
    if (forceColor && controller.isRGB) { // Force color only works reliably on RGB devices
        [r, g, b] = device.hexToRgb(forcedColor);
        brightnessPercent = device.getBrightness(); // Use master brightness slider
    } else {
        [r, g, b] = device.color(0, 0); // Get color from SignalRGB effect
        brightnessPercent = device.getBrightness();
    }

    // Map SignalRGB brightness (0-100) to WIZ range (10-100), respecting minBrightness
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    let wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness, Math.round(brightnessPercent / 100 * (MAX_WIZ_BRIGHTNESS - MIN_WIZ_BRIGHTNESS) + MIN_WIZ_BRIGHTNESS));
    wizBrightness = Math.min(MAX_WIZ_BRIGHTNESS, wizBrightness);

<<<<<<< HEAD
=======
    // Handle the "dim color" case when SignalRGB output is very dark/black
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    const isSignalDark = r < 5 && g < 5 && b < 5;

    if (isSignalDark && controller.isRGB) {
        [r, g, b] = device.hexToRgb(dimmColor);
<<<<<<< HEAD
        wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness);
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    } else if (controller.isTW && !controller.isRGB) {
        wizProtocol.setPilotTw(DEFAULT_TW_TEMP, wizBrightness);
    } else {
=======
        wizBrightness = Math.max(MIN_WIZ_BRIGHTNESS, minBrightness); // Use min brightness when dimmed
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    } else if (controller.isTW && !controller.isRGB) { // Handle Tunable White only device
        wizProtocol.setPilotTw(DEFAULT_TW_TEMP, wizBrightness); // Use default temp, only control brightness
    } else { // Handle RGB or RGB+TW device with SignalRGB color
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    }
}

<<<<<<< HEAD
// Called when the plugin or SignalRGB shuts down
=======
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
export function Shutdown(suspend) {
    device.log(`Shutdown called (suspend: ${suspend})`);
    if (wizProtocol) {
        if (TurnOffOnShutdown && AutoStartStream) {
            device.log("Turning off device due to TurnOffOnShutdown setting.");
            wizProtocol.setPilotState(false);
        } else {
             device.log("Leaving device in current state on shutdown.");
             // Optionally send a neutral state if desired when not turning off
        }
    }
    isInitialized = false;
}

<<<<<<< HEAD
// --- WIZ Device Data Structure ---
/** @typedef {object} WizTypeInfo ... */ // (keeping definitions concise)
=======
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
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
const WIZDeviceLibrary = {
    "ESP01_SHDW_01":    { productName: "WIZ Smart Plug", imageUrl: "", supportRGB: false, supportDimming: false, supportWhiteColor: false, ledCount: 0 },
    "ESP03_SHRGB3_01":  { productName: "WRGB LED Strip", imageUrl: "https://www.assets.signify.com/is/image/Signify/WiFi-BLE-LEDstrip-2M-1600lm-startkit-SPP?&wid=200&hei=200&qlt=100", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP15_SHTW_01I":   { productName: "WIZ Tunable White A60 E27", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP06_SHRGB_01":   { productName: "WIZ Color A60 E27", imageUrl: "https://www.assets.signify.com/is/image/PhilipsLighting/9290023835-IMS-en_SG?wid=400&hei=400&$pnglarge$", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP20_SHRGBW_01B": { productName: "WIZ Squire Table Lamp", imageUrl: "", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
<<<<<<< HEAD
    "default":          { productName: "Unknown WIZ Device", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 }
=======
    // Add more known devices here using their 'moduleName'
    "default":          { productName: "Unknown WIZ Device", imageUrl: "", supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 } // Default fallback
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
};

// --- Discovery Service ---
export function DiscoveryService() {

    // Assign properties directly to 'this' for the instance
    this.running = false;
    this.discoveryTimer = null;
    this.livenessTimer = null;
<<<<<<< HEAD
    this.controllers = {};

    const BROADCAST_INTERVAL = 60000;
    const LIVENESS_CHECK_INTERVAL = 30000;
    const DEVICE_TIMEOUT = BROADCAST_INTERVAL * 3.5;
=======
    this.controllers = {}; // Track discovered devices internally keyed by MAC ID

    // Constants for timing
    const BROADCAST_INTERVAL = 60000; // 60 seconds
    const LIVENESS_CHECK_INTERVAL = 30000; // 30 seconds
    const DEVICE_TIMEOUT = BROADCAST_INTERVAL * 3.5; // ~3.5 minutes timeout
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716

    // --- Service Methods ---

    this.Initialize = function () {
        _service.log("WIZ Discovery Service Initializing..."); // Use captured global
        this.running = true;
<<<<<<< HEAD
        this.controllers = {};

        this.broadcastDiscovery();

        // FIX: Use service.setInterval
        this.discoveryTimer = service.setInterval(() => {
=======
        this.controllers = {}; // Clear previous state
        this.broadcastDiscovery(); // Initial broadcast

        // Use captured _service for timers
        this.discoveryTimer = _service.setInterval(() => {
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
            if (this.running) {
                this.broadcastDiscovery();
            }
        }, BROADCAST_INTERVAL);

<<<<<<< HEAD
        // FIX: Use service.setInterval
        this.livenessTimer = service.setInterval(() => {
=======
        this.livenessTimer = _service.setInterval(() => {
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
            if (this.running) {
                this.checkDeviceLiveness();
            }
        }, LIVENESS_CHECK_INTERVAL);

        _service.log("WIZ Discovery Service Started.");
    };

<<<<<<< HEAD
    // FIX: Added empty Update function to prevent log spam
    this.Update = function() {
        // Nothing needed here, timers handle periodic tasks
    };

    this.broadcastDiscovery = function() {
        service.log("Broadcasting WIZ discovery packet...");
=======
    this.Update = function() {
        // Empty Update function required by SignalRGB, but logic is timer-based
    };

    this.Shutdown = function () {
        _service.log("WIZ Discovery Service Shutting Down..."); // Use captured global
        this.running = false;
        // Use captured _service to stop timers
        if (this.discoveryTimer) {
            _service.stopTimer(this.discoveryTimer);
            this.discoveryTimer = null;
        }
        if (this.livenessTimer) {
            _service.stopTimer(this.livenessTimer);
            this.livenessTimer = null;
        }
        this.controllers = {}; // Clear internal tracking
        _service.log("WIZ Discovery Service Stopped.");
    };

    // --- Internal Helper Methods ---

    this.broadcastDiscovery = function() {
        _service.log("Broadcasting WIZ discovery packet..."); // Use captured global
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        const discoveryPacket = JSON.stringify({
            "method": "registration",
            "params": { "phoneMac": "AAAAAAAAAAAA", "register": false, "phoneIp": "1.2.3.4", "id": "1" }
        });
<<<<<<< HEAD
        // Use service.broadcast for discovery
        service.broadcast(discoveryPacket, 38899);
=======
        _service.broadcast(discoveryPacket, 38899); // Use captured global for broadcast
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    };

    this.requestSystemConfig = function(ip) {
         _service.log(`Requesting System Config from ${ip}`); // Use captured global
         const configPacket = JSON.stringify({ "method": "getSystemConfig", "id": 1 });
<<<<<<< HEAD
         // FIX: Use service.send for unicast messages
         service.send(ip, 38899, configPacket);
=======
         // Use captured _service for unicast send
         _service.send(ip, 38899, configPacket);
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    };

    this.requestPilot = function(ip) {
        // Sends a getPilot message to check if a device is responsive
        const pilotPacket = JSON.stringify({ "method": "getPilot", "id": 1 });
<<<<<<< HEAD
        // FIX: Use service.send for unicast messages
        service.send(ip, 38899, pilotPacket);
=======
        // Use captured _service for unicast send
        _service.send(ip, 38899, pilotPacket);
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    }

    this.checkDeviceLiveness = function() {
        const now = Date.now();
        let controllersToRemove = [];

<<<<<<< HEAD
=======
        // Check internal controller tracking
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        for (const id in this.controllers) {
            const controller = this.controllers[id];
            if (now - controller.lastSeen > DEVICE_TIMEOUT) {
                _service.log(`Device ${id} (${controller.ip}) timed out. Last seen ${Math.round((now - controller.lastSeen)/1000)}s ago. Removing.`);
                controllersToRemove.push(id);
            } else {
<<<<<<< HEAD
=======
                 // If seen recently, optionally send a pilot request to confirm it's still there
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
                 if (now - controller.lastSeen < LIVENESS_CHECK_INTERVAL * 2) {
                    this.requestPilot(controller.ip); // Check if alive
                 }
            }
        }

<<<<<<< HEAD
        controllersToRemove.forEach(id => {
            service.removeControllerById(id);
            delete this.controllers[id];
        });

         service.controllers.forEach(c => {
            const ctrl = c.obj;
            if (this.controllers[ctrl.id] && !ctrl.deviceInfoLoaded && ctrl.initialized) {
                 // Don't re-request config here aggressively, rely on discovery or pilot checks
=======
        // Remove timed-out controllers from SignalRGB and internal tracking
        controllersToRemove.forEach(id => {
            _service.removeControllerById(id); // Use captured global
            delete this.controllers[id];
        });

        // Optionally check SignalRGB's list for devices needing initialization (less critical with robust discovery)
        /*
         _service.controllers.forEach(c => {
            const ctrl = c.obj;
            if (this.controllers[ctrl.id] && !ctrl.deviceInfoLoaded && ctrl.initialized) {
                 // Maybe request config again if stuck?
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
                 // this.requestSystemConfig(ctrl.ip);
            }
         });
        */
    };

<<<<<<< HEAD
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
=======
    this.CreateOrUpdateController = function(macId, ip, port) {
        // Adds or updates the internal tracking for a controller
        let created = false;
        if (!this.controllers[macId]) {
            _service.log(`Creating new WIZ controller entry for ${macId} at ${ip}:${port}`);
            const newController = new WIZDevice(macId, ip, port); // Use the WIZDevice class
            this.controllers[macId] = newController;
            created = true; // Flag that a new object was created
        } else {
            // Update last seen time (IP/Port updates happen in Discovered)
            this.controllers[macId].lastSeen = Date.now();
        }
        return created; // Return true if a new internal entry was made
    };

    // --- Discovered Packet Handler ---

    this.Discovered = function (value) {
        // Processes incoming UDP packets on the listen port (38900)
        let packet;
        try { packet = JSON.parse(value.response); }
        catch (e) { _service.log(`Error parsing JSON response from ${value.ip}: ${e}. Raw: ${value.response}`); return; }

        // Identify the device by MAC from the packet data
        const potentialMac = packet.result?.mac || packet.params?.mac || value.id; // Use WIZDevice ID as fallback
        if (!potentialMac) {
            // Ignore packets without a MAC (e.g., some error responses)
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
            return;
        }
        const macId = potentialMac.toUpperCase();

<<<<<<< HEAD
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
=======
        // --- Update tracked controller info (IP, Port, LastSeen) ---
        if (this.controllers[macId]) {
            this.controllers[macId].lastSeen = Date.now();
            let ipChanged = (value.ip && this.controllers[macId].ip !== value.ip);
            let portChanged = (value.port && this.controllers[macId].port !== value.port);

            // Update internal tracking
            if (ipChanged) { _service.log(`IP changed for ${macId}: ${this.controllers[macId].ip} -> ${value.ip}`); this.controllers[macId].ip = value.ip; }
            if (portChanged) { _service.log(`Port changed for ${macId}: ${this.controllers[macId].port} -> ${value.port}`); this.controllers[macId].port = value.port; }

            // If IP/Port changed, update the actual SignalRGB controller object
            if(ipChanged || portChanged) {
                 const ctrlToUpdate = _service.getController(macId); // Use captured global
                 if (ctrlToUpdate) {
                    if(ipChanged) ctrlToUpdate.ip = value.ip;
                    if(portChanged) ctrlToUpdate.port = value.port;
                    _service.updateController(ctrlToUpdate); // Use captured global
                 }
            }
        } else if (!['registration', 'syncPilot', 'firstBeat'].includes(packet.method)) {
            // If it's not a discovery-related packet and we don't know this MAC, ignore it.
            // Prevents processing pilot/config responses before registration is confirmed.
            return;
        }

        // --- Handle different WIZ packet methods ---
        switch (packet.method) {
            case `registration`:
                if (packet.result?.success && packet.result.mac) { // Ensure success and MAC present
                    const created = this.CreateOrUpdateController(macId, value.ip, value.port);
                    // If newly created OR if we haven't loaded its info yet, request config
                    if (created || !this.controllers[macId]?.deviceInfoLoaded) {
                        this.requestSystemConfig(value.ip);
                    }
                } // else: Optional: Log registration failures
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
                break;

            case `getSystemConfig`:
                if (packet.result) {
<<<<<<< HEAD
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
=======
                    const controller = this.controllers[macId]; // Check our internal tracking
                    if (controller) {
                        const previouslyAnnounced = controller.announced;
                        controller.setDeviceInfo(packet.result); // Update internal WIZDevice object
                         // Announce to SignalRGB only AFTER info is loaded and only ONCE
                         if (!previouslyAnnounced) {
                            _service.announceController(controller); // Use captured global
                            controller.announced = true; // Mark as announced
                            _service.log(`Controller ${macId} (${controller.modelName}) announced.`);
                         } else {
                            // If already announced, just update SignalRGB's copy if needed
                            _service.updateController(controller); // Use captured global
                         }
                    } else {
                        // Received config for a device we aren't tracking? Should be rare now.
                         _service.log(`Received SysConfig for untracked MAC ${macId}. Requesting registration.`);
                         this.broadcastDiscovery(); // Trigger a fresh discovery
                    }
                } // else: Optional: Log getSystemConfig errors
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
                break;

            case `getPilot`:
                 const pilotController = this.controllers[macId];
<<<<<<< HEAD
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
=======
                 if (pilotController) { // Check if we are tracking it
                     // If we get a pilot response but haven't loaded config, request config again
                     if (!pilotController.deviceInfoLoaded) { this.requestSystemConfig(pilotController.ip); }
                     // If info is loaded but somehow not announced yet, announce now
                     if (!pilotController.announced && pilotController.deviceInfoLoaded) {
                         _service.announceController(pilotController); // Use captured global
                         pilotController.announced = true;
                     }
                     // Otherwise, this just confirms the device is alive (lastSeen updated earlier)
                 }
                break;

            case `syncPilot`: // Often broadcast periodically by devices
            case `firstBeat`: // Sent on device boot/reconnect
                 // These are useful for passive discovery and liveness
                 if (!this.controllers[macId]) { // If detected via passive broadcast
                    _service.log(`Detected new device ${macId} via ${packet.method}. Adding and querying.`);
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    this.requestSystemConfig(value.ip); // Query its config
                 } else {
                     this.controllers[macId].lastSeen = Date.now(); // Just update liveness
                 }
                break;

             // default: // Optional: Log unhandled methods
             //    _service.log(`Received unhandled method '${packet.method}' from ${macId}`);
             //    break;
        }
    };

    // --- Service Configuration Properties ---
    this.IconUrl = "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
    this.UdpBroadcastPort = 38899; // Port to send discovery packets TO
    this.UdpBroadcastAddress = "255.255.255.255"; // Standard broadcast
    this.UdpListenPort = 38900; // Port SignalRGB should listen ON for replies

} // End DiscoveryService

// --- WIZ Device Class (Represents a discovered device's state) ---
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
class WIZDevice {
    constructor(id, ip, port) {
        this.id = id;
        this.ip = ip;
        this.port = port || 38899;
        this.lastSeen = Date.now();
<<<<<<< HEAD
        this.initialized = true;
        this.deviceInfoLoaded = false;
        this.announced = false;
=======

        // Flags
        this.initialized = true; // Basic object is created
        this.deviceInfoLoaded = false; // Set true after getSystemConfig success
        this.announced = false; // Set true after _service.announceController()

        // Device Info (populated by setDeviceInfo)
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        this.homeId = null;
        this.fwVersion = "N/A";
        this.roomId = null;
        this.groupId = null;
        this.moduleName = "Unknown";
        this.modelName = "WIZ Device";
        this.isRGB = false;
<<<<<<< HEAD
        this.isTW = false;
        this.wizType = null;
        // service.log(`WIZDevice object created for ${this.id}`); // Less verbose logging
    }

    setDeviceInfo(data) {
        // service.log(`Setting device info for ${this.id} from data: ${JSON.stringify(data)}`);
=======
        this.isTW = false; // Tunable White
        this.wizType = null; // Reference to WIZDeviceLibrary entry
    }

    setDeviceInfo(data) {
        // Populates device details from a getSystemConfig result
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        this.homeId = data.homeId;
        this.fwVersion = data.fwVersion || "N/A";
        this.roomId = data.roomId;
        this.groupId = data.groupId;
        this.moduleName = data.moduleName || "Unknown";
<<<<<<< HEAD
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
=======

        // Determine capabilities based on moduleName (heuristic)
        this.isRGB = this.moduleName.includes("RGB");
        // DW often means tunable white too
        this.isTW = this.moduleName.includes("TW") || this.moduleName.includes("DW");
        // If it's RGB, it usually also supports TW adjustments via RGB channels
        if(this.isRGB) { this.isTW = true; }

        // Look up in library for user-friendly name and refined capabilities
        this.wizType = WIZDeviceLibrary[this.moduleName] || WIZDeviceLibrary["default"];
        this.modelName = this.wizType.productName;

        // Update capabilities based on library if more specific
        if (this.wizType !== WIZDeviceLibrary["default"]) {
             this.isRGB = this.wizType.supportRGB ?? this.isRGB; // Use library value if defined, else keep detected
             this.isTW = this.wizType.supportWhiteColor ?? this.isTW;
        } else {
            // Fallback logic if not in library and no keywords found
            if (!this.isRGB && !this.isTW) {
                this.isTW = true; // Assume basic dimmable/TW if unknown
            }
        }

        this.deviceInfoLoaded = true; // Mark info as loaded
        this.lastSeen = Date.now(); // Update lastSeen when info is set/updated
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    }
}

// --- WIZ Protocol Handler (Sends commands to a specific device) ---
class WizProtocol {
    constructor(ip, port, isTwOnly = false) {
        this.ip = ip;
<<<<<<< HEAD
        this.port = port || 38899;
        this.isTwOnly = isTwOnly;
        this.lastState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: null };
        this.lastSendTime = 0;
        this.minSendInterval = 50; // Throttle commands
=======
        this.port = port || 38899; // WIZ command port
        this.isTwOnly = isTwOnly; // Flag for TW-only devices

        // State for rate limiting and avoiding redundant commands
        this.lastState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: null };
        this.lastSendTime = 0;
        this.minSendInterval = 50; // Milliseconds throttle (adjust if needed)
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
    }

    _canSend() {
        // Checks if enough time has passed since the last command
        const now = Date.now();
        if (now - this.lastSendTime > this.minSendInterval) {
            this.lastSendTime = now;
            return true;
        }
        return false;
    }

    _sendPilot(params) {
<<<<<<< HEAD
        if (!this._canSend()) { return; }
        const command = { "method": "setPilot", "params": params };
        // Convert the command object to a JSON string before sending
        udp.send(this.ip, this.port, JSON.stringify(command));
    }

    setPilotRgb(r, g, b, brightness) {
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
=======
        // Internal method to send a setPilot command with throttling
        if (!this._canSend()) { return; } // Abort if throttled
        const command = { "method": "setPilot", "params": params };
        // Use the captured global _udp for sending device commands
        _udp.send(this.ip, this.port, command);
    }

    setPilotRgb(r, g, b, brightness) {
        // Sets RGB color and brightness, ensuring state is true
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        // Send only if state actually changes or power needs turning on
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        if (this.lastState.r !== r || this.lastState.g !== g || this.lastState.b !== b || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "r": r, "g": g, "b": b, "dimming": brightness, "state": true });
            this.lastState = { r, g, b, brightness, power: true, temp: -1 }; // Update cache
        }
    }

    setPilotTw(temperature, brightness) {
<<<<<<< HEAD
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
=======
        // Sets Tunable White temperature and brightness, ensuring state is true
        brightness = Math.max(MIN_WIZ_BRIGHTNESS, Math.min(MAX_WIZ_BRIGHTNESS, Math.round(brightness)));
        temperature = Math.max(2200, Math.min(6500, Math.round(temperature))); // Clamp temperature
         // Send only if state actually changes or power needs turning on
         if (this.lastState.temp !== temperature || this.lastState.brightness !== brightness || this.lastState.power !== true) {
            this._sendPilot({ "temp": temperature, "dimming": brightness, "state": true });
             this.lastState = { r: -1, g: -1, b: -1, temp: temperature, brightness, power: true }; // Update cache
         }
     }

    setPilotState(isOn) {
        // Sets the power state (true=on, false=off)
        // Send only if power state changes
        if (this.lastState.power !== isOn) {
            this._sendPilot({ "state": isOn });
             // Update cache - Don't clear color state when turning off
             this.lastState.power = isOn;
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
        }
    }
}

<<<<<<< HEAD
=======
// --- ImageUrl Function (Optional but good practice) ---
>>>>>>> d3998953e23bf01e054f44b078ba37aca4030716
export function ImageUrl() {
    // Returns the URL for the plugin icon in SignalRGB's UI
    return "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
}
