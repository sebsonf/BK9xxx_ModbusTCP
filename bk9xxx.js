var ModbusRTU = require("modbus-serial");
var watchdog = require("./watchdog.js");
var processImage = require("./processimage.js");
var bk9xxxConfig = require('./bk9xxx.json');

// Bus coupler status error flags
const ERR_WATCHDOG_EXPIRED      = 0x8000;
const ERR_BUS_COUPLER_CONFIG    = 0x0002;
const ERR_BUS_TERMINAL          = 0x0001;

var BK9xxx = async function (ip) {
    this._ip = ip;
    this._port = 502;
    this.client = new ModbusRTU();
    this._ID = undefined;
    
    // initialization routine
    this.init = async function () {
        try {
            // get bus coupler ID
            await this.fetchBusCouplerID();

            // get bus coupler status
            await this.fetchBusCouplerStatus();

            // deactivate watchdog timer (set timeout to 0 ms)
            await this.watchdog.deactivate();

            // initialize process image
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
    this.client.connectTCP( this._ip, this.init );

    //---------------------------------------------------------------------------#
    // WATCHDOG
    //---------------------------------------------------------------------------#
    this.watchdog = new watchdog( this.client, bk9xxxConfig );

    //---------------------------------------------------------------------------#
    // PROCESS IMAGE
    //---------------------------------------------------------------------------#
    this.processImage = new processImage( this.client, bk9xxxConfig );

    this.fetchBusCouplerID = async function () {
        let id = await this.client.readHoldingRegisters( bk9xxxConfig.identifier.registers.startAddress, 
                                                         bk9xxxConfig.identifier.registers.noRegisters );
        this._ID = id.buffer.toString('hex').toUpperCase();
        console.log(`Device bus coupler ID: ${this._ID}`);
    };

    this.fetchBusCouplerStatus = async function () {
        let status = 
            await this.client.readHoldingRegisters( bk9xxxConfig.BusCouplerStatus.registers.startAddress, 
                                                    bk9xxxConfig.BusCouplerStatus.registers.noRegisters );
        if( status.data[0] === 0){
            console.log("Bus coupler status: no errors.");
        } else {
            if( status.data[0] & ERR_WATCHDOG_EXPIRED ){
                console.error("Bus coupler status: Watchdog timer expired.");
            }
            if( status.data[0] & ERR_BUS_COUPLER_CONFIG ){
                console.error("Bus coupler status: Configuration error.");
            }
            if( status.data[0] & ERR_BUS_TERMINAL ){
                console.error("Bus coupler status: Bus terminal error.");
            }
        }
    };
};

module.exports = BK9xxx;