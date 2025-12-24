# CanSat Telemetry Simulator

WebSocket-based real-time telemetry simulator for CanSat dashboard testing.

## Features

- 🚀 Realistic flight simulation (launch → peak → descent → landing)
- 📡 WebSocket server broadcasting at 1Hz
- 🌍 GPS trajectory simulation with wind drift
- 🔋 Battery drain over mission time
- 📊 All 20+ telemetry parameters
- 🔄 Auto-restart after mission complete

## Quick Start

```bash
# Install dependencies
npm install

# Run simulator
npm run dev
```

The simulator will start on `ws://localhost:8081` and broadcast telemetry every second.

## Telemetry Data

Each message includes:
- **Position**: Altitude, GPS (lat/lon), tilt
- **Environment**: Temperature, pressure
- **Motion**: Speed, acceleration (X/Y/Z), gyroscope (X/Y/Z)
- **Orientation**: Magnetometer (X/Y/Z), heading
- **Power**: Voltage, current
- **Status**: System health, event logs

## Mission Phases

1. **Launch & Ascent** (0-100s): 0m → 3000m
2. **Peak Float** (100-250s): ~3000m with drift
3. **Descent** (250-400s): 3000m → 500m
4. **Landing** (400-500s): 500m → 0m

## Integration

Connect from frontend:
```typescript
const ws = new WebSocket('ws://localhost:8081');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'telemetry') {
    console.log(data); // SensorData object
  }
};
```

## Configuration

Edit `src/server.ts`:
- `PORT`: WebSocket port (default: 8081)
- `UPDATE_RATE`: Broadcast interval in ms (default: 1000)
- `MISSION_DURATION`: Total mission time in seconds (default: 500)
- `LAUNCH_LAT/LON`: Starting GPS coordinates

## Production Use

For real XBee hardware integration, replace the `generateTelemetry()` function with serial port reading:

```typescript
import { SerialPort } from 'serialport';

const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
// Parse incoming XBee frames and broadcast via WebSocket
```
