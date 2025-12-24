import serial, csv, time, json, threading
import matplotlib.pyplot as plt
from collections import deque
import asyncio
import websockets
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = "COM7"        # CHANGE THIS
BAUD = 9600          # Updated to match Arduino
TIMEOUT = 2.0
WEBSOCKET_PORT = 8081  # WebSocket server port for frontend

# Global variables for sharing data between serial and WebSocket threads
latest_sensor_data = None
connected_websockets = set()
data_lock = threading.Lock()

def format_mission_time(mission_time_ms):
    """Convert mission time from milliseconds to hh:mm:ss format"""
    total_seconds = mission_time_ms // 1000
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

def convert_to_frontend_format(data_array):
    """Convert Arduino CSV data array to frontend-compatible JSON format"""
    try:
        return {
            "TEAM_ID": data_array[0],
            "MISSION_TIME": format_mission_time(int(data_array[1])),
            "PACKET_COUNT": int(data_array[2]),
            "MODE": data_array[3],
            "STATE": data_array[4],
            "ALTITUDE": float(data_array[5]),
            "TEMPERATURE": float(data_array[6]),
            "PRESSURE": float(data_array[7]),
            "VOLTAGE": float(data_array[8]),
            "CURRENT": float(data_array[9]),
            "GYRO_R": float(data_array[10]),
            "GYRO_P": float(data_array[11]),
            "GYRO_Y": float(data_array[12]),
            "ACCEL_R": float(data_array[13]),
            "ACCEL_P": float(data_array[14]),
            "ACCEL_Y": float(data_array[15]),
            "GPS_TIME": data_array[16],
            "GPS_ALTITUDE": float(data_array[17]),
            "GPS_LATITUDE": float(data_array[18]),
            "GPS_LONGITUDE": float(data_array[19]),
            "GPS_SATS": int(data_array[20]),
            "CMD_ECHO": data_array[21]
        }
    except Exception as e:
        logger.error(f"Error converting data format: {e}")
        return None

async def handle_websocket(websocket):
    """Handle WebSocket connections from frontend"""
    logger.info(f"New WebSocket connection from {websocket.remote_address}")
    connected_websockets.add(websocket)
    
    try:
        await websocket.wait_closed()
    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connected_websockets.discard(websocket)
        logger.info(f"WebSocket connection closed")

async def broadcast_sensor_data():
    """Broadcast latest sensor data to all connected WebSocket clients"""
    global latest_sensor_data
    
    while True:
        try:
            if latest_sensor_data and connected_websockets:
                with data_lock:
                    message = {
                        "type": "telemetry",
                        "data": latest_sensor_data
                    }
                    
                # Create a copy of the set to avoid modification during iteration
                websockets_copy = connected_websockets.copy()
                
                for websocket in websockets_copy:
                    try:
                        await websocket.send(json.dumps(message))
                    except websockets.exceptions.ConnectionClosed:
                        connected_websockets.discard(websocket)
                    except Exception as e:
                        logger.error(f"Error sending to WebSocket: {e}")
                        connected_websockets.discard(websocket)
            
            await asyncio.sleep(0.1)  # 10Hz update rate
            
        except Exception as e:
            logger.error(f"Error in broadcast loop: {e}")
            await asyncio.sleep(1)

async def start_websocket_server():
    """Start the WebSocket server"""
    logger.info(f"Starting WebSocket server on port {WEBSOCKET_PORT}")
    
    # Start the broadcast task
    broadcast_task = asyncio.create_task(broadcast_sensor_data())
    
    # Start the WebSocket server
    server = await websockets.serve(handle_websocket, "localhost", WEBSOCKET_PORT)
    logger.info(f"WebSocket server listening on ws://localhost:{WEBSOCKET_PORT}")
    
    try:
        await server.wait_closed()
    finally:
        broadcast_task.cancel()

def run_websocket_server():
    """Run WebSocket server in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(start_websocket_server())
    except Exception as e:
        logger.error(f"WebSocket server error: {e}")
    finally:
        loop.close()

print("Attempting to connect to Arduino...")
try:
    ser = serial.Serial(PORT, BAUD, timeout=TIMEOUT)
    print(f"Connected to {PORT} at {BAUD} baud")
except Exception as e:
    print(f"Error connecting to {PORT}: {e}")
    print("Make sure:")
    print("1. Arduino IDE Serial Monitor is closed")
    print("2. No other programs are using COM7")
    print("3. Arduino is properly connected")
    exit(1)

# Start WebSocket server in a separate thread
websocket_thread = threading.Thread(target=run_websocket_server, daemon=True)
websocket_thread.start()
print(f"WebSocket server started on ws://localhost:{WEBSOCKET_PORT}")

csvf = open("telemetry.csv", "w", newline="")
writer = csv.writer(csvf)
writer.writerow([
    "TEAM_ID","MISSION_TIME","PACKET_COUNT","MODE","STATE",
    "ALTITUDE","TEMPERATURE","PRESSURE","VOLTAGE","CURRENT",
    "GYRO_R","GYRO_P","GYRO_Y",
    "ACCEL_R","ACCEL_P","ACCEL_Y",
    "GPS_TIME","GPS_ALTITUDE","GPS_LATITUDE","GPS_LONGITUDE","GPS_SATS",
    "CMD_ECHO"
])

plt.ion()
fig, ax = plt.subplots()
alt_buf = deque(maxlen=200)
time_buf = deque(maxlen=200)

received = 0
errors = 0
print("Ground station running...")
print("Waiting for CSV data... (Press Ctrl+C to stop)")

# Skip the header line if it's sent by Arduino
try:
    header_line = ser.readline().decode().strip()
    if "TEAM_ID" in header_line:
        print(f"Received header: {header_line}")
    else:
        # If it's not a header, we'll process it as data
        print(f"First line (processing as data): {header_line}")
        # Process this line as data...
except:
    pass

while True:
    try:
        # Read a line from serial
        line = ser.readline().decode().strip()
        
        if not line:
            print("No data received, waiting...")
            continue
        
        # Parse CSV data
        data = line.split(',')
        
        # Handle CMD_ECHO field that contains comma (CX,ON becomes two fields)
        if len(data) == 23:
            # Combine the last two fields back into CMD_ECHO
            data[21] = data[21] + "," + data[22]
            data = data[:22]  # Remove the extra field
        
        # Validate we have the expected number of fields (22 total)
        if len(data) != 22:
            errors += 1
            print(f"Invalid CSV line (expected 22 fields, got {len(data)}): {line}")
            continue
        
        try:
            team_id = data[0]
            mission_time = int(data[1])
            packet_count = int(data[2])
            mode = data[3]
            state = data[4]
            altitude = float(data[5])
            temperature = float(data[6])
            pressure = float(data[7])
            voltage = float(data[8])
            current = float(data[9])
            gyro_r = float(data[10])
            gyro_p = float(data[11]) 
            gyro_y = float(data[12])
            accel_r = float(data[13])
            accel_p = float(data[14])
            accel_y = float(data[15])
            gps_time = data[16]
            gps_altitude = float(data[17])
            gps_latitude = float(data[18])
            gps_longitude = float(data[19])
            gps_sats = int(data[20])
            cmd_echo = data[21]
            
        except (ValueError, IndexError) as e:
            errors += 1
            print(f"Error parsing data: {e}")
            print(f"Raw line: {line}")
            continue
        
        received += 1
        
        print(f"Team: {team_id}, Packet: {packet_count}, State: {state}, Alt: {altitude:.1f}m, Temp: {temperature:.1f}°C")
        
        # Write to CSV file
        writer.writerow(data)
        csvf.flush()
        
        # Convert to frontend format and update global variable
        frontend_data = convert_to_frontend_format(data)
        if frontend_data:
            with data_lock:
                latest_sensor_data = frontend_data
        
        # Update plotting buffers
        time_buf.append(mission_time/1000)
        alt_buf.append(altitude)
        
        # Update plot
        ax.clear()
        ax.plot(time_buf, alt_buf)
        error_pct = (errors / (errors + received)) * 100 if (errors + received) > 0 else 0
        ax.set_title(f"Altitude | Errors {error_pct:.1f}%")
        ax.set_ylabel("m")
        ax.set_xlabel("Time (s)")
        plt.pause(0.01)
        
        print(f"PKT {packet_count} | STATE {state} | ALT {altitude:.1f} m | TEMP {temperature:.1f}°C | ERRORS {error_pct:.1f}%")
        
    except KeyboardInterrupt:
        print("\nStopping ground station...")
        break
    except Exception as e:
        errors += 1
        print(f"Unexpected error: {e}")
        continue

ser.close()
csvf.close()
print("Ground station stopped.")
