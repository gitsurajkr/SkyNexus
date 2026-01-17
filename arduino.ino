/*
 * ============================================================================
 *                         CANSAT FLIGHT COMPUTER
 * ============================================================================
 * 
 * Hardware: Arduino Nano 33 BLE Rev2
 * 
 * Sensors:
 *   - LPS22HB  : Barometric pressure sensor (altitude, pressure)
 *   - HS300x   : Temperature/humidity sensor
 *   - BMI270   : 9-axis IMU (accelerometer, gyroscope)
 *   - GPS      : TinyGPS++ compatible module
 * 
 * Communication:
 *   - Serial   : USB debug (9600 baud)
 *   - Serial1  : XBee wireless (9600 baud)
 * 
 * Telemetry Format:
 *   $MISSION_TIME,PACKET,STATE,ALT,RAW_ALT,PRESSURE,TEMP,
 *    AX,AY,AZ,GX,GY,GZ,LAT,LON,GPS_ALT,GPS_TIME,SATS,FIX*
 * 
 * ============================================================================
 */

//  INCLUDES


#include <Arduino_LPS22HB.h>
#include <Arduino_HS300x.h>
#include <Arduino_BMI270_BMM150.h>
#include <math.h>
#include <TinyGPSPlus.h>

//  CONFIGURATION

#define RADIO_SERIAL Serial1

const unsigned long TELEMETRY_INTERVAL_MS = 1000;  // 1 Hz telemetry rate

//                        FLIGHT STATE MACHINE


enum State {
  LAUNCH_PAD,
  ASCENT,
  APOGEE,
  DESCENT,
  PAYLOAD_RELEASE,
  EGG_RELEASE,
  LANDED
};

// ============================================================================
//                          GLOBAL VARIABLES
// ============================================================================

// ----- State Machine -----
State currentState = LAUNCH_PAD;
unsigned long lastTelemetryTime = 0;

// ----- GPS -----
TinyGPSPlus gps;
char missionTimeStr[9] = "NA";
bool gpsCalibrated = false;

// ----- Barometer / Altitude -----
float P0;                    // Ground reference pressure
float altitudeFiltered = 0;
float prevAltitude = 0;
float maxAltitude = 0;
bool groundCalibrated = false;

// ----- Flight Detection -----
int apogeeCount = 0;
bool payloadReleased = false;
bool eggReleased = false;
unsigned long apogeeDetectedTime = 0;

// ----- Telemetry -----
unsigned long packetCount = 0;
bool telemetryEnabled = true;

// ----- Commands -----
char lastCommand = '\0';

// ============================================================================
//                          HELPER FUNCTIONS
// ============================================================================

/**
 * Convert State enum to string for telemetry
 */
const char* stateToString(State s) {
  switch (s) {
    case LAUNCH_PAD:      return "LAUNCH_PAD";
    case ASCENT:          return "ASCENT";
    case APOGEE:          return "APOGEE";
    case DESCENT:         return "DESCENT";
    case PAYLOAD_RELEASE: return "PAYLOAD_RELEASE";
    case EGG_RELEASE:     return "EGG_RELEASE";
    case LANDED:          return "LANDED";
    default:              return "UNKNOWN";
  }
}

/**
 * Read command from radio serial (single character)
 */
char readCommandFromAny() {
  if (RADIO_SERIAL.available()) {
    return RADIO_SERIAL.read();
  }
  return '\0';
}

/**
 * Send event message over radio
 */
void sendEvent(const char* msg) {
  RADIO_SERIAL.println(msg);
}

// ============================================================================
//                              SETUP
// ============================================================================

void setup() {
  // ----- Serial Initialization -----
  Serial.begin(9600);   // USB debug
  Serial1.begin(9600);  // XBee wireless

  Serial1.println("XBEE_CONNECTION_OK");
  RADIO_SERIAL.println("STATUS:BOOTED");

  // ----- Sensor Initialization -----
  if (!BARO.begin()) {
    RADIO_SERIAL.println("ERROR: LPS22HB init failed");
    while (1);
  }

  if (!HS300x.begin()) {
    RADIO_SERIAL.println("ERROR: HS300x init failed");
    while (1);
  }

  if (!IMU.begin()) {
    RADIO_SERIAL.println("ERROR: IMU init failed");
    while (1);
  }

  delay(2000);

  // ----- Ground Pressure Calibration -----
  float sum = 0;
  for (int i = 0; i < 200; i++) {
    sum += BARO.readPressure();
    delay(20);
  }
  P0 = sum / 200.0;
  groundCalibrated = true;

  // ----- Send CSV Header -----
  RADIO_SERIAL.println(
    "MISSION_TIME,PACKET,STATE,ALTITUDE_M,RAW_ALTITUDE_M,PRESSURE_KPA,TEMP_C,"
    "ACCEL_R,ACCEL_P,ACCEL_Y,GYRO_R,GYRO_P,GYRO_Y,"
    "GPS_LAT,GPS_LON,GPS_ALT,GPS_TIME_UTC,GPS_SATS,GPS_FIX"
  );

  RADIO_SERIAL.println("TIME_MS: 0, STATE: LAUNCH_PAD");
}

// ============================================================================
//                             MAIN LOOP
// ============================================================================

void loop() {
  // ========== GPS PARSING ==========
  while (Serial1.available()) {
    gps.encode(Serial1.read());
  }

  // ========== COMMAND HANDLING ==========
  char cmd = readCommandFromAny();
  if (cmd == '\n' || cmd == '\r') {
    cmd = '\0';
  }

  if (cmd == 'C') {
    telemetryEnabled = true;
    lastCommand = 'C';
    RADIO_SERIAL.println("CMD_ECHO:CONNECT");
  }

  if (cmd == 'D' && lastCommand != 'D') {
    telemetryEnabled = false;
    lastCommand = 'D';
    RADIO_SERIAL.println("CMD_ECHO:DISCONNECT");
  }

  unsigned long timestamp = millis();

  // ========== PRESSURE & ALTITUDE ==========
  float P = BARO.readPressure();  // hPa
  float rawAltitude = 44330.0 * (1.0 - pow(P / P0, 1.0 / 5.255));

  static bool firstRun = true;
  if (firstRun) {
    altitudeFiltered = rawAltitude;
    firstRun = false;
  }

  // Flight-aware filtering
  if (currentState == ASCENT) {
    altitudeFiltered = rawAltitude;  // No lag during ascent
  } else {
    altitudeFiltered = 0.85 * altitudeFiltered + 0.15 * rawAltitude;
  }

  float altitudeOut = round(altitudeFiltered * 10) / 10.0;
  if (altitudeOut < 0) altitudeOut = 0;

  float pressureOut = round((P * 0.1) * 10) / 10.0;  // hPa → kPa

  // ========== FINITE STATE MACHINE ==========
  float verticalSpeed = altitudeOut - prevAltitude;

  switch (currentState) {
    case LAUNCH_PAD:
      if (verticalSpeed > 0.5) {
        currentState = ASCENT;
      }
      break;

    case ASCENT:
      if (altitudeOut < prevAltitude) {
        apogeeCount++;
      } else {
        apogeeCount = 0;
      }

      if (apogeeCount >= 3) {
        maxAltitude = prevAltitude;
        currentState = APOGEE;
        apogeeCount = 0;
        apogeeDetectedTime = timestamp;

        char buf[120];
        snprintf(buf, sizeof(buf),
          "MISSION_TIME:%s,TIME_MS:%lu,EVENT:APOGEE_DETECTED,MAX_ALTITUDE:%.1f",
          missionTimeStr, timestamp, maxAltitude);
        sendEvent(buf);
      }
      break;

    case APOGEE:
      if (timestamp - apogeeDetectedTime >= 2000) {
        currentState = DESCENT;
      }
      break;

    case DESCENT:
      if (!payloadReleased && maxAltitude > 5.0 && altitudeOut <= 0.8 * maxAltitude) {
        payloadReleased = true;
        currentState = PAYLOAD_RELEASE;

        char buf[120];
        snprintf(buf, sizeof(buf),
          "MISSION_TIME:%s,TIME_MS:%lu,EVENT:PAYLOAD_RELEASED,ALTITUDE:%.1f,MAX_ALTITUDE:%.1f",
          missionTimeStr, timestamp, altitudeOut, maxAltitude);
        sendEvent(buf);
      }
      break;

    case PAYLOAD_RELEASE:
      if (!eggReleased && altitudeOut <= 2.0) {
        eggReleased = true;
        currentState = EGG_RELEASE;

        char buf[120];
        snprintf(buf, sizeof(buf),
          "MISSION_TIME:%s,TIME_MS:%lu,EVENT:EGG_RELEASED,ALTITUDE:%.1f,MAX_ALTITUDE:%.1f",
          missionTimeStr, timestamp, altitudeOut, maxAltitude);
        sendEvent(buf);
      }
      break;

    case EGG_RELEASE:
      if (altitudeOut < 1.0) {
        currentState = LANDED;

        char buf[120];
        snprintf(buf, sizeof(buf),
          "MISSION_TIME:%s,TIME_MS:%lu,EVENT:LANDED,ALTITUDE:%.1f",
          missionTimeStr, timestamp, altitudeOut);
        sendEvent(buf);
      }
      break;

    case LANDED:
      // Mission complete
      break;
  }

  prevAltitude = altitudeOut;

  // ========== TEMPERATURE ==========
  float temperature = HS300x.readTemperature();
  float temperatureOut = round(temperature * 10) / 10.0;

  // ========== IMU (ACCELEROMETER & GYROSCOPE) ==========
  float ax = 0, ay = 0, az = 0;
  float gx = 0, gy = 0, gz = 0;

  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(ax, ay, az);
  }

  if (IMU.gyroscopeAvailable()) {
    IMU.readGyroscope(gx, gy, gz);
  }

  // Convert to m/s² and round
  ax = round(ax * 9.81 * 100) / 100.0;
  ay = round(ay * 9.81 * 100) / 100.0;
  az = round(az * 9.81 * 100) / 100.0;

  // Round gyroscope values
  gx = round(gx * 10) / 10.0;
  gy = round(gy * 10) / 10.0;
  gz = round(gz * 10) / 10.0;

  // ========== GPS CALIBRATION ==========
  if (!gpsCalibrated &&
      currentState == LAUNCH_PAD &&
      gps.altitude.isValid() &&
      gps.satellites.isValid() &&
      gps.satellites.value() >= 6) {
    double gpsAltCal = gps.altitude.meters();
    float Pcal = BARO.readPressure();
    P0 = Pcal / pow(1.0 - (gpsAltCal / 44330.0), 5.255);
    gpsCalibrated = true;
    RADIO_SERIAL.println("EVENT:GPS_BARO_CALIBRATED");
  }

  // ========== GPS DATA ==========
  double gpsLat = 0.0, gpsLon = 0.0, gpsAlt = 0.0;
  int gpsSats = 0;
  bool gpsFix = false;

  if (gps.location.isValid()) {
    gpsLat = gps.location.lat();
    gpsLon = gps.location.lng();
    gpsFix = true;
  }

  if (gps.satellites.isValid()) {
    gpsSats = gps.satellites.value();
  }

  char gpsTimeStr[9] = "NA";

  if (gps.time.isValid()) {
    sprintf(missionTimeStr, "%02d:%02d:%02d",
            gps.time.hour(),
            gps.time.minute(),
            gps.time.second());
    sprintf(gpsTimeStr, "%02d:%02d:%02d",
            gps.time.hour(),
            gps.time.minute(),
            gps.time.second());
  }

  // ========== TELEMETRY TRANSMISSION ==========
  if (telemetryEnabled && timestamp - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = timestamp;
    packetCount++;

    // Frame: $...data...*
    RADIO_SERIAL.print("$");
    RADIO_SERIAL.print(missionTimeStr);      RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(packetCount);         RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(stateToString(currentState)); RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(altitudeOut);         RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(round(rawAltitude * 10) / 10.0); RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(pressureOut);         RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(temperatureOut);      RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(ax);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(ay);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(az);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gx);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gy);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gz);                  RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsLat, 6);           RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsLon, 6);           RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsAlt);              RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsTimeStr);          RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsSats);             RADIO_SERIAL.print(",");
    RADIO_SERIAL.print(gpsFix ? 1 : 0);
    RADIO_SERIAL.println("*");
  }
}
