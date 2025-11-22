const fs = require('fs');

// Mock data generator
function generateMockData(count = 250) {
  const data = [];
  const startTime = new Date('2025-11-17T12:00:00Z');
  
  const eventTypes = [
    'System initialized',
    'Telemetry link acquired',
    'GPS fix acquired',
    'Sensor calibration complete',
    'Data transmission successful',
    'Battery check OK',
    'Temperature nominal',
    'Altitude threshold reached',
    'Descent detected',
    'Landing sequence initiated',
    'Parachute deployment',
    'System check complete',
    'All sensors operational',
    'Signal strength optimal',
  ];
  
  for (let i = 0; i < count; i++) {
    const time = new Date(startTime.getTime() + i * 2000);
    
    const flightPhase = i / count;
    let altitude = 0;
    let speed = 0;
    let accelZ = -9.81;
    
    if (flightPhase < 0.2) {
      altitude = 0 + (i / (count * 0.2)) * 3000;
      speed = 15 + Math.random() * 5;
      accelZ = -9.81 + (Math.random() * 4);
    } else if (flightPhase < 0.5) {
      altitude = 3000 - (flightPhase - 0.2) * 200 + Math.random() * 100;
      speed = 2 + Math.random() * 3;
      accelZ = -9.81 + (Math.random() - 0.5) * 0.5;
    } else if (flightPhase < 0.8) {
      altitude = 3000 - ((flightPhase - 0.5) / 0.3) * 2500 + Math.random() * 50;
      speed = -8 - Math.random() * 4;
      accelZ = -9.81 - (Math.random() * 2);
    } else {
      altitude = Math.max(0, 500 - ((flightPhase - 0.8) / 0.2) * 500);
      speed = Math.max(0, -5 + ((flightPhase - 0.8) / 0.2) * 5);
      accelZ = -9.81 - (Math.random() * 1.5);
    }
    
    const temperature = 25 - (altitude / 3000) * 15 + (Math.random() - 0.5) * 2;
    const pressure = 1013.25 * Math.exp(-altitude / 8500) + (Math.random() - 0.5) * 5;
    
    // Battery voltage: starts at 12.6V, gradually decreases with flight time
    const batteryDrain = (i / count) * 1.5; // Drains ~1.5V over entire mission
    const voltage = (12.6 - batteryDrain + (Math.random() - 0.5) * 0.1).toFixed(2);
    
    // Current draw: varies with system activity, 0.5A to 2.5A
    const baseCurrent = 1.2; // Base current draw
    const activityCurrent = flightPhase < 0.3 || flightPhase > 0.7 ? 0.8 : 0.3; // Higher during launch/landing
    const current = (baseCurrent + activityCurrent + (Math.random() - 0.5) * 0.4).toFixed(2);
    
    data.push({
      timestamp: time.toISOString(),
      teamId: 'XYZ',
      altitude: Math.max(0, altitude).toFixed(2),
      temperature: temperature.toFixed(2),
      pressure: pressure.toFixed(2),
      speed: Math.abs(speed).toFixed(2),
      tilt: (Math.random() * 15 + (flightPhase > 0.5 ? Math.random() * 10 : 0)).toFixed(2),
      voltage: voltage,
      current: current,
      accelX: ((Math.random() - 0.5) * 2).toFixed(3),
      accelY: ((Math.random() - 0.5) * 2).toFixed(3),
      accelZ: accelZ.toFixed(3),
      gyroX: ((Math.random() - 0.5) * 50).toFixed(2),
      gyroY: ((Math.random() - 0.5) * 50).toFixed(2),
      gyroZ: ((Math.random() - 0.5) * 50).toFixed(2),
      magX: (25 + (Math.random() - 0.5) * 10).toFixed(2),
      magY: (15 + (Math.random() - 0.5) * 10).toFixed(2),
      magZ: (-40 + (Math.random() - 0.5) * 10).toFixed(2),
      systemHealth: i % 50 === 0 && Math.random() > 0.7 ? 'WARNING' : 'NOMINAL',
      eventLog: i % 20 === 0 ? eventTypes[Math.floor(Math.random() * eventTypes.length)] : '',
    });
  }
  
  return data;
}

function convertToCSV(data) {
  const headers = [
    'Timestamp',
    'TeamID',
    'Altitude(m)',
    'Temperature(C)',
    'Pressure(hPa)',
    'Speed(m/s)',
    'Tilt(deg)',
    'Voltage(V)',
    'Current(A)',
    'AccelX(g)',
    'AccelY(g)',
    'AccelZ(g)',
    'GyroX(deg/s)',
    'GyroY(deg/s)',
    'GyroZ(deg/s)',
    'MagX(uT)',
    'MagY(uT)',
    'MagZ(uT)',
    'SystemHealth',
    'EventLog'
  ];
  
  const rows = data.map(d => [
    d.timestamp,
    d.teamId,
    d.altitude,
    d.temperature,
    d.pressure,
    d.speed,
    d.tilt,
    d.voltage,
    d.current,
    d.accelX,
    d.accelY,
    d.accelZ,
    d.gyroX,
    d.gyroY,
    d.gyroZ,
    d.magX,
    d.magY,
    d.magZ,
    d.systemHealth,
    d.eventLog
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

// Generate and save CSV
const data = generateMockData(250);
const csv = convertToCSV(data);
fs.writeFileSync('./public/cansat-telemetry-TeamXYZ.csv', csv);
console.log('✅ CSV file generated: public/cansat-telemetry-TeamXYZ.csv');
console.log(`📊 Generated ${data.length} entries with Team ID: XYZ`);
