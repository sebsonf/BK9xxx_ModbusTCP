var ModbusRTU = require("modbus-serial");
var watchdog = require("./watchdog.js");
var processImage = require("./processimage.js");
var bk9xxxConfig = require('./bk9xxx.json');

var BK9xxx = async function (ip) {
    this._ip = ip;
    this._port = 502;
    this.client = new ModbusRTU();
    
    // initialization routine
    this.init = async function () {
        try {
            // deactivate watchdog timer (set timeout to 0 ms)
            //await this.watchdog.fetch();
            await this.watchdog.currentTime.fetch();
            await this.watchdog.deactivate();
            // get bus coupler ID
            //await this.getBusCouplerID();
            await this.processImage.init();
        }
        catch (error) {
            // Prints "Caught Woops!"
            console.error('Caught', error.message);
        }
    };

    // open connection using device IP and default Modbus TCP port 502
    // on success invoke initialization routine
    console.log(`Establishing connection using TCP socket ${this._ip}:502.`);
    this.client.connectTCP(this._ip, this.init);
    //---------------------------------------------------------------------------#
    // WATCHDOG
    //---------------------------------------------------------------------------#
    this.watchdog = new watchdog(this.client, bk9xxxConfig);
    //---------------------------------------------------------------------------#
    // PROCESS IMAGE
    //---------------------------------------------------------------------------#
    this.processImage = new processImage(this.client, bk9xxxConfig);

    this.getBusCouplerID = async function () {
        registerResult = await this.client.readHoldingRegisters(bk9xxxConfig.identifier.registers.startAddress, 
                                                                bk9xxxConfig.identifier.registers.noRegisters);
        bk9xxxConfig.identifier.value = registerResult.buffer.toString('hex').toUpperCase();
        console.log(`Bus coupler ID: ${bk9xxxConfig.identifier.value}`);
    };
};

module.exports = BK9xxx;