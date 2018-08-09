# -*- coding: utf-8 -*-
ERROR_RESPONSE               = 0x80

ADR_PROCESS_INPUT_IMAGE      = [0x0000, 0x00FF]
ADR_PROCESS_OUTPUT_IMAGE     = [0x0800, 0x08FF]
STATUS_BYTE_ERROR            = 0x40
STATUS_BYTE_OVERRANGE        = 0x02
STATUS_BYTE_UNDERRANGE       = 0x01

ADR_BUS_COUPLER_ID_R         = [0x1000,0x1006]

ADR_MODBUS_TCP_MODE_RW       = 0x1123
MODBUS_TCP_MODE_FAST         = 1
MODBUS_TCP_MODE_NORMAL       = 0

#---------------------------------------------------------------------------#
# DIAGNOSIS/STATUS
#---------------------------------------------------------------------------#
ADR_BUS_TERMINAL_DIAG_R      = 0x100B
ADR_BUS_COUPLER_STATUS_R     = 0x100C
ADR_BUS_TERMINAL_DIAG_RW     = 0x110B
BUS_TERMINAL_ERR             = 0x0001
BUS_COUPLER_CONFIG_ERR       = 0x0002
WATCHDOG_EXPIRED_ERR         = 0x8000

#---------------------------------------------------------------------------#
# WATCHDOG
#---------------------------------------------------------------------------#
ADR_WATCHDOG_CURRENT_TIME_R  = 0x1020
ADR_WATCHDOG_TIMEOUT_RW      = 0x1120
ADR_WATCHDOG_RESET_RW        = 0x1121
ADR_WATCHDOG_TYPE_RW         = 0x1122
WATCHDOG_RESET_SEQ           = [0xBECF, 0xAFFE]
WATCHDOG_TRIGGER_ON_RECEIVE  = 1
WATCHDOG_TRIGGER_ON_WRITE    = 0

ADR_NUM_AO_R                 = 0x1010
ADR_NUM_AI_R                 = 0x1011
ADR_NUM_DO_R                 = 0x1012
ADR_NUM_DI_R                 = 0x1013

def status_register_address(input_num):
    return ADR_PROCESS_INPUT_IMAGE[0] + 2 * (input_num - 1)

def control_byte_address(input_num):
    return ADR_PROCESS_OUTPUT_IMAGE[0] + 2 * (input_num - 1)
    
def input_data_address(input_num):
    return status_register_address(input_num) + 1    
    
def output_data_address(input_num):
    return control_byte_address(input_num) + 1