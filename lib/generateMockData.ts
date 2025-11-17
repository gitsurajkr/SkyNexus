export interface SensorData {
  timestamp: string;
  teamId: string;
  altitude: number;
  temperature: number;
  pressure: number;
  speed: number;
  tilt: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  magX: number;
  magY: number;
  magZ: number;
  systemHealth: string;
  eventLog: string;
}

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

const healthStates = ['NOMINAL', 'WARNING', 'CRITICAL', 'OK'];

export function generateMockData(count: number = 250): SensorData[] {
  const data: SensorData[] = [];
  const startTime = new Date('2025-11-17T12:00:00Z');
  
  for (let i = 0; i < count; i++) {
    const time = new Date(startTime.getTime() + i * 2000); // Every 2 seconds
    
    // Simulate a flight profile
    const flightPhase = i / count;
    let altitude = 0;
    let speed = 0;
    let accelZ = -9.81; // Gravity
    
    if (flightPhase < 0.2) {
      // Ascent
      altitude = 0 + (i / (count * 0.2)) * 3000;
      speed = 15 + Math.random() * 5;
      accelZ = -9.81 + (Math.random() * 4);
    } else if (flightPhase < 0.5) {
      // Peak and stabilization
      altitude = 3000 - (flightPhase - 0.2) * 200 + Math.random() * 100;
      speed = 2 + Math.random() * 3;
      accelZ = -9.81 + (Math.random() - 0.5) * 0.5;
    } else if (flightPhase < 0.8) {
      // Descent
      altitude = 3000 - ((flightPhase - 0.5) / 0.3) * 2500 + Math.random() * 50;
      speed = -8 - Math.random() * 4;
      accelZ = -9.81 - (Math.random() * 2);
    } else {
      // Landing
      altitude = Math.max(0, 500 - ((flightPhase - 0.8) / 0.2) * 500);
      speed = Math.max(0, -5 + ((flightPhase - 0.8) / 0.2) * 5);
      accelZ = -9.81 - (Math.random() * 1.5);
    }
    
    const temperature = 25 - (altitude / 3000) * 15 + (Math.random() - 0.5) * 2;
    const pressure = 1013.25 * Math.exp(-altitude / 8500) + (Math.random() - 0.5) * 5;
    
    data.push({
      timestamp: time.toISOString(),
      teamId: 'XYZ',
      altitude: Math.max(0, altitude),
      temperature: temperature,
      pressure: pressure,
      speed: Math.abs(speed),
      tilt: Math.random() * 15 + (flightPhase > 0.5 ? Math.random() * 10 : 0),
      accelX: (Math.random() - 0.5) * 2,
      accelY: (Math.random() - 0.5) * 2,
      accelZ: accelZ,
      gyroX: (Math.random() - 0.5) * 50,
      gyroY: (Math.random() - 0.5) * 50,
      gyroZ: (Math.random() - 0.5) * 50,
      magX: 25 + (Math.random() - 0.5) * 10,
      magY: 15 + (Math.random() - 0.5) * 10,
      magZ: -40 + (Math.random() - 0.5) * 10,
      systemHealth: i % 50 === 0 && Math.random() > 0.7 ? 'WARNING' : 'NOMINAL',
      eventLog: i % 20 === 0 ? eventTypes[Math.floor(Math.random() * eventTypes.length)] : '',
    });
  }
  
  return data;
}

export function convertToCSV(data: SensorData[]): string {
  const headers = [
    'Timestamp',
    'TeamID',
    'Altitude(m)',
    'Temperature(C)',
    'Pressure(hPa)',
    'Speed(m/s)',
    'Tilt(deg)',
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
    d.altitude.toFixed(2),
    d.temperature.toFixed(2),
    d.pressure.toFixed(2),
    d.speed.toFixed(2),
    d.tilt.toFixed(2),
    d.accelX.toFixed(3),
    d.accelY.toFixed(3),
    d.accelZ.toFixed(3),
    d.gyroX.toFixed(2),
    d.gyroY.toFixed(2),
    d.gyroZ.toFixed(2),
    d.magX.toFixed(2),
    d.magY.toFixed(2),
    d.magZ.toFixed(2),
    d.systemHealth,
    d.eventLog
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
