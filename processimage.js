var numIOs = require('./numios.js');
var registercom = require('./registercom.js');
var kl3208Channel = require('./kl3208.js');
var kl3208Config = require('./kl3208.json');

var processImage = function(client, config) {
    this._client = client;
    this._config = config;

    this.analogInputs       = new analogInputs(     this._client, this._config.numAnalogInputs);
    this.analogOutputs      = new analogOutputs(    this._client, this._config.numAnalogOutputs);
    this.digitalInputs      = new digitalInputs(    this._client, this._config.numDigitalInputs);
    this.digitalOutputs     = new digitalOutputs(   this._client, this._config.numDigitalOutputs);
};

processImage.prototype.init = async function() {
    try {
        console.log("Initializing process image...");
        await this.analogInputs.init();
        await this.analogOutputs.count;
        await this.digitalInputs.count;
        await this.digitalOutputs.count;
    } catch(err) {
        console.error(err);
    }
};

var analogInputs = function(client, config){
    this._client = client;
    this._count = new numIOs(client, config);
    this.numChannels = undefined;

    this.channels = [];

    this.init = async function(){
        this.numChannels = await this.count;

        for(let i=1; i<=this.numChannels; i++){
            let busTerminalType = await this.getBusTerminalType(i);
            if( busTerminalType[0] === 3208 ){
                console.log(`Analog input ${i}: Found input channel of bus terminal KL${busTerminalType[0]}-${busTerminalType[1]}.`);
                this.channels.push( new kl3208Channel( this._client, i ) );
                await this.channels[i-1].init();
            }
        }
    };

    this.getBusTerminalType = async function(inputNum){
        let resp = await registercom.readTerminalRegister( this._client, inputNum, 
                                                    kl3208Config.busTerminalType.registers.startAddress );
        let resp_ext = await registercom.readTerminalRegister( this._client, inputNum, 
                                                    kl3208Config.busTerminalTypeExtension.registers.startAddress );
        await registercom.writeControlRegister( this._client, inputNum, 0 );
        return [resp.data[0], resp_ext.data[0]];

    };

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    });
};

var analogOutputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    });
};

var digitalInputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    });
};

var digitalOutputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    });
};

module.exports = processImage;