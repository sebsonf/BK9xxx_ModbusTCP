var numIOs = require('./numios.js');
var registercom = require('./utils/registercom.js');
var kl3208Channel = require('./kl3208.js');
var kl3208Config = require('./ressources/kl3208.json');

module.exports = class processImage {
    constructor(client, config) {
        this._client = client;
        this._config = config;

        this.analogInputs   = new analogInputs(   this._client, this._config.numAnalogInputs );
        this.analogOutputs  = new analogOutputs(  this._client, this._config.numAnalogOutputs );
        this.digitalInputs  = new digitalInputs(  this._client, this._config.numDigitalInputs );
        this.digitalOutputs = new digitalOutputs( this._client, this._config.numDigitalOutputs );
    }

    async init() {
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
}; 

class analogInputs {
    constructor(client, config){
        this._client = client;
        this._count = new numIOs(client, config);
        this.numChannels = undefined;
        this.channels = [];

        Object.defineProperty(this, 'count', {
            get: async function() { return await this._count.get(); }
        });
    }

    async getBusTerminalType(inputNum){
        let resp = await registercom.readTerminalRegister( this._client, inputNum, 
                                                    kl3208Config.busTerminalType.registers.startAddress );
        let resp_ext = await registercom.readTerminalRegister( this._client, inputNum, 
                                                    kl3208Config.busTerminalTypeExtension.registers.startAddress );
        await registercom.writeControlRegister( this._client, inputNum, 0 );
        return [resp.data[0], resp_ext.data[0]];

    };

    async loop(){
        let ADvalues = [];

        for (let channel in this.channels) {
            ADvalues.push( await this.channels[channel].ADRawValue.value );
        }

        console.log(ADvalues);
    };

    async init(){
        this.numChannels = await this.count;

        for(let i=1; i<=this.numChannels; i++){
            let busTerminalType = await this.getBusTerminalType(i);
            if( busTerminalType[0] === 3208 ){
                console.log(`Analog input ${i}: Found input channel of bus terminal KL${busTerminalType[0]}-${busTerminalType[1]}.`);
                this.channels.push( new kl3208Channel( this._client, i ) );
                await this.channels[i-1].init();
            }
        }

        setInterval( (async function(){
            await this.loop();
        }).bind(this), 1000);
    };
};

class analogOutputs {
    constructor(client, config){
        this._count = new numIOs(client, config);

        Object.defineProperty(this, 'count', {
            get: async function() { return await this._count.get(); }
        });
    }
};

class digitalInputs {
    constructor(client, config){
        this._count = new numIOs(client, config);

        Object.defineProperty(this, 'count', {
            get: async function() { return await this._count.get(); }
        });
    }
}; 

class digitalOutputs {
    constructor(client, config){
        this._count = new numIOs(client, config);

        Object.defineProperty(this, 'count', {
            get: async function() { return await this._count.get(); }
        });
    }
}; 