export function Name() { return "WiZ Interface"; }
export function Version() { return "1.2.0"; }
export function VendorId() { return 0x0; }
export function ProductId() { return 0x0; }
export function Type() { return "network"; }
export function Publisher() { return "RobThePCGuy Enhanced (Previously GreenSky Productions)"; }
export function Size() { return [1, 1]; }
export function DefaultPosition() { return [75, 70]; }
export function DefaultScale() { return 10.0; }
export function DefaultComponentBrand() { return "WiZ"; }
export function SubdeviceController() { return false; }

const MIN_WiZ_BRIGHTNESS = 10;
const MAX_WiZ_BRIGHTNESS = 100;
const MIN_WiZ_TEMPERATURE = 2200;
const MAX_WiZ_TEMPERATURE = 6500;
const DEFAULT_WiZ_TEMPERATURE = 4000;
const DEFAULT_DISCOVERY_INTERVAL_S = 60;
const DEFAULT_LIVENESS_CHECK_S = 30;

export function ControllableParameters() {
    return [
        { "property": "AutoStartStream", "group": "settings", "label": "Automatically Control on Startup", "type": "boolean", "default": true },
        { "property": "discoveryIntervalSeconds", "group": "discovery", "label": "Discovery Broadcast Interval (seconds)", "type": "number", "min": 10, "max": 300, "step": 5, "default": DEFAULT_DISCOVERY_INTERVAL_S },
        { "property": "livenessCheckSeconds", "group": "discovery", "label": "Device Liveness Check Interval (seconds)", "type": "number", "min": 5, "max": 120, "step": 5, "default": DEFAULT_LIVENESS_CHECK_S },
        { "property": "forceColor", "group": "settings", "label": "Force Color (Overrides SignalRGB)", "type": "boolean", "default": false },
        { "property": "forcedColor", "group": "lighting", "label": "Forced Color", "type": "color", "default": "#009bde" },
        { "property": "minBrightness", "group": "lighting", "label": "Minimum Brightness (%)", "min": "10", "max": "100", "type": "number", "default": "10" },
        { "property": "dimmColor", "group": "lighting", "label": "Color When SignalRGB is Black/Dim", "type": "color", "default": "#101010" },
        { "property": "targetTemperature", "group": "lighting", "label": "Target White Temperature (K)", "type": "number", "min": MIN_WiZ_TEMPERATURE, "max": MAX_WiZ_TEMPERATURE, "step": 50, "default": DEFAULT_WiZ_TEMPERATURE },
    ];
}

let wizProtocol = null;
let isInitialized = false;

export function Initialize() {
    device.log(`Initializing WiZ Device: ${controller.id} (${controller.modelName || 'Unknown Model'}) at IP: ${controller.ip}`);
    device.addFeature("udp");
    let deviceName = `WiZ ${controller.modelName ? controller.modelName : 'Device'}`;
    if (controller.roomId) {
        deviceName += ` (Room: ${controller.roomId})`;
    }
    deviceName += ` (${controller.id.substring(controller.id.length - 4)})`;
    device.setName(deviceName);
    if (controller.wizType && controller.wizType.imageUrl) {
        device.setIconUrl(controller.wizType.imageUrl);
    } else {
         device.setIconUrl(ImageUrl());
    }
    device.setControllableLeds(["LED 1"], [[0, 0]]);
    device.setSize([1, 1]);
    if (controller.isTW && !controller.isRGB) {
        device.removeProperty("forcedColor");
        device.removeProperty("forceColor");
        device.removeProperty("dimmColor");
        device.log("Device is Tunable White only. RGB-specific properties removed.");
    } else {
        device.removeProperty("targetTemperature");
    }
    try {
        wizProtocol = new WizProtocol(controller.ip, controller.port);
    } catch (e) {
        device.log(`Error creating WizProtocol: ${e}`);
        return;
    }
    isInitialized = true;
    device.log(`Initialization complete for ${deviceName}. AutoStart: ${AutoStartStream}`);
    if (AutoStartStream) {
        device.log("AutoStartStream enabled. Sending initial state.");
        Render();
    } else {
        device.log("AutoStartStream disabled. Device will wait for SignalRGB data or manual interaction.");
    }
}

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
    let wizBrightness = Math.max(MIN_WiZ_BRIGHTNESS, minBrightness, Math.round(brightnessPercent
    wizBrightness = Math.min(MAX_WiZ_BRIGHTNESS, wizBrightness);
    const isSignalDark = r < 5 && g < 5 && b < 5;
    if (isSignalDark && controller.isRGB && !forceColor) {
        [r, g, b] = device.hexToRgb(dimmColor);
        wizBrightness = Math.max(MIN_WiZ_BRIGHTNESS, minBrightness);
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    } else if (controller.isTW && !controller.isRGB) {
        const temp = Math.max(MIN_WiZ_TEMPERATURE, Math.min(MAX_WiZ_TEMPERATURE, targetTemperature));
        wizProtocol.setPilotTw(temp, wizBrightness);
    } else if (controller.isRGB) {
        wizProtocol.setPilotRgb(r, g, b, wizBrightness);
    } else {
         device.log(`Setting Dimmable-only device: Brightness=${wizBrightness}`);
         wizProtocol.setPilotStateAndBrightness(true, wizBrightness);
    }
}

export function Shutdown(suspend) {
    device.log(`Shutdown called (suspend: ${suspend}) for ${controller.id}`);
    if (wizProtocol) {
        if (TurnOffOnShutdown && !suspend && AutoStartStream) {
            device.log("Turning off device due to TurnOffOnShutdown setting enabled and not suspending.");
            wizProtocol.setPilotState(false);
        } else {
            device.log(`Leaving device in current state (TurnOffOnShutdown: ${TurnOffOnShutdown}, Suspending: ${suspend}, AutoStart: ${AutoStartStream})`);
        }
    }
    wizProtocol = null;
    isInitialized = false;
    device.log(`Shutdown complete for ${controller.id}`);
}

const WiZDeviceLibrary = {
    "ESP01_SHDW_01":    { productName: "WiZ Smart Plug", imageUrl: "https://images.wizconnected.com/pri/h01/h1a/9222662414366.png?build=16", supportRGB: false, supportDimming: false, supportWhiteColor: false, ledCount: 0 },
    "ESP03_SHRGB3_01":  { productName: "WiZ Color LED Strip", imageUrl: "https://images.wizconnected.com/pri/h6b/h90/9223585972254.png?build=16", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP06_SHRGB_01":   { productName: "WiZ Color A60 E27", imageUrl: "https://images.wizconnected.com/pri/h7c/h2a/9222660972574.png?build=16", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP15_SHTW_01I":   { productName: "WiZ Tunable White A60 E27", imageUrl: "https://images.wizconnected.com/pri/hfb/hf8/9222661849118.png?build=16", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP20_SHRGBW_01B": { productName: "WiZ Squire Table Lamp", imageUrl: "https://images.wizconnected.com/pri/h94/h8b/9222663299102.png?build=16", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP17_SHTW1C_01":  { productName: "WiZ Tunable White Filament E27", imageUrl: "https://images.wizconnected.com/pri/h53/h14/9222662832158.png?build=16", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP22_SHRGBW_01":  { productName: "WiZ Portable Hero Lamp", imageUrl: "https://images.wizconnected.com/pri/hf6/h51/9222663364638.png?build=16", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP25_SHRGBW_01":  { productName: "WiZ Color GU10 Spot", imageUrl: "https://images.wizconnected.com/pri/h78/h31/9222660907038.png?build=16", supportRGB: true, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "ESP26_SHTW_01":    { productName: "WiZ Tunable White GU10 Spot", imageUrl: "https://images.wizconnected.com/pri/h5e/h70/9222661554100.png?build=16", supportRGB: false, supportDimming: true, supportWhiteColor: true, ledCount: 1 },
    "default":          { productName: "Unknown WiZ Device", imageUrl: ImageUrl(), supportRGB: false, supportDimming: true, supportWhiteColor: false, ledCount: 1 }
};

export function DiscoveryService() {
    this.running = false;
    this.discoveryTimer = null;
    this.livenessTimer = null;
    this.controllers = {};
    this.discoveryIntervalMs = DEFAULT_DISCOVERY_INTERVAL_S * 1000;
    this.livenessIntervalMs = DEFAULT_LIVENESS_CHECK_S * 1000;
    this.deviceTimeoutMs = DEFAULT_LIVENESS_CHECK_S * 1000 * 7;
    this.Initialize = function () {
        service.log("WiZ Discovery Service Initializing...");
        this.discoveryIntervalMs = (discoveryIntervalSeconds || DEFAULT_DISCOVERY_INTERVAL_S) * 1000;
        this.livenessIntervalMs = (livenessCheckSeconds || DEFAULT_LIVENESS_CHECK_S) * 1000;
        this.deviceTimeoutMs = this.livenessIntervalMs * 7;
        service.log(`Discovery Interval: ${this.discoveryIntervalMs
        this.running = true;
        this.controllers = {};
        this.broadcastDiscovery();
        this.discoveryTimer = service.setInterval(() => {
            if (this.running) {
                this.broadcastDiscovery();
            }
        }, this.discoveryIntervalMs);
        this.livenessTimer = service.setInterval(() => {
            if (this.running) {
                this.checkDeviceLiveness();
            }
        }, this.livenessIntervalMs);
        service.log("WiZ Discovery Service Started.");
    };
    this.broadcastDiscovery = function() {
        const discoveryPacket = JSON.stringify({
            "method": "registration",
            "id": 1,
            "params": {
                "phoneMac": "AAAAAAAAAAAA",
                "register": false,        
                "phoneIp": "1.2.3.4"        
            }
        });
        service.broadcast(discoveryPacket, 38899);
    };
    this.requestSystemConfig = function(ip) {
         service.log(`Requesting System Config from ${ip}`);
         const configPacket = JSON.stringify({ "method": "getSystemConfig", "id": 2 });
         service.send(ip, 38899, configPacket);
    };
    this.requestPilot = function(ip) {
        const pilotPacket = JSON.stringify({ "method": "getPilot", "id": 3 });
        service.send(ip, 38899, pilotPacket);
    };
    this.checkDeviceLiveness = function() {
        const now = Date.now();
        let controllersToRemove = [];
        for (const id in this.controllers) {
            const controller = this.controllers[id];
            if (!controller) continue;
            if (now - controller.lastSeen > this.deviceTimeoutMs) {
                service.log(`Device ${id} (${controller.ip}) timed out. Last seen ${Math.round((now - controller.lastSeen)/1000)}s ago. Removing.`);
                controllersToRemove.push(id);
            } else {
                 this.requestPilot(controller.ip);
            }
        }
        controllersToRemove.forEach(id => {
            service.removeControllerById(id);
            delete this.controllers[id];      
        });
         service.controllers.forEach(c => {
             if (!c || !c.obj || !c.obj.id) return;
             const ctrl = c.obj;
            if (this.controllers[ctrl.id] && !ctrl.deviceInfoLoaded && ctrl.initialized) {
                service.log(`Controller ${ctrl.id} (${ctrl.ip}) found but missing device info. Requesting SysConfig.`);
                this.requestSystemConfig(ctrl.ip);
            }
         });
    };
    this.Shutdown = function () {
        service.log("WiZ Discovery Service Shutting Down...");
        this.running = false;
        if (this.discoveryTimer) {
            service.stopTimer(this.discoveryTimer);
            this.discoveryTimer = null;
        }
        if (this.livenessTimer) {
            service.stopTimer(this.livenessTimer);
            this.livenessTimer = null;
        }
        this.controllers = {};
        service.log("WiZ Discovery Service Stopped.");
    };
    this.Discovered = function (value) {
        let packet;
        try {
            packet = JSON.parse(value.response);
        } catch (e) {
            service.log(`Error parsing JSON response from ${value.ip}: ${e}. Raw: ${value.response}`);
            return;
        }
        const potentialMac = packet.result?.mac || packet.params?.mac;
        const method = packet.method;
        if (!potentialMac && method !== 'syncPilot' && method !== 'firstBeat') {
             if ((method === 'syncPilot' || method === 'firstBeat') && !Object.values(this.controllers).some(c => c.ip === value.ip)) {
                 service.log(`Received ${method} from unknown IP ${value.ip}. Requesting System Config.`);
                 this.requestSystemConfig(value.ip);
             }
             return;
        }
        let macId = potentialMac ? potentialMac.toUpperCase() : null;
        let controller = macId ? this.controllers[macId] : Object.values(this.controllers).find(c => c.ip === value.ip);
        if (controller) {
            controller.lastSeen = Date.now();
            if (value.ip && controller.ip !== value.ip) {
                service.log(`IP changed for ${controller.id}: ${controller.ip} -> ${value.ip}`);
                controller.ip = value.ip;
                 const deviceInstance = service.getController(controller.id);
                 if(deviceInstance && deviceInstance.obj.isInitialized && deviceInstance.obj.wizProtocol) {
                    deviceInstance.obj.wizProtocol.updateIpPort(value.ip, value.port || 38899);
                 }
                 service.updateController(controller);
            }
            if (value.port && controller.port !== value.port) {
                service.log(`Port changed for ${controller.id}: ${controller.port} -> ${value.port}`);
                controller.port = value.port;
                 const deviceInstance = service.getController(controller.id);
                 if(deviceInstance && deviceInstance.obj.isInitialized && deviceInstance.obj.wizProtocol) {
                    deviceInstance.obj.wizProtocol.updateIpPort(controller.ip, value.port);
                 }
                service.updateController(controller);
            }
        } else if (macId) {
        } else if (!macId && (method === 'syncPilot' || method === 'firstBeat')) {
             return;
        }
        switch (method) {
            case `registration`:
                if (packet.result?.success && packet.result.mac) {
                    macId = packet.result.mac.toUpperCase();
                    service.log(`Successful registration response from MAC: ${macId} at IP: ${value.ip}`);
                    this.CreateOrUpdateController(macId, value.ip, value.port);
                    this.requestSystemConfig(value.ip);
                } else if (!packet.result?.success) {
                    service.log(`Registration failed response from ${value.ip}. Error: ${packet.error?.message || 'Unknown'}`);
                }
                break;
            case `getSystemConfig`:
                if (packet.result && packet.result.mac) {
                    macId = packet.result.mac.toUpperCase();
                    controller = this.controllers[macId];
                    if (controller) {
                        service.log(`Received System Config for ${macId} (${controller.ip}): Model=${packet.result.moduleName}`);
                        const wasAnnounced = controller.announced;
                        controller.setDeviceInfo(packet.result);
                        if (!wasAnnounced && controller.deviceInfoLoaded) {
                            service.announceController(controller);
                            controller.announced = true;
                            service.log(`Controller ${macId} announced.`);
                        } else if (wasAnnounced) {
                            service.updateController(controller);
                            service.log(`Controller ${macId} info updated.`);
                        }
                    } else {
                        service.log(`Received SysConfig for unknown MAC ${macId} at ${value.ip}. Creating and announcing.`);
                        controller = this.CreateOrUpdateController(macId, value.ip, value.port);
                        if (controller) {
                             controller.setDeviceInfo(packet.result);
                             if (!controller.announced && controller.deviceInfoLoaded){
                                 service.announceController(controller);
                                 controller.announced = true;
                                 service.log(`Controller ${macId} (added from SysConfig) announced.`);
                             }
                        }
                    }
                } else {
                     service.log(`getSystemConfig error response from ${value.ip}: ${packet.error?.message || 'No result or MAC in response'}`);
                }
                break;
            case `getPilot`:
                if (controller && !controller.deviceInfoLoaded) {
                     service.log(`Got pilot from ${macId || controller.ip} but missing SysConfig. Requesting again.`);
                    this.requestSystemConfig(controller.ip);
                }
                 if(controller && !controller.announced && controller.deviceInfoLoaded){
                     service.log(`Got pilot from ${macId}, info loaded but wasn't announced. Announcing now.`);
                     service.announceController(controller);
                     controller.announced = true;
                 }
                break;
            case `syncPilot`:
            case `firstBeat`:
                if (!controller) {
                } else {
                    if (!controller.deviceInfoLoaded) {
                        this.requestSystemConfig(controller.ip);
                    }
                    if (!controller.announced && controller.deviceInfoLoaded) {
                        service.announceController(controller);
                        controller.announced = true;
                    }
                }
                break;
            default:
                break;
        }
    };
    this.CreateOrUpdateController = function(macId, ip, port) {
        if (!macId) {
            service.log("Error: CreateOrUpdateController called without macId.");
            return null;
        }
        macId = macId.toUpperCase();
        if (!this.controllers[macId]) {
            service.log(`Creating new WiZ controller entry for ${macId} at ${ip}:${port}`);
            try {
                const newController = new WiZDevice(macId, ip, port || 38899);
                this.controllers[macId] = newController;
                return newController;
            } catch (e) {
                 service.log(`Error creating WiZDevice object for ${macId}: ${e}`);
                 return null;
            }
        } else {
            this.controllers[macId].lastSeen = Date.now();
            return this.controllers[macId];
        }
    };
    this.IconUrl = ImageUrl();
    this.UdpBroadcastPort = 38899;
    this.UdpBroadcastAddress = "255.255.255.255";
    this.UdpListenPort = 38900;
}

class WiZDevice {
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
        this.modelName = "WiZ Device";
        this.isRGB = false;
        this.isTW = false;
        this.wizType = null;
        service.log(`WiZDevice object created for ${this.id} at ${this.ip}:${this.port}`);
    }
    setDeviceInfo(data) {
        if (!data) {
            service.log(`Error: setDeviceInfo called with null data for ${this.id}`);
            return;
        }
        service.log(`Setting device info for ${this.id} from data: Model=${data.moduleName}, FW=${data.fwVersion}`);
        this.homeId = data.homeId;
        this.fwVersion = data.fwVersion || "N/A";
        this.roomId = data.roomId;
        this.groupId = data.groupId;
        this.moduleName = data.moduleName || "Unknown";
        this.isRGB = this.moduleName.includes("RGB");
        this.isTW = this.moduleName.includes("TW") || this.moduleName.includes("DW");
        if (this.isRGB) {
            this.isTW = true;
        }
        this.wizType = WiZDeviceLibrary[this.moduleName] || WiZDeviceLibrary["default"];
        this.modelName = this.wizType.productName;
        if (this.wizType && this.wizType !== WiZDeviceLibrary["default"]) {
            this.isRGB = this.wizType.supportRGB ?? this.isRGB;
            this.isTW = this.wizType.supportWhiteColor ?? this.isTW;
            if (this.isRGB || this.isTW) {
                this.wizType.supportDimming = true;
            }
        } else {
            if (!this.isRGB && !this.isTW && this.moduleName !== "Unknown" && !this.moduleName.includes("SHDW")) {
                this.isTW = true;
                 this.wizType = WiZDeviceLibrary["default"];
                 this.wizType.supportDimming = true;
                 this.wizType.supportWhiteColor = true;
                service.log(`Module name '${this.moduleName}' not in library, assuming basic Tunable White/Dimmable.`);
            }
        }
        this.deviceInfoLoaded = true;
        this.lastSeen = Date.now();  
        service.log(`Device info processed for ${this.id}: Name=${this.modelName}, RGB=${this.isRGB}, TW=${this.isTW}, Room=${this.roomId}`);
    }
}

class WizProtocol {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port || 38899;
        this.lastSentState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: null };
        this.lastSendTime = 0;
        this.minSendInterval = 50;
    }
    updateIpPort(newIp, newPort) {
        device.log(`Updating WizProtocol target for device ${this.lastSentState.macId || '(unknown ID)'} to ${newIp}:${newPort}`);
        this.ip = newIp;
        this.port = newPort || 38899;
        this.lastSentState = { r: -1, g: -1, b: -1, temp: -1, brightness: -1, power: this.lastSentState.power };
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
        if (!this.ip) {
             device.log("Error: Cannot send WiZ command, IP address is not set.");
             return;
        }
        if (!this._canSend()) {
            return;
        }
        const command = { "method": "setPilot", "id": 4, "params": params };
        try {
            udp.send(this.ip, this.port, command);
        } catch (e) {
            device.log(`Error sending UDP packet to ${this.ip}:${this.port}: ${e}`);
        }
    }
    setPilotRgb(r, g, b, brightness) {
        brightness = Math.max(MIN_WiZ_BRIGHTNESS, Math.min(MAX_WiZ_BRIGHTNESS, Math.round(brightness)));
        if (this.lastSentState.r !== r || this.lastSentState.g !== g || this.lastSentState.b !== b || this.lastSentState.brightness !== brightness || this.lastSentState.power !== true) {
            this._sendPilot({ "state": true, "r": r, "g": g, "b": b, "dimming": brightness });
            this.lastSentState = { r, g, b, brightness, power: true, temp: -1 };
        }
    }
    setPilotTw(temperature, brightness) {
        brightness = Math.max(MIN_WiZ_BRIGHTNESS, Math.min(MAX_WiZ_BRIGHTNESS, Math.round(brightness)));
        temperature = Math.max(MIN_WiZ_TEMPERATURE, Math.min(MAX_WiZ_TEMPERATURE, Math.round(temperature)));
        if (this.lastSentState.temp !== temperature || this.lastSentState.brightness !== brightness || this.lastSentState.power !== true) {
            this._sendPilot({ "state": true, "temp": temperature, "dimming": brightness });
            this.lastSentState = { r: -1, g: -1, b: -1, temp: temperature, brightness, power: true };
        }
    }
    setPilotState(isOn) {
        if (this.lastSentState.power !== isOn) {
            this._sendPilot({ "state": isOn });
            this.lastSentState.power = isOn;
        }
    }
     setPilotStateAndBrightness(isOn, brightness) {
        brightness = Math.max(MIN_WiZ_BRIGHTNESS, Math.min(MAX_WiZ_BRIGHTNESS, Math.round(brightness)));
         if (this.lastSentState.power !== isOn || (isOn && this.lastSentState.brightness !== brightness)) {
             this._sendPilot({ "state": isOn, "dimming": brightness });
             this.lastSentState.power = isOn;
             if (isOn) {
                 this.lastSentState.brightness = brightness;
                 this.lastSentState.r = -1;
                 this.lastSentState.g = -1;
                 this.lastSentState.b = -1;
                 this.lastSentState.temp = -1;
             }
         }
     }
}

export function ImageUrl() {
    return "https://play-lh.googleusercontent.com/jhmzIodqBLQQUD2sJF_O6oawa04ocDFfQIgoH0rPOXQY3V1uVz0-FJvEieFjVO-kcJ8=w200-h200-rw";
}