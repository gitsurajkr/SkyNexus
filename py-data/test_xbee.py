import serial
import time

PORT = "COM3"   # your XBee USB COM port
BAUD = 9600

ser = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)

print("Listening...")

try:
    while True:
        if ser.in_waiting:
            data = ser.read(ser.in_waiting)
            print(data.decode(errors="ignore"), end="")
        time.sleep(0.1)
except KeyboardInterrupt:
    ser.close()
