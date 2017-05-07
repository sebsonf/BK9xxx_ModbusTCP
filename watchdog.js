//---------------------------------------------------------------------------#
// WATCHDOG WRAPPER
//---------------------------------------------------------------------------#
module.exports = class watchdog{
    constructor( modbusClient, bk9xxxConfig ) {
        this._modbusClient  = modbusClient;
        this._resetParams   = bk9xxxConfig.watchdogReset;
        this._typeParams    = bk9xxxConfig.watchdogType;
        this._timeout       = new timeout    (modbusClient, bk9xxxConfig.watchdogTimeout);
        this._currentTime   = new currentTime(modbusClient, bk9xxxConfig.watchdogCurrentTime);

        Object.defineProperty(this, 'currentTime', {
            get: function(){ return this._currentTime; }
        });

        Object.defineProperty(this, 'timeout', {
            get: function(){ return this._timeout; }
        });
    }

    // deactivate watchdog timer by setting timeout to 0 [ms]
    async deactivate() {
        await this._timeout.set(0);
        console.log("Watchdog: timer is now deactivated.");
    }

    // reset is necessary if timer is expired
    async reset() {
        // timer is reset using two step sequence
        await this._modbusClient.writeRegister(this._resetParams.registers.startAddress, 
                                               this._resetParams.Sequence1);
        await this._modbusClient.writeRegister(this._resetParams.registers.startAddress, 
                                               this._resetParams.Sequence2);
        console.log("Watchdog: timer is now reset.");
    }

    // set watchdog trigger on receiving telegrams (default)
    async triggerOnReceive() {
        await this._modbusClient.writeRegister(this._typeParams.registers.startAddress, 
                                               this._typeParams.triggerOnReceive);
        console.log("Watchdog: timer is now set to trigger on receiving telegrams.");
    }

    // set watchdog trigger on write telegrams
    async triggerOnWrite() {
        await this._modbusClient.writeRegister(this._typeParams.registers.startAddress, 
                                               this._typeParams.triggerOnWrite);
        console.log("Watchdog: timer is now set to trigger on write telegrams.");
    }
};


//---------------------------------------------------------------------------#
// WATCHDOG CURRENT TIMER VALUE
//---------------------------------------------------------------------------#
class currentTime {
    constructor( modbusClient, currentTimeParams ) {
        this._modbusClient          = modbusClient;
        this._currentTimeParams     = currentTimeParams;
        this._value                 = undefined;
    }

    // fetch current timer value [ms]
    async fetch() {
        registerResult = 
            await this._modbusClient.readHoldingRegisters(this._currentTimeParams.registers.startAddress, 
                                                          this._currentTimeParams.registers.noRegisters);
        this._value = registerResult.data;
        console.log(`Watchdog: current timer value is ${this._value} ms.`);
    };

    // fetch and return current timer value [ms]
    async get() {
        await this.fetch();
        return _value;
    }
};

//---------------------------------------------------------------------------#
// WATCHDOG TIMEOUT
//---------------------------------------------------------------------------#
class timeout {
    constructor( modbusClient, timeoutParams ) {
        this._modbusClient      = modbusClient;
        this._timeoutParams     = timeoutParams;
        this._value             = undefined;
    }

    // fetch timeout value [ms]
    async fetch() {
        registerResult = 
            await this._modbusClient.readHoldingRegisters(this._timeoutParams.registers.startAddress, 
                                                          this._timeoutParams.registers.noRegisters);
        this._value = registerResult.data;
        console.log(`Watchdog: timeout is ${this._value} ms.`);
    };

    // set watchdog timeout [ms]
    async set(timeout) {
        this._value = timeout;
        await this._modbusClient.writeRegister(this._timeoutParams.registers.startAddress, this._value);
        console.log(`Watchdog: timer is set to ${this._value} ms.`);
    };

    // fetch and return timeout value [ms]
    async get() {
        await this.fetch();
        return this._value;
    };    
};