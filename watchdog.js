//---------------------------------------------------------------------------#
// WATCHDOG WRAPPER
//---------------------------------------------------------------------------#
var watchdog = function(modbusClient, bk9xxxConfig){
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
};

// deactivate watchdog timer by setting timeout to 0 [ms]
watchdog.prototype.deactivate = async function() {
    await this._timeout.set(0);
    console.log("Watchdog: timer is now deactivated.");
}

// reset is necessary if timer is expired
watchdog.prototype.reset = async function() {
    // timer is reset using two step sequence
    await this._modbusClient.writeRegister(this._resetParams.registers.startAddress, 
                                           this._resetParams.Sequence1);
    await this._modbusClient.writeRegister(this._resetParams.registers.startAddress, 
                                           this._resetParams.Sequence2);
    console.log("Watchdog: timer is now reset.");
}

// set watchdog to trigger on receiving telegrams (default)
watchdog.prototype.triggerOnReceive = async function() {
    await this._modbusClient.writeRegister(this._typeParams.registers.startAddress, 
                                           this._typeParams.triggerOnReceive);
    console.log("Watchdog: timer is now set to trigger on receiving telegrams.");
}

// set watchdog to trigger on write telegrams
watchdog.prototype.triggerOnWrite = async function() {
    await this._modbusClient.writeRegister(this._typeParams.registers.startAddress, 
                                           this._typeParams.triggerOnWrite);
    console.log("Watchdog: timer is now set to trigger on write telegrams.");
}

//---------------------------------------------------------------------------#
// WATCHDOG CURRENT TIMER VALUE
//---------------------------------------------------------------------------#
var currentTime = function(modbusClient, currentTimeParams) {
    this._modbusClient          = modbusClient;
    this._currentTimeParams     = currentTimeParams;
    this._value                 = undefined;
};

// fetch current timer value [ms]
currentTime.prototype.fetch = async function() {
    registerResult = 
        await this._modbusClient.readHoldingRegisters(this._currentTimeParams.registers.startAddress, 
                                                      this._currentTimeParams.registers.noRegisters);
    this._value = registerResult.data;
    console.log(`Watchdog: current timer value is ${this._value} ms.`);
};

// fetch and return current timer value [ms]
currentTime.prototype.get = async function() {
    await this.fetch();
    return _value;
}

//---------------------------------------------------------------------------#
// WATCHDOG TIMEOUT
//---------------------------------------------------------------------------#
var timeout = function(modbusClient, timeoutParams) {
    this._modbusClient      = modbusClient;
    this._timeoutParams     = timeoutParams;
    this._value             = undefined;
};

// fetch timeout value [ms]
timeout.prototype.fetch = async function() {
    registerResult = 
        await this._modbusClient.readHoldingRegisters(this._timeoutParams.registers.startAddress, 
                                                      this._timeoutParams.registers.noRegisters);
    this._value = registerResult.data;
    console.log(`Watchdog: timeout is ${this._value} ms.`);
};

// set watchdog timeout [ms]
timeout.prototype.set = async function(timeout) {
    this._value = timeout;
    await this._modbusClient.writeRegister(this._timeoutParams.registers.startAddress, this._value);
    console.log(`Watchdog: timer is set to ${this._value} ms.`);
};

// fetch and return timeout value [ms]
timeout.prototype.get = async function() {
    await this.fetch();
    return this._value;
};

module.exports = watchdog;