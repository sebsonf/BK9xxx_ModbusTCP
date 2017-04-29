var registercom = require('./utils/registercom.js');
var kl3208Config = require('./ressources/kl3208.json');

const ERR_INPUT_OVERRANGE   = 0x02;
const ERR_INPUT_UNDERRANGE  = 0x01;

var kl3208Channel = function( modbusClient, inputNum ) {
    this._inputNum = inputNum;
    this._client = modbusClient;

    this.ADRawValue                 = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.ADRawValue );
    this.ADLineResRawValue          = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.ADLineResRawValue );
    this.terminalDiagnose           = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.terminalDiagnose );
    this.firmwareVersion            = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.firmwareVersion );
    this.hardwareVersion            = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.hardwareVersion );
    this.manufacturerAdjOffset      = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerAdjOffset );
    this.manufacturerAdjGain        = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerAdjGain );
    this.manufacturerScalingOffset  = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerScalingOffset );
    this.manufacturerScalingGain    = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerScalingGain );
    this.manufacturerCalibOffset    = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerCalibOffset );
    this.manufacturerCalibGain      = new registercom.readonlyRegister( 
                                        this._client, this._inputNum, kl3208Config.manufacturerCalibGain );
    this.sensorType                 = new registercom.readWriteRegister( 
                                        this._client, this._inputNum, kl3208Config.sensorType );
};

kl3208Channel.prototype.init = async function(){
    await this.inRange();
};

kl3208Channel.prototype.inRange = async function(){
    let resp = await registercom.readStatusRegister( this._client, this._inputNum );
    let statusByte = resp.data[0];

    if( statusByte === 0 ){
        console.log(`Analog Input ${this._inputNum}: Connected and in range.`);
    } else { 
        if( statusByte & ERR_INPUT_OVERRANGE ){
            console.error(`Analog Input ${this._inputNum}: Out of range (overrange).`);
        } else if( statusByte & ERR_INPUT_UNDERRANGE ){
            console.error(`Analog Input ${this._inputNum}: Out of range (underrange).`);
        }
    }
};

module.exports = kl3208Channel;