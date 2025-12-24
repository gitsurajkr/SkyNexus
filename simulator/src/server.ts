import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8081;

// Official CanSat Telemetry Format
export interface SensorData {
  TEAM_ID: string;
  MISSION_TIME: string;
  PACKET_COUNT: number;
  MODE: string;
  STATE: string;
  ALTITUDE: number;
  TEMPERATURE: number;
  PRESSURE: number;
  VOLTAGE: number;
  CURRENT: number;
  GYRO_R: number;
  GYRO_P: number;
  GYRO_Y: number;
  ACCEL_R: number;
  ACCEL_P: number;
  ACCEL_Y: number;
  GPS_TIME: string;
  GPS_ALTITUDE: number;
  GPS_LATITUDE: number;
  GPS_LONGITUDE: number;
  GPS_SATS: number;
  CMD_ECHO: string;
}

// Flight simulation state
let missionTime = 0; // seconds since launch
let packetCount = 0;
const MISSION_DURATION = 500; // 500 seconds total mission
const UPDATE_RATE = 1000; // 1Hz (1000ms)

// Launch coordinates
const LAUNCH_LAT = 28.5;
const LAUNCH_LON = 77.2;

const wss = new WebSocketServer({ port: PORT });

console.log(`CanSat Telemetry Simulator running on ws://localhost:${PORT}`);
console.log(`Broadcasting telemetry at 1Hz...`);

// Store connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('✅ New client connected');
  clients.add(ws);
  
  // Send initial handshake
  ws.send(JSON.stringify({ type: 'connected', missionTime }));

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

// Generate realistic telemetry data in official format
function generateTelemetry(): SensorData {
  const flightPhase = missionTime / MISSION_DURATION;
  
  // Determine flight STATE based on mission phase
  let state = 'LAUNCH_PAD';
  if (missionTime > 0 && missionTime < 100) state = 'ASCENT';
  else if (missionTime >= 100 && missionTime < 110) state = 'APOGEE';
  else if (missionTime >= 110 && missionTime < 250) state = 'DESCENT';
  else if (missionTime >= 250 && missionTime < 260) state = 'PROBE_RELEASE';
  else if (missionTime >= 260 && missionTime < 450) state = 'PAYLOAD_RELEASE';
  else if (missionTime >= 450) state = 'LANDED';
  
  // Altitude simulation (ascent -> peak -> descent -> landing)
  let altitude = 0;
  let accelZ = -9.81;
  
  if (flightPhase < 0.2) {
    // Launch and ascent (0-100s)
    altitude = (missionTime / (MISSION_DURATION * 0.2)) * 3000;
    accelZ = -9.81 + (Math.random() * 4);
  } else if (flightPhase < 0.5) {
    // Peak altitude, floating (100-250s)
    altitude = 3000 - (flightPhase - 0.2) * 200 + Math.random() * 100;
    accelZ = -9.81 + (Math.random() - 0.5) * 0.5;
  } else if (flightPhase < 0.8) {
    // Descent with parachute (250-400s)
    altitude = 3000 - ((flightPhase - 0.5) / 0.3) * 2500 + Math.random() * 50;
    accelZ = -9.81 - (Math.random() * 2);
  } else {
    // Landing phase (400-500s)
    altitude = Math.max(0, 500 - ((flightPhase - 0.8) / 0.2) * 500);
    accelZ = -9.81 - (Math.random() * 1.5);
  }

  // Temperature decreases with altitude
  const temperature = 25 - (altitude / 3000) * 15 + (Math.random() - 0.5) * 2;
  
  // Atmospheric pressure in kPa (convert from hPa)
  const pressure = (1013.25 * Math.exp(-altitude / 8500)) / 10; // kPa

  // Battery drain over time
  const batteryDrain = (missionTime / MISSION_DURATION) * 1.5;
  const voltage = 12.6 - batteryDrain + (Math.random() - 0.5) * 0.1;

  // Current draw varies with activity
  const baseCurrent = 1.2;
  const activityCurrent = flightPhase < 0.3 || flightPhase > 0.7 ? 0.8 : 0.3;
  const current = baseCurrent + activityCurrent + (Math.random() - 0.5) * 0.4;

  // GPS drift simulation (wind effect)
  const driftDistance = (altitude / 3000) * 0.02; // Max ~2km drift at peak
  const windDirection = 45 + (Math.random() - 0.5) * 20; // NE direction
  const driftLat = driftDistance * Math.cos(windDirection * Math.PI / 180);
  const driftLon = driftDistance * Math.sin(windDirection * Math.PI / 180);
  
  const gpsLat = LAUNCH_LAT + driftLat + (Math.random() - 0.5) * 0.001;
  const gpsLon = LAUNCH_LON + driftLon + (Math.random() - 0.5) * 0.001;

  // GPS altitude (slightly different from barometric)
  const gpsAltitude = altitude + (Math.random() - 0.5) * 10;

  // Gyro and Accelerometer (Roll, Pitch, Yaw)
  const gyroR = parseFloat(((Math.random() - 0.5) * 50).toFixed(2));
  const gyroP = parseFloat(((Math.random() - 0.5) * 50).toFixed(2));
  const gyroY = parseFloat(((Math.random() - 0.5) * 50).toFixed(2));
  
  const accelR = parseFloat(((Math.random() - 0.5) * 2).toFixed(2));
  const accelP = parseFloat(((Math.random() - 0.5) * 2).toFixed(2));
  const accelY = parseFloat(accelZ.toFixed(2));

  // GPS satellites
  const gpsSats = Math.floor(8 + Math.random() * 5); // 8-12 satellites

  // Format times
  const now = new Date();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const missionTimeStr = `${String(Math.floor(missionTime / 3600)).padStart(2, '0')}:${String(Math.floor((missionTime % 3600) / 60)).padStart(2, '0')}:${String(missionTime % 60).padStart(2, '0')}`;

  return {
    TEAM_ID: '1000',
    MISSION_TIME: missionTimeStr,
    PACKET_COUNT: packetCount,
    MODE: 'F', // F for Flight mode
    STATE: state,
    ALTITUDE: parseFloat(Math.max(0, altitude).toFixed(1)),
    TEMPERATURE: parseFloat(temperature.toFixed(1)),
    PRESSURE: parseFloat(pressure.toFixed(1)),
    VOLTAGE: parseFloat(voltage.toFixed(1)),
    CURRENT: parseFloat(current.toFixed(2)),
    GYRO_R: gyroR,
    GYRO_P: gyroP,
    GYRO_Y: gyroY,
    ACCEL_R: accelR,
    ACCEL_P: accelP,
    ACCEL_Y: accelY,
    GPS_TIME: `${hours}:${minutes}:${seconds}`,
    GPS_ALTITUDE: parseFloat(gpsAltitude.toFixed(1)),
    GPS_LATITUDE: parseFloat(gpsLat.toFixed(4)),
    GPS_LONGITUDE: parseFloat(gpsLon.toFixed(4)),
    GPS_SATS: gpsSats,
    CMD_ECHO: 'CX,ON'
  };
}

// Broadcast telemetry to all connected clients
function broadcastTelemetry() {
  if (clients.size === 0) return;

  const telemetry = generateTelemetry();
  const message = JSON.stringify({ type: 'telemetry', data: telemetry });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(` [T+${telemetry.MISSION_TIME}] Alt: ${telemetry.ALTITUDE.toFixed(0)}m | State: ${telemetry.STATE} | Clients: ${clients.size}`);
}

// Main simulation loop (1Hz)
setInterval(() => {
  missionTime++;
  packetCount++;
  
  // Reset mission after completion
  if (missionTime >= MISSION_DURATION) {
    missionTime = 0;
    packetCount = 0;
    console.log('🔄 Mission complete. Restarting simulation...');
  }

  broadcastTelemetry();
}, UPDATE_RATE);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simulator...');
  clients.forEach((client) => client.close());
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
