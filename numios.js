var numIOs = function(modbusClient, params){
    this._modbusClient      = modbusClient;    
    this._noChannels        = undefined;
    this._startAddress      = params.registers.startAddress;
    this._noRegisters       = params.registers.noRegisters;
    this._ioBitCount        = params.ioBitCount;
    this._ioTypeStr         = params.name;
}

numIOs.prototype.fetch = async function() { 
    try {
        registerResult = await this._modbusClient.readInputRegisters(this._startAddress, this._noRegisters);
        this._noChannels = registerResult.data / this._ioBitCount;
        console.log(`Found ${this._noChannels} ${this._ioTypeStr}.`);
    } catch (error) {
        console.error('Caught', error.message);
    }
};

numIOs.prototype.get = async function() {
    await this.fetch();
    return this._noChannels;
};

module.exports = numIOs;