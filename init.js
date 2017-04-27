var BK9xxx = require("./bk9xxx.js");
var arpscanner = require('arpscan/promise');

var arpOptions = {
    command: 'arp-scan',
    args: ['-l'],
    interface: 'eth0'
};

// parse ARP table and start ModbusTCP instances
arpscanner(arpOptions)
    .then( deviceList => {
        // Filter ARP table
        // Accept only devices that fit Beckhoff vendor MAC address form 00:01:05:xx:xx:xx
        const validDevices = deviceList.filter(device => device.mac.substr(0, 8) === '00:01:05');
        // if no valid devices were found
        if (validDevices.length === 0) {
            console.error('No Beckhoff Automation devices were found. Please verify that the device is connected. Exiting now.');
            process.exit(1); // exit with failure
        }

        var ModbusDevices = [];
        // create instances of ModbusTCP devices
        validDevices.forEach( device => {
            console.log(`Found Beckhoff Automation device with IP address ${device.ip} and MAC address ${device.mac}.`);
            ModbusDevices.push( BK9xxx(device.ip) );
        }) 
    })
    .catch( err => {
        console.error(err);
        process.exit(1); // exit with failure
    })

var definitions = {
    "ADR_BUS_TERMINAL_DIAG_R": 0x100B,
    "ADR_BUS_COUPLER_STATUS_R": 0x100C,
    "ADR_BUS_TERMINAL_DIAG_RW": 0x110B,
    "BUS_TERMINAL_ERR": 0x0001,
    "BUS_COUPLER_CONFIG_ERR": 0x0002,
    "WATCHDOG_EXPIRED_ERR": 0x8000
};

/*class measurementEntity{
    constructor(name, unit, measurementFunction, conversionFunction){
        this._name = name;
        this._unit = unit;

        this.timestamp =
        this._rawValue
        this.physValue
        
        
    }


    get name() { return this._name; }
    get unit() { return this._unit; }

    measure(){
        // set timestamp of measurement

        // get raw measurement value
        this._rawValue = measurementFunction();

        // calculate physical value using conversion function
        this.physValue = conversion(this._rawValue);
    };
}*/


/*class KL3208Channel {
    constructor() {
    }
}*/