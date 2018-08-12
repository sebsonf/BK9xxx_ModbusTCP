#!/usr/bin/env python
'''
Pymodbus Synchronous Client Examples
--------------------------------------------------------------------------

The following is an example of how to use the synchronous modbus client
implementation from pymodbus.

It should be noted that the client can also be used with
the guard construct that is available in python 2.5 and up::

    with ModbusClient('127.0.0.1') as client:
        result = client.read_coils(1,10)
        print result
'''


#---------------------------------------------------------------------------#
# import the various server implementations
#---------------------------------------------------------------------------#
#from pymodbus.client.async import ModbusClientProtocol as ModbusClient
from pymodbus.client.sync import ModbusTcpClient as ModbusClient
#from pymodbus.client.sync import ModbusUdpClient as ModbusClient
#from pymodbus.client.sync import ModbusSerialClient as ModbusClient
from bk9050_modbus import BK9050
from bk9050_modbus import KL3208_0010_Encoder
from bk9050_defines import *
from kl3208_0010_defines import *
import json
import paho.mqtt.client as mqtt
import time
import math

#---------------------------------------------------------------------------#
# configure the client logging
#---------------------------------------------------------------------------#
import logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

#---------------------------------------------------------------------------#
# configure mqtt
#---------------------------------------------------------------------------#
# The callback for when the client receives a CONNACK response from the server.
def on_connect(mqtt_client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    # mqtt_client.subscribe("$SYS/#")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect("localhost", 1883, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
mqtt_client.loop_start()

#---------------------------------------------------------------------------#
# choose the client you want
#---------------------------------------------------------------------------#
# make sure to start an implementation to hit against. For this
# you can use an existing device, the reference implementation in the tools
# directory, or start a pymodbus server.
#
# If you use the UDP or TCP clients, you can override the framer being used
# to use a custom implementation (say RTU over TCP). By default they use the
# socket framer::
#
#    client = ModbusClient('localhost', port=5020, framer=ModbusRtuFramer)
#
# It should be noted that you can supply an ipv4 or an ipv6 host address for
# both the UDP and TCP clients.
#
# There are also other options that can be set on the client that controls
# how transactions are performed. The current ones are:
#
# * retries - Specify how many retries to allow per transaction (default = 3)
# * retry_on_empty - Is an empty response a retry (default = False)
# * source_address - Specifies the TCP source address to bind to
#
# Here is an example of using these options::
#
#    client = ModbusClient('localhost', retries=3, retry_on_empty=True)
#---------------------------------------------------------------------------#

bus_coupler = BK9050('192.168.0.192', port=502)

#response = client.read_holding_registers(0x0000,2)
#print response.registers

#client.disable_register_write_protection(2)
#client.set_sensor_type(1, RTD_NTC10K)
#client.get_sensor_type(2)
#client.enable_register_write_protection(2)

#client.set_modbus_tcp_mode(MODBUS_TCP_MODE_NORMAL)
#client.get_analog_input_status(1)
bus_coupler.set_digital_output(0,0)
#client.get_watchdog_current_time()
#client.diag_echo_request()
#client.diag_response_counter()
#client.diag_bus_message_counter()
#client.diag_bus_error_counter()
#client.diag_no_response_counter()
#client.diag_response_error_counter()
#client.diag_clear_counters()

def loop(bus_coupler):
    bus_coupler.process_diagnosis()
    bus_coupler.process_analog_inputs()
    
    analog_inputs = {}
    
    for input_num in range(0, bus_coupler.num_ai):
        analog_inputs["analog_input{}".format(input_num+1)] = bus_coupler.analog_inputs[input_num]
    
    info = {
        'id': bus_coupler.id,
        'ip': bus_coupler.ip,
        'port': bus_coupler.port,
        'status': bus_coupler.status_str,
        'bus_error_counter': bus_coupler.bus_error_counter,
        'process_image': {
            'num_ai': bus_coupler.num_ai,
            'num_ao': bus_coupler.num_ao,
            'num_di': bus_coupler.num_di,
            'num_do': bus_coupler.num_do,
            'analog_inputs': analog_inputs
        },
    }
        
    info = json.dumps(info, cls=KL3208_0010_Encoder)
    
    return info

while True:
#  for input_num in range(1, 9):
  info = loop(bus_coupler)
  mqtt_client.publish("BK9050", info)
  time.sleep(1)

#---------------------------------------------------------------------------#
# close the client
#---------------------------------------------------------------------------#
#client.close()
