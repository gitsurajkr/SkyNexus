"""
============================================================================
                      CANSAT GROUND STATION
============================================================================

Description:
    Receives telemetry from CanSat flight computer via XBee wireless.
    Parses framed packets ($...data...*) and logs to CSV.
    Sends commands (C=Connect, D=Disconnect) to control telemetry.

Communication:
    - XBee wireless @ 9600 baud
    - Telemetry frame: $field1,field2,...*

CSV Output:
    MISSION_TIME,PACKET,STATE,ALTITUDE_M,RAW_ALTITUDE_M,
    PRESSURE_KPA,TEMP_C,ACCEL_R,ACCEL_P,ACCEL_Y,
    GYRO_R,GYRO_P,GYRO_Y,GPS_LAT,GPS_LON,GPS_ALT,
    GPS_TIME_UTC,GPS_SATS,GPS_FIX

============================================================================
"""
import serial
import time
import os

#   CONFIGURATION

# Serial Port Settings
PORT = "COM3"       # XBee COM port
BAUD = 9600         # XBee baud rate

# CSV Header (must match Arduino telemetry format)
CSV_HEADER = (
    "MISSION_TIME,PACKET,STATE,"
    "ALTITUDE_M,RAW_ALTITUDE_M,"
    "PRESSURE_KPA,TEMP_C,"
    "ACCEL_R,ACCEL_P,ACCEL_Y,"
    "GYRO_R,GYRO_P,GYRO_Y,"
    "GPS_LAT,GPS_LON,GPS_ALT,"
    "GPS_TIME_UTC,GPS_SATS,GPS_FIX\n"
)

# File Paths
OUT_FILE = r"C:\Users\kumar\cansat\fe-cansat\public\cansat_telemetry.csv"
CMD_FILE = r"C:\Users\kumar\cansat\fe-cansat\command.txt"


# GLOBAL VARIABLES

last_cmd = None
cmd = None
last_packet = None
lost_packets = 0
received_packets = 0

# ============================================================================
#                          HELPER FUNCTIONS
# ============================================================================

def log_event(f, event):
    """Log an event with timestamp to file and console."""
    ts = time.strftime("%H:%M:%S", time.localtime())
    line = f"EVENT,{ts},{event}"
    f.write(line + "\n")
    f.flush()
    print("[EVENT]", event)


def send_command(ser, command, f, repeat=1, delay_ms=0):
    """Send a command over serial with optional repeat and delay."""
    for _ in range(repeat):
        ser.write((command + "\n").encode())
        ser.flush()
        if delay_ms > 0:
            time.sleep(delay_ms / 1000.0)
    log_event(f, f"COMMAND_SENT: {command}")


def parse_telemetry(line):
    """
    Parse a framed telemetry line.
    Returns (csv_data, packet_number) or (None, None) if invalid.
    """
    if not (line.startswith("$") and line.endswith("*")):
        return None, None
    
    csv_data = line[1:-1]  # Strip $ and *
    fields = csv_data.split(",")
    
    try:
        packet = int(fields[1])
        return csv_data, packet
    except (IndexError, ValueError):
        return None, None


def check_packet_loss(current_packet, last_packet):
    """
    Check for lost packets and return count of lost packets.
    """
    if last_packet is None:
        return 0
    
    if current_packet != last_packet + 1:
        lost = current_packet - last_packet - 1
        if lost > 0:
            return lost
    return 0


def print_summary(received, lost):
    """Print packet loss summary."""
    total = received + lost
    loss_pct = (lost / total) * 100 if total > 0 else 0

    print("\n----- PACKET LOSS SUMMARY -----")
    print(f"Received packets : {received}")
    print(f"Lost packets     : {lost}")
    print(f"Total packets    : {total}")
    print(f"Packet loss (%)  : {loss_pct:.2f}%")
    print("--------------------------------")

# ============================================================================
#                           SERIAL SETUP
# ============================================================================

ser = serial.Serial(PORT, BAUD, timeout=0.2)
time.sleep(2)

print(f"[INFO] Connected to {PORT} @ {BAUD}")
print(f"[INFO] Logging to {OUT_FILE}")

# ============================================================================
#                            MAIN LOOP
# ============================================================================

try:
    with open(OUT_FILE, "w") as f:
        # ----- Write CSV Header -----
        f.write(CSV_HEADER)
        f.flush()
        print("[INFO] CSV header written")

        while True:
            # ========== COMMAND HANDLING ==========
            if os.path.exists(CMD_FILE):
                with open(CMD_FILE, "r") as cf:
                    cmd = cf.read().strip()
                os.remove(CMD_FILE)  # Delete after reading

            if cmd == "C":
                # Retry CONNECT 3x to handle Arduino startup timing
                for _ in range(3):
                    ser.write(b"C\n")
                    ser.flush()
                    time.sleep(0.3)
                log_event(f, "COMMAND_SENT: C")
                last_cmd = "C"
                cmd = None

            elif cmd == "D":
                ser.write(b"D\n")
                ser.flush()
                log_event(f, "COMMAND_SENT: D")
                last_cmd = "D"
                cmd = None

            # ========== READ SERIAL DATA ==========
            line = ser.readline().decode(errors="ignore").strip()
            if not line:
                continue

            # ========== HANDLE EVENTS ==========
            if line.startswith("CMD_ECHO:"):
                log_event(f, line)
                continue

            if "EVENT:" in line:
                log_event(f, line)
                continue

            # ========== HANDLE TELEMETRY ==========
            csv_data, packet = parse_telemetry(line)
            
            if csv_data is None:
                # Unrecognized line (startup messages, debug, etc.)
                print(f"[INFO] {line}")
                continue

            received_packets += 1

            # ----- Packet Loss Detection -----
            lost = check_packet_loss(packet, last_packet)
            if lost > 0:
                lost_packets += lost
                print(f"[WARNING] Lost {lost} packet(s)")

            last_packet = packet

            # ----- Write to CSV -----
            f.write(csv_data + "\n")
            f.flush()

            # ----- Console Output -----
            total = lost_packets + received_packets
            loss_pct = (lost_packets / total) * 100 if total > 0 else 0
            print(f"[DATA] {csv_data} | Loss {loss_pct:.2f}%")

# ============================================================================
#                          SHUTDOWN HANDLING
# ============================================================================

except KeyboardInterrupt:
    print("\n[INFO] Shutting down...")
    
    with open(OUT_FILE, "a") as f:
        # Send DISCONNECT command
        ser.write(b"D\n")
        ser.flush()
        log_event(f, "COMMAND_SENT: DISCONNECT")

    print_summary(received_packets, lost_packets)

except serial.SerialException as e:
    print(f"[ERROR] Serial port error: {e}")

except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")

finally:
    ser.close()
    print("[INFO] Serial closed")
