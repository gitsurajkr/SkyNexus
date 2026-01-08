// Official CanSat Telemetry Data Structure
// Based on CXON Mission Specification - Telemetry Format

export interface SensorData {
  TEAM_ID: string;              // 4-digit team identification number
  MISSION_TIME: string;          // hh:mm:ss UTC format
  PACKET_COUNT: number;          // Packet count since power up
  MODE: string;                  // 'F' for Flight, 'S' for Simulation
  STATE: string;                 // LAUNCH_PAD, ASCENT, APOGEE, DESCENT, PROBE_RELEASE, PAYLOAD_RELEASE, LANDED
  ALTITUDE: number;              // Altitude in meters (0.1m resolution)
  TEMPERATURE: number;           // Temperature in Celsius (0.1°C resolution)
  PRESSURE: number;              // Pressure in kPa (0.1 kPa resolution)
  VOLTAGE: number;               // Voltage in volts (0.1V resolution)
  CURRENT: number;               // Current in amperes (0.01A resolution)
  GYRO_R: number;                // Gyro roll in degrees/sec
  GYRO_P: number;                // Gyro pitch in degrees/sec
  GYRO_Y: number;                // Gyro yaw in degrees/sec
  ACCEL_R: number;               // Accelerometer roll in degrees/sec²
  ACCEL_P: number;               // Accelerometer pitch in degrees/sec²
  ACCEL_Y: number;               // Accelerometer yaw in degrees/sec²
  GPS_TIME: string;              // GPS time in UTC (1 second resolution)
  GPS_ALTITUDE: number;          // GPS altitude in meters above sea level (0.1m resolution)
  GPS_LATITUDE: number;          // GPS latitude in decimal degrees (0.0001° resolution)
  GPS_LONGITUDE: number;         // GPS longitude in decimal degrees (0.0001° resolution)
  GPS_SATS: number;              // Number of GPS satellites being tracked (integer)
  CMD_ECHO: string;              // Last command received and processed
  // Optional fields team can add (comma-separated)
  OPTIONAL_DATA?: string;
}

// Utility function to export telemetry data to Official CSV format
export function convertToCSV(data: SensorData[]): string {
  const headers = [
    'TEAM_ID',
    'MISSION_TIME',
    'PACKET_COUNT',
    'MODE',
    'STATE',
    'ALTITUDE',
    'TEMPERATURE',
    'PRESSURE',
    'VOLTAGE',
    'CURRENT',
    'GYRO_R',
    'GYRO_P',
    'GYRO_Y',
    'ACCEL_R',
    'ACCEL_P',
    'ACCEL_Y',
    'GPS_TIME',
    'GPS_ALTITUDE',
    'GPS_LATITUDE',
    'GPS_LONGITUDE',
    'GPS_SATS',
    'CMD_ECHO'
  ];
  
  const rows = data.map(d => [
    d.TEAM_ID,
    d.MISSION_TIME,
    d.PACKET_COUNT.toString(),
    d.MODE,
    d.STATE,
    d.ALTITUDE.toFixed(1),
    d.TEMPERATURE.toFixed(1),
    d.PRESSURE.toFixed(1),
    d.VOLTAGE.toFixed(1),
    d.CURRENT.toFixed(2),
    d.GYRO_R.toFixed(2),
    d.GYRO_P.toFixed(2),
    d.GYRO_Y.toFixed(2),
    d.ACCEL_R.toFixed(2),
    d.ACCEL_P.toFixed(2),
    d.ACCEL_Y.toFixed(2),
    d.GPS_TIME,
    d.GPS_ALTITUDE.toFixed(1),
    d.GPS_LATITUDE.toFixed(4),
    d.GPS_LONGITUDE.toFixed(4),
    d.GPS_SATS.toString(),
    d.CMD_ECHO || ''
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
