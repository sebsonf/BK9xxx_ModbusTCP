var bk9xxxConfig = require('./bk9xxx.json');
var kl3208Config = require('./kl3208.json');

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

exports.writeTerminalRegister = async function( modbusClient, inputNum, regAddress, regValue ){
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

exports.readTerminalRegister = async function( modbusClient, inputNum, regAddress ){
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