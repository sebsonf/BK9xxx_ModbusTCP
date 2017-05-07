var BK9xxx = require("./bk9xxx.js");
var arpscanner = require('arpscan/promise');

var arpOptions = {
    command: 'arp-scan',
    args: ['-l'],
    interface: 'eth0'
};

var ModbusDevices = [];

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

        // create ModbusTCP device instances
        for (let deviceIndex in validDevices) {
            console.log(`Found Beckhoff Automation device with IP address ${validDevices[deviceIndex].ip} and MAC address ${validDevices[deviceIndex].mac}.`);
            let ModbusDevice = new BK9xxx( validDevices[deviceIndex].ip );
            ModbusDevice.init().then(function() {
                ModbusDevices.push( ModbusDevice );
                console.log(Object.keys(ModbusDevice));
            });
        }        
    })
    .catch( err => {
        console.error(err);
        process.exit(1); // exit with failure
    })

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