import serial
import time
import os

# PORT = "COM7"
# BAUD = 115200

PORT = "COM3"
BAUD = 9600

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
    ts = time.strftime("%H:%M:%S", time.gmtime())
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

with open(OUT_FILE, "w") as f:
    # Write CSV header
    f.write(CSV_HEADER)
    f.flush()
    print("[INFO] CSV header written")
    
    try:
        while True:
            if os.path.exists(CMD_FILE):
                with open(CMD_FILE, "r") as cf:
                    cmd = cf.read().strip()

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

ser.close()
print("[INFO] Serial closed")
