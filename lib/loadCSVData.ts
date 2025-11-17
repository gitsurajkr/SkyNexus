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

export async function loadCSVData(): Promise<SensorData[]> {
  const response = await fetch('/cansat-telemetry-TeamXYZ.csv');
  const text = await response.text();
  
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  
  const data: SensorData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    
    data.push({
      timestamp: values[0],
      teamId: values[1],
      altitude: parseFloat(values[2]),
      temperature: parseFloat(values[3]),
      pressure: parseFloat(values[4]),
      speed: parseFloat(values[5]),
      tilt: parseFloat(values[6]),
      accelX: parseFloat(values[7]),
      accelY: parseFloat(values[8]),
      accelZ: parseFloat(values[9]),
      gyroX: parseFloat(values[10]),
      gyroY: parseFloat(values[11]),
      gyroZ: parseFloat(values[12]),
      magX: parseFloat(values[13]),
      magY: parseFloat(values[14]),
      magZ: parseFloat(values[15]),
      systemHealth: values[16],
      eventLog: values[17] || '',
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
