# CanSat Telemetry Dashboard

Real-time telemetry dashboard for CanSat missions with offline Electron desktop application support.

## Architecture

- **Frontend**: Next.js 16 + React 19 + TypeScript (port 9999)
- **Simulator**: WebSocket telemetry broadcaster (port 8081)
- **Desktop**: Electron 28 shell wrapping Next.js application

## Quick Start

### 1. Start the WebSocket Simulator

The simulator broadcasts realistic CanSat telemetry at 1Hz (1 data packet per second):

```powershell
cd simulator
npm install
npm run dev
```

The simulator will run a 500-second mission simulation with realistic flight phases:
- **Launch Phase** (0-100s): Rapid ascent, high acceleration
- **Peak Phase** (100-200s): Maximum altitude (~1000m), low descent
- **Descent Phase** (200-450s): Parachute deployment, steady descent
- **Landing Phase** (450-500s): Ground contact, system shutdown

### 2. Start the Frontend Dashboard

In a new terminal:

```powershell
cd fe
npm install
npm run dev
```

Dashboard will be available at http://localhost:9999

### 3. Start the Electron Desktop App

In a third terminal (from the fe directory):

```powershell
cd fe
npm run electron:dev
```

This will open the dashboard in a native desktop window.

## Development Workflow

### Option 1: Run All Services Manually

Terminal 1 - Simulator:
```powershell
cd simulator && npm run dev
```

Terminal 2 - Frontend:
```powershell
cd fe && npm run dev
```

Terminal 3 - Electron (optional):
```powershell
cd fe && npm run electron:dev
```

### Option 2: Browser-Only Testing

If you only need to test the dashboard in a browser:

1. Start simulator: `cd simulator && npm run dev`
2. Start frontend: `cd fe && npm run dev`
3. Open http://localhost:9999 in your browser

## Features

### Real-Time Telemetry (22 Data Fields)

**Primary Sensors:**
- Altitude (m)
- Temperature (°C)
- Pressure (hPa)
- Speed (m/s)
- Tilt (degrees)
- Voltage (V)
- Current (A)
- GPS Position (latitude/longitude)

**Inertial Measurement Unit (IMU):**
- 3-axis Accelerometer (g-force)
- 3-axis Gyroscope (deg/s)
- 3-axis Magnetometer (μT)

**System Status:**
- System Health
- Event Log

**Calculated Metrics:**
- Descent Rate (m/s)
- Battery Percentage (%)
- G-Force Magnitude (g)
- Heading (degrees)

### Visualization

- **Top Metrics Row**: 8 key indicators (altitude, temp, speed, tilt, GPS, heading, packets)
- **Live Graphs**: 20 real-time charts for all telemetry channels
- **Offline Map**: Flight path tracking with live CanSat position marker (Leaflet + OpenStreetMap)
- **CCV Log Panel**: Scrolling event log

### Data Export

Click the "Export" button to download all telemetry data as CSV for post-flight analysis.

## WebSocket Protocol

The simulator broadcasts JSON telemetry packets every second:

```javascript
{
  "timestamp": "2025-01-30T10:15:23.456Z",
  "teamId": "SkyNexus",
  "altitude": 856.23,
  "temperature": -15.4,
  "pressure": 912.5,
  "speed": 5.2,
  "tilt": 8.3,
  "voltage": 11.8,
  "current": 0.42,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "accelX": -0.15,
  "accelY": 0.08,
  "accelZ": -1.02,
  "gyroX": 2.3,
  "gyroY": -1.8,
  "gyroZ": 0.5,
  "magX": 23.4,
  "magY": -12.1,
  "magZ": 45.8,
  "systemHealth": "Nominal",
  "eventLog": "Parachute deployed"
}
```

## Production XBee Integration

When deploying with real CanSat hardware, replace the simulator with an XBee serial reader:

1. Modify `simulator/src/server.ts` to read from serial port instead of generating data
2. Use the `serialport` npm package to interface with XBee radio
3. Parse incoming analog data and convert to the `SensorData` interface format
4. Broadcast to WebSocket clients as before

Example serial port integration:

```typescript
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (line) => {
  const telemetry = parseXBeeData(line); // Custom parser
  broadcast(telemetry); // Send to WebSocket clients
});
```

## Building for Distribution

Build the Electron desktop app:

```powershell
cd fe
npm run electron:build
```

The installer will be created in `fe/dist-electron/`.

## Project Structure

```
cansat/
├── simulator/           # WebSocket telemetry broadcaster
│   ├── src/
│   │   └── server.ts   # Flight simulation + WebSocket server
│   └── package.json
├── fe/                 # Frontend dashboard
│   ├── app/            # Next.js pages
│   ├── components/     # React components
│   ├── lib/            # Utilities
│   ├── electron/       # Electron main/preload
│   └── package.json
└── README.md
```

## License

MIT
