var bk9xxxConfig = require('../ressources/bk9xxx.json');
var kl3208Config = require('../ressources/kl3208.json');

const REG_ACCESS    = 0x80;
const READ_ACCESS   = 0;
const WRITE_ACCESS  = 0x40;

var statusRegisterAddress = function(inputNum){
    return bk9xxxConfig.processInputImage.registers.startAddress + 2 * (inputNum - 1); 
};

var controlByteAddress = function(inputNum){
    return bk9xxxConfig.processOutputImage.registers.startAddress + 2 * (inputNum - 1);
};

var inputDataAddress = function(inputNum){
    return statusRegisterAddress(inputNum) + 1; 
};

var outputDataAddress = function(inputNum){
    return controlByteAddress(inputNum) + 1;
};

var writeControlRegister = exports.writeControlRegister = async function( modbusClient, inputNum, controlByte ){
    await modbusClient.writeRegister( controlByteAddress(inputNum), controlByte );
};

exports.readStatusRegister = async function( modbusClient, inputNum ){
    return await modbusClient.readHoldingRegisters( statusRegisterAddress(inputNum), 1 );
};

var writeTerminalRegister = exports.writeTerminalRegister = async function( modbusClient, inputNum, regAddress, regValue ){
    // switch from process data to register communication mode
    // disable write protection
    let controlByte = REG_ACCESS | WRITE_ACCESS | kl3208Config.writeProtection.registers.startAddress;
    await modbusClient.writeRegisters( controlByteAddress(inputNum), 
                                       [controlByte, kl3208Config.writeProtection.codeDisable] );

    // write value to register
    controlByte = REG_ACCESS | WRITE_ACCESS | regAddress;
    await modbusClient.writeRegisters( controlByteAddress(inputNum), [controlByte, regAddress] );

    // re-enable write protection
    controlByte = REG_ACCESS | WRITE_ACCESS | kl3208Config.writeProtection.registers.startAddress;
    await modbusClient.writeRegisters( controlByteAddress(inputNum), 
                                       [controlByte, kl3208Config.writeProtection.codeEnable] );

    // switch from register communication to process data mode
    await writeControlRegister( modbusClient, inputNum, 0 );
};

var readTerminalRegister = exports.readTerminalRegister = async function( modbusClient, inputNum, regAddress ){
    let controlByte = REG_ACCESS | READ_ACCESS | regAddress;
    await writeControlRegister( modbusClient, inputNum, controlByte );
    return await modbusClient.readHoldingRegisters( inputDataAddress( inputNum ), 1 );
};

exports.disableWriteProtection = async function( modbusClient, inputNum ){
    let controlByte = REG_ACCESS | WRITE_ACCESS | kl3208Config.writeProtection.registers.startAddress;
    await writeControlRegister( modbusClient, inputNum, controlByte );
    await modbusClient.writeRegister( outputDataAddress(inputNum), 
                                      kl3208Config.writeProtection.codeDisable );
    await writeControlRegister( modbusClient, inputNum, 0 );
};

exports.enableWriteProtection = async function( modbusClient, inputNum ){
    let controlByte = REG_ACCESS | READ_ACCESS | kl3208Config.writeProtection.registers.startAddress;
    await writeControlRegister( modbusClient, inputNum, controlByte );
    await modbusClient.writeRegister( outputDataAddress(inputNum), 
                                      kl3208Config.writeProtection.codeEnable );
    await writeControlRegister( modbusClient, inputNum, 0 );
};

var readonlyRegister = exports.readonlyRegister = class readonlyRegister {
    constructor( modbusClient, inputNum, params ) {
        this._value = undefined;
        this._client = modbusClient;
        this._inputNum = inputNum;
        this._params = params;

        Object.defineProperty(this, 'value', {
            get: async function() { 
                await this.fetch(); 
                return this._value;
            }
        });
    }

    async fetch() {
        console.log(`Analog Input ${this._inputNum}: Reading ${this._params.description}.`);
        let resp = await readTerminalRegister( this._client, this._inputNum, this._params.registers.startAddress );
        this._value = resp.data[0];
    };
};

var readWriteRegister = exports.readWriteRegister = class readWriteRegister{
    constructor( modbusClient, inputNum, params ) {
        this._value = undefined;
        this._client = modbusClient;
        this._inputNum = inputNum;
        this._params = params;

        Object.defineProperty(this, 'value', {
            get: async function() { 
                await this.fetch(); 
                return this._value;
            },
            set: async function(val) {
                this._value = val; 
                await this.write(this._value); 
            }
        });
    }

    async fetch() {
        console.log(`Analog Input ${this._inputNum}: Reading ${this._params.description}.`);
        let resp = await readTerminalRegister( this._client, this._inputNum, this._params.registers.startAddress );
        this._value = resp.data[0];
    };

    async write(value) {
        console.log(`Analog Input ${this._inputNum}: Setting ${this._params.description} to ${value}.`);
        await writeTerminalRegister( this._client, this._inputNum, this._params.registers.startAddress, value );
    };    
};