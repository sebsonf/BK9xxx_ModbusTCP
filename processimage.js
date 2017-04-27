var numIOs = require('./numios.js');

var processImage = function(client, config) {
    this._client = client;
    this._config = config;

    this.analogInputs       = new analogInputs(this._client, this._config.numAnalogInputs);
    this.analogOutputs      = new analogOutputs(this._client, this._config.numAnalogOutputs);
    this.digitalInputs      = new digitalInputs(this._client, this._config.numDigitalInputs);
    this.digitalOutputs     = new digitalOutputs(this._client, this._config.numDigitalOutputs);
};

processImage.prototype.init = async function() {
    try {
        await this.analogInputs.count;
        await this.analogOutputs.count;
        await this.digitalInputs.count;
        await this.digitalOutputs.count;
    } catch(err) {
        console.error(err);
    }
};

var analogInputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    })
};

var analogOutputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    })
};

var digitalInputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    })
};

var digitalOutputs = function(client, config){
    this._count = new numIOs(client, config);

    Object.defineProperty(this, 'count', {
        get: async function() { return await this._count.get(); }
    })
};

module.exports = processImage;