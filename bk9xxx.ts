// create an empty modbus client
var ioConfig = require("./ioconfig.js");
var watchdog = require("./watchdog.js");
var ModbusRTU = require("modbus-serial");
var arpscanner = require('arpscan/promise');
var bk9xxxConfig = require('./bk9xxx.json');

var options = {
    command: 'arp-scan',
    args:['-l'],
    interface: 'eth0'
};

arpscanner(options)
    .then(parseValidDevices)
    .catch(onError);

function parseValidDevices(deviceList) {
    // Filter ARP table
    // Accept only devices that fit Beckhoff vendor MAC address form 00:01:05:xx:xx:xx
    const validDevices = deviceList.filter( device => device.mac.substr(0,8) === '00:01:05' );

    // if no valid devices were found
    if(validDevices.length === 0)
    {
        console.log('No Beckhoff Automation devices were found. Please verify that the device is connected. Exiting now.');
        process.exit(1); // exit with failure
    }

    var ModbusDevices = [];

    validDevices.forEach(device => {
        console.log('Found Beckhoff Automation device with IP address ' + device.ip + ' and MAC address ' + device.mac + '.');

        ModbusDevices.push( BK9xxx(device.ip) );
    });
}

function onError(err) {
    throw err;
}

var definitions = {
    "ADR_BUS_TERMINAL_DIAG_R":       0x100B,
    "ADR_BUS_COUPLER_STATUS_R" :     0x100C,
    "ADR_BUS_TERMINAL_DIAG_RW" :     0x110B,
    "BUS_TERMINAL_ERR" :             0x0001,
    "BUS_COUPLER_CONFIG_ERR" :       0x0002,
    "WATCHDOG_EXPIRED_ERR" :         0x8000
}

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


class KL3208Channel{
    constructor(){
        
    }
}



var BK9xxx = async function(ip){
    this._ip = ip;
    this._port = 502;


    this.init = async function (){
        try {
        
            // deactivate watchdog timer (set timeout to 0 ms)
            //await this.watchdog.fetch();
            await this.watchdog.currentTime.fetch();
            await this.watchdog.deactivate();

            // get bus coupler ID
            //await this.getBusCouplerID();

            await this.processImage.init();          


        } catch (error) {
            // Prints "Caught Woops!"
            console.log('Caught', error.message);
        }
        
    };    

    this.client = new ModbusRTU();
    console.log('Establishing connection using TCP socket ' + this._ip + ':502.');
    // open connection using default Modbus TCP port 502
    this.client.connectTCP(this._ip, this.init);

    //---------------------------------------------------------------------------#
    // WATCHDOG
    //---------------------------------------------------------------------------#
    this.watchdog =  new watchdog(this.client, bk9xxxConfig);
 
    //---------------------------------------------------------------------------#
    // PROCESS IMAGE
    //---------------------------------------------------------------------------#
    this.processImage = {
        analogInputs: {
            config: new ioConfig(this.client, bk9xxxConfig.numAnalogInputs)
        },
        analogOutputs: {
            config: new ioConfig(this.client, bk9xxxConfig.numAnalogOutputs)    
        },  
        digitalInputs: {
            config: new ioConfig(this.client, bk9xxxConfig.numDigitalInputs)
        },
        digitalOutputs: {
            config: new ioConfig(this.client, bk9xxxConfig.numDigitalOutputs)
        },
        init:   async function (){
            console.log('Loading process image:');
            await this.analogInputs.config.fetch();
            await this.analogOutputs.config.fetch();
            await this.digitalInputs.config.fetch();
            await this.digitalOutputs.config.fetch();
        }
    };

    this.getBusCouplerID = async function (){
        registerResult = await this.client.readHoldingRegisters(bk9xxxConfig.identifier.registers.startAddress, 
                                                                bk9xxxConfig.identifier.registers.noRegisters);
        bk9xxxConfig.identifier.value = registerResult.buffer.toString('hex').toUpperCase(); 
        console.log("Bus coupler ID: " + bk9xxxConfig.identifier.value);

    }; 

}