import serial
import time
import os

PORT = "COM7" # arduino
BAUD = 115200 # arduino

# PORT = "COM3" # xbee
# BAUD = 9600   # xbee

OUT_FILE = r"C:\Users\kumar\cansat\fe-cansat\public\cansat_telemetry.csv"
CMD_FILE = r"C:\Users\kumar\cansat\fe-cansat\command.txt"
last_cmd = None
cmd = None

CSV_HEADER = (
    "MISSION_TIME,PACKET,STATE,"
    "ALTITUDE_M,RAW_ALTITUDE_M,"
    "PRESSURE_KPA,TEMP_C,"
    "ACCEL_R,ACCEL_P,ACCEL_Y,"
    "GYRO_R,GYRO_P,GYRO_Y,"
    "GPS_LAT,GPS_LON,GPS_ALT,"
    "GPS_TIME_UTC,GPS_SATS,GPS_FIX\n"
)

def log_event(f, event):
    ts = time.strftime("%H:%M:%S", time.localtime())
    line = f"EVENT,{ts},{event}"
    f.write(line + "\n")
    f.flush()
    print("[EVENT]", event)

# ------------------ SERIAL SETUP ------------------
ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(2)

print(f"[INFO] Connected to {PORT} @ {BAUD}")
print(f"[INFO] Logging to {OUT_FILE}")

last_packet = None
lost_packets = 0
received_packets = 0

try:
    with open(OUT_FILE, "w") as f:
        # Write CSV header
        f.write(CSV_HEADER)
        f.flush()
        print("[INFO] CSV header written")
        
        while True:
            if os.path.exists(CMD_FILE):
                with open(CMD_FILE, "r") as cf:
                    cmd = cf.read().strip()
                # Delete command file after reading to prevent re-sending
                os.remove(CMD_FILE)

            if cmd in ("C", "D") and cmd != last_cmd:
                ser.write(cmd.encode())
                log_event(f, f"COMMAND_SENT: {cmd}")
                last_cmd = cmd
            line = ser.readline().decode(errors="ignore").strip()
            if not line:
                continue

            # HANDLE EVENT FIRST
            # COMMAND ACK
            if line.startswith("CMD_ECHO:"):
                log_event(f, line)
                continue

            # EVENT lines (not framed)
            if "EVENT:" in line:
                log_event(f, line)
                continue

            # TELEMETRY ONLY
            if not (line.startswith("$") and line.endswith("*")):
                # Log unrecognized lines for debugging (like startup messages)
                print(f"[INFO] {line}")
                continue

            csvData = line[1:-1]

            fields = csvData.split(",")

            # Extract packet number
            try:
                packet = int(fields[1])
            except (IndexError, ValueError):
                continue

            received_packets += 1

            # Packet loss detection
            if last_packet is not None and packet != last_packet + 1:
                lost = packet - last_packet - 1
                if lost > 0:
                    lost_packets += lost
                    print(f"[WARNING] Lost {lost} packet(s)")

            last_packet = packet

            # Write telemetry row
            f.write(csvData + "\n")
            f.flush()

            loss_pct = (lost_packets / (lost_packets + received_packets)) * 100
            print(f"[DATA] {csvData} | Loss {loss_pct:.2f}%")

except KeyboardInterrupt:
    print("\n[INFO] Shutting down...")
    with open(OUT_FILE, "a") as f:
        # Send DISCONNECT command
        ser.write(b"D")
        log_event(f, "COMMAND_SENT: DISCONNECT")

    total = received_packets + lost_packets
    loss_pct = (lost_packets / total) * 100 if total > 0 else 0

    print("\n----- PACKET LOSS SUMMARY -----")
    print(f"Received packets : {received_packets}")
    print(f"Lost packets     : {lost_packets}")
    print(f"Total packets    : {total}")
    print(f"Packet loss (%)  : {loss_pct:.2f}%")
    print("--------------------------------")

except serial.SerialException as e:
    print(f"[ERROR] Serial port error: {e}")

except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")

finally:
    ser.close()
    print("[INFO] Serial closed")
