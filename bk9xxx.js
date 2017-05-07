var ModbusRTU = require("modbus-serial");
var watchdog = require("./watchdog.js");
var processImage = require("./processimage.js");
var bk9xxxConfig = require('./ressources/bk9xxx.json');

// Bus coupler status error flags
const ERR_WATCHDOG_EXPIRED      = 0x8000;
const ERR_BUS_COUPLER_CONFIG    = 0x0002;
const ERR_BUS_TERMINAL          = 0x0001;

module.exports = class BK9xxx extends ModbusRTU {
    constructor( ip ){
        super();
        this._ip    = ip;
        this._port  = 502;
        this._id    = undefined;
    }
    
    // initialization routine
    async init () {
        // open connection using device IP and default Modbus TCP port 502
        // on success invoke initialization routine
        console.log(`Establishing connection using TCP socket ${this._ip}:502.`);
        await this.connectTCP(this._ip);

        //---------------------------------------------------------------------------#
        // WATCHDOG
        //---------------------------------------------------------------------------#
        this.watchdog = new watchdog( this, bk9xxxConfig );

        //---------------------------------------------------------------------------#
        // PROCESS IMAGE
        //---------------------------------------------------------------------------#
        this.processImage = new processImage( this, bk9xxxConfig );

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
            // print error
            console.error('Caught', error.message);
        }
    };

    async fetchBusCouplerID () {
        let id = await this.readHoldingRegisters( bk9xxxConfig.identifier.registers.startAddress, 
                                                  bk9xxxConfig.identifier.registers.noRegisters );
        this._id = id.buffer.toString('hex').toUpperCase();
        console.log(`Device bus coupler ID: ${this._id}`);
    };

    async fetchBusCouplerStatus () {
        let status = 
            await this.readHoldingRegisters( bk9xxxConfig.BusCouplerStatus.registers.startAddress, 
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