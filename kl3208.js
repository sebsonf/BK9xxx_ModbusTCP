var registercom = require('./utils/registercom.js');
var kl3208Config = require('./ressources/kl3208.json');

const ERR_INPUT_OVERRANGE   = 0x02;
const ERR_INPUT_UNDERRANGE  = 0x01;

var kl3208Channel = function( modbusClient, inputNum ) {
    this._inputNum = inputNum;
    this._client = modbusClient;

    this.init = async function(){
        await this.inRange();
    };

    this.inRange = async function(){
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
};

module.exports = kl3208Channel;