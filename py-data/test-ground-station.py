import json, threading, time
import asyncio
import websockets
import logging
from datetime import datetime
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEBSOCKET_PORT = 8081  # WebSocket server port for frontend

# Global variables for sharing data between data generator and WebSocket threads
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

def generate_mock_sensor_data(packet_count, mission_time_ms):
    """Generate mock sensor data for testing"""
    # Simulate flight phases
    altitude_base = 100 + (packet_count * 2) if packet_count < 50 else max(100, 200 - (packet_count - 50) * 1.5)
    
    return {
        "TEAM_ID": "1234",
        "MISSION_TIME": format_mission_time(mission_time_ms),
        "PACKET_COUNT": packet_count,
        "MODE": "F",  # Flight mode
        "STATE": "ASCENT" if packet_count < 50 else "DESCENT",
        "ALTITUDE": round(altitude_base + random.uniform(-5, 5), 1),
        "TEMPERATURE": round(22.5 + random.uniform(-2, 2), 1),
        "PRESSURE": round(1013.25 - (altitude_base / 10), 1),
        "VOLTAGE": round(12.0 + random.uniform(-0.5, 0.5), 1),
        "CURRENT": round(0.8 + random.uniform(-0.1, 0.1), 2),
        "GYRO_R": round(random.uniform(-10, 10), 2),
        "GYRO_P": round(random.uniform(-10, 10), 2),
        "GYRO_Y": round(random.uniform(-10, 10), 2),
        "ACCEL_R": round(random.uniform(-2, 2), 2),
        "ACCEL_P": round(random.uniform(-2, 2), 2),
        "ACCEL_Y": round(9.8 + random.uniform(-1, 1), 2),
        "GPS_TIME": datetime.now().strftime("%H:%M:%S"),
        "GPS_ALTITUDE": round(altitude_base + random.uniform(-3, 3), 1),
        "GPS_LATITUDE": round(40.7128 + random.uniform(-0.01, 0.01), 4),
        "GPS_LONGITUDE": round(-74.0060 + random.uniform(-0.01, 0.01), 4),
        "GPS_SATS": random.randint(4, 12),
        "CMD_ECHO": "CX,ON"
    }

async def handle_websocket(websocket, path):
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
            
            await asyncio.sleep(0.5)  # 2Hz update rate
            
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

def data_generator():
    """Generate mock data continuously"""
    global latest_sensor_data
    packet_count = 0
    start_time = time.time() * 1000  # Start time in milliseconds
    
    print("Starting mock data generator...")
    
    while True:
        try:
            current_time = time.time() * 1000
            mission_time_ms = current_time - start_time
            
            # Generate mock sensor data
            sensor_data = generate_mock_sensor_data(packet_count, int(mission_time_ms))
            
            # Update global variable
            with data_lock:
                latest_sensor_data = sensor_data
            
            print(f"PKT {packet_count} | STATE {sensor_data['STATE']} | ALT {sensor_data['ALTITUDE']} m | TEMP {sensor_data['TEMPERATURE']}°C | Connected clients: {len(connected_websockets)}")
            
            packet_count += 1
            time.sleep(2)  # Generate data every 2 seconds
            
        except KeyboardInterrupt:
            print("\nStopping mock data generator...")
            break
        except Exception as e:
            logger.error(f"Error in data generator: {e}")
            time.sleep(1)

if __name__ == "__main__":
    print("CanSat Ground Station - Test Mode with Mock Data")
    print("========================================")
    
    # Start WebSocket server in a separate thread
    websocket_thread = threading.Thread(target=run_websocket_server, daemon=True)
    websocket_thread.start()
    print(f"WebSocket server started on ws://localhost:{WEBSOCKET_PORT}")
    
    # Start data generator (this will run in main thread)
    try:
        data_generator()
    except KeyboardInterrupt:
        print("\nShutting down...")
    
    print("Ground station stopped.")