// barometric pressure sensor (LPS22HB) -> done
// a temperature/humidity sensor (HTS221)
// a 9-axis IMU accelerometer, gyro

// pressure -> done
// altitude -> done
// Temperature
// Accelerometer (R,P,Y) -> done
// Gyro (R,P,Y) -> done

// IMU
// float yaw = 0;   // raw integrated yaw
// const float dt = 1.0; // seconds (loop delay)

// RAW Roll & Pitch (degrees)
// float roll  = atan2(ay, az) * 180.0 / PI;
// float pitch = atan2(-ax, sqrt(ay*ay + az*az)) * 180.0 / PI;

// // RAW Yaw (gyro integrated)
// yaw += gz * dt;

// barometric pressure sensor (LPS22HB) -> done
// temperature/humidity sensor (HS300x)
// 9-axis IMU accelerometer, gyro

#include <Arduino_LPS22HB.h>
#include <Arduino_HS300x.h>
#include <Arduino_BMI270_BMM150.h>
#include <math.h>
#include <TinyGPSPlus.h>
#define DEBUG_SERIAL Serial
#define RADIO_SERIAL Serial2
/* ================= FSM ================= */
enum State
{
  LAUNCH_PAD,
  ASCENT,
  APOGEE,
  DESCENT,
  PAYLOAD_RELEASE,
  EGG_RELEASE,
  LANDED
};

const unsigned long TELEMETRY_INTERVAL_MS = 1000; // 1 Hz
unsigned long lastTelemetryTime = 0;
State currentState = LAUNCH_PAD;
// State lastState    = LAUNCH_PAD;
TinyGPSPlus gps;
char missionTimeStr[9] = "NA";

/* ================= BAROMETER ================= */
float P0;
float altitudeFiltered = 0;
float prevAltitude = 0;
float maxAltitude = 0;

int apogeeCount = 0;
bool payloadReleased = false;
bool eggReleased = false;

unsigned long packetCount = 0;
bool telemetryEnabled = false;
char lastCommand = '\0';

char readCommandFromAny() {
  if (Serial.available()) {
    return Serial.read();      // USB
  }
  if (Serial2.available()) {
    return Serial2.read();     // XBee
  }
  return '\0';
}

void sendEvent(const char* msg) {
  DEBUG_SERIAL.println(msg);
  RADIO_SERIAL.println(msg);
}

void setup()
{

  Serial.begin(115200);
  while (!Serial)
    ;

  Serial1.begin(9600); // gps
  Serial2.begin(9600);  // xbee

      if (!BARO.begin())
  {
    Serial.println("ERROR: LPS22HB init failed");
    while (1)
      ;
  }

  if (!HS300x.begin())
  {
    Serial.println("ERROR: HS300x init failed");
    while (1)
      ;
  }

  if (!IMU.begin())
  {
    Serial.println("ERROR: IMU init failed");
    while (1)
      ;
  }

  delay(2000);

  // ---- Ground pressure averaging ----
  float sum = 0;
  for (int i = 0; i < 50; i++)
  {
    sum += BARO.readPressure();
    delay(20);
  }
  P0 = sum / 50.0;

  Serial.println(
      "MISSION_TIME,PACKET,STATE,ALTITUDE_M,RAW_ALTITUDE_M,PRESSURE_KPA,TEMP_C,"
      "ACCEL_R,ACCEL_P,ACCEL_Y,GYRO_R,GYRO_P,GYRO_Y,"
      "GPS_LAT,GPS_LON,GPS_ALT,GPS_TIME_UTC,GPS_SATS,GPS_FIX");

  Serial.println("TIME_MS: 0, STATE: LAUNCH_PAD");
}

const char *stateToString(State s)
{
  switch (s)
  {
  case LAUNCH_PAD:
    return "LAUNCH_PAD";
  case ASCENT:
    return "ASCENT";
  case APOGEE:
    return "APOGEE";
  case DESCENT:
    return "DESCENT";
  case PAYLOAD_RELEASE:
    return "PAYLOAD_RELEASE";
  case EGG_RELEASE:
    return "EGG_RELEASE";
  case LANDED:
    return "LANDED";
  default:
    return "UNKNOWN";
  }
}

void loop()
{
while (Serial1.available())
  {
    gps.encode(Serial1.read());
  }
char cmd = readCommandFromAny();
if (cmd == '\n' || cmd == '\r') cmd = '\0';

if (cmd == 'C' && lastCommand != 'C')
{
  telemetryEnabled = true;
  lastCommand = 'C';

  Serial.println("CMD_ECHO:CONNECT");
  Serial2.println("CMD_ECHO:CONNECT");
}

if (cmd == 'D' && lastCommand != 'D' && currentState == LAUNCH_PAD)
{
  telemetryEnabled = false;
  lastCommand = 'D';

  Serial.println("CMD_ECHO:DISCONNECT");
  Serial2.println("CMD_ECHO:DISCONNECT");
}

  unsigned long timestamp = millis();

  /* ---------- PRESSURE & ALTITUDE ---------- */
  float P = BARO.readPressure(); // hPa

  float rawAltitude =
      44330.0 * (1.0 - pow(P / P0, 1.0 / 5.255));

  static bool firstRun = true;
  if (firstRun)
  {
    altitudeFiltered = rawAltitude;
    firstRun = false;
  }

  altitudeFiltered = 0.7 * altitudeFiltered + 0.3 * rawAltitude;
  float altitudeOut = round(altitudeFiltered * 10) / 10.0;
  if (altitudeOut < 0)
    altitudeOut = 0;

  float pressureOut = round((P * 0.1) * 10) / 10.0; // hPa → kPa

  /* ---------- FSM ---------- */
  switch (currentState)
  {

  case LAUNCH_PAD:
    if (altitudeOut > 2.0)
      currentState = ASCENT;
    break;

  case ASCENT:
    if (altitudeOut < prevAltitude)
      apogeeCount++;
    else
      apogeeCount = 0;

    if (apogeeCount >= 3)
    {
      maxAltitude = prevAltitude;
      currentState = APOGEE;
      apogeeCount = 0;

      char buf[120];
snprintf(buf, sizeof(buf),
         "MISSION_TIME:%s,TIME_MS:%lu,EVENT:APOGEE_DETECTED,MAX_ALTITUDE:%.1f",
         missionTimeStr, timestamp, maxAltitude);
sendEvent(buf);


    }
    break;

  case APOGEE:
    currentState = DESCENT;
    break;

  case DESCENT:
    if (!payloadReleased && maxAltitude > 5.0 &&
        altitudeOut <= 0.8 * maxAltitude)
    {

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
    if (!eggReleased && altitudeOut <= 2.0)
    {
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
    if (altitudeOut < 1.0)
    {
      currentState = LANDED;

      char buf[120];
snprintf(buf, sizeof(buf),
         "MISSION_TIME:%s,TIME_MS:%lu,EVENT:LANDED,ALTITUDE:%.1f",
         missionTimeStr, timestamp, altitudeOut);
sendEvent(buf);

    }
    break;

  case LANDED:
    // Already logged during transition from EGG_RELEASE
    break;
  }

  prevAltitude = altitudeOut;

  /* ---------- TEMPERATURE ---------- */
  float temperature = HS300x.readTemperature();
  float temperatureOut = round(temperature * 10) / 10.0;

  /* ---------- IMU ---------- */
  float ax = 0, ay = 0, az = 0;
  float gx = 0, gy = 0, gz = 0;

  if (IMU.accelerationAvailable())
    IMU.readAcceleration(ax, ay, az);

  if (IMU.gyroscopeAvailable())
    IMU.readGyroscope(gx, gy, gz);

  ax = round(ax * 9.81 * 100) / 100.0;
  ay = round(ay * 9.81 * 100) / 100.0;
  az = round(az * 9.81 * 100) / 100.0;

  gx = round(gx * 10) / 10.0;
  gy = round(gy * 10) / 10.0;
  gz = round(gz * 10) / 10.0;

  double gpsLat = 0.0, gpsLon = 0.0, gpsAlt = 0.0;
  int gpsSats = 0;
  bool gpsFix = false;

  if (gps.location.isValid())
  {
    gpsLat = gps.location.lat();
    gpsLon = gps.location.lng();
    gpsFix = true;
  }

  if (gps.altitude.isValid())
  {
    gpsAlt = gps.altitude.meters();
  }

  if (gps.satellites.isValid())
  {
    gpsSats = gps.satellites.value();
  }

  char gpsTimeStr[9] = "NA";

  if (gps.time.isValid())
  {
    sprintf(gpsTimeStr, "%02d:%02d:%02d",
            gps.time.hour(),
            gps.time.minute(),
            gps.time.second());

    strcpy(missionTimeStr, gpsTimeStr);
  } else{
      strcpy(missionTimeStr, "NA");

  }

  /* ---------- STATE LOG ---------- */
  // if (currentState != lastState) {
  //   Serial.print("TIME_MS: ");
  //   Serial.print(timestamp);
  //   Serial.print(", STATE: ");

  //   switch (currentState) {
  //     case LAUNCH_PAD:      Serial.println("LAUNCH_PAD"); break;
  //     case ASCENT:          Serial.println("ASCENT"); break;
  //     case APOGEE:          Serial.println("APOGEE"); break;
  //     case DESCENT:         Serial.println("DESCENT"); break;
  //     case PAYLOAD_RELEASE: Serial.println("PAYLOAD_RELEASE"); break;
  //     case EGG_RELEASE:     Serial.println("EGG_RELEASE"); break;
  //     case LANDED:          Serial.println("LANDED"); break;
  //   }
  //   lastState = currentState;
  // }

  if (telemetryEnabled &&
      timestamp - lastTelemetryTime >= TELEMETRY_INTERVAL_MS)
  {

    lastTelemetryTime = timestamp;

    packetCount++;

    /* ---------- TELEMETRY ---------- */
    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", ALTITUDE: "); Serial.print(altitudeOut); Serial.println(" m");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", PRESSURE: "); Serial.print(pressureOut); Serial.println(" kPa");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", TEMPERATURE: "); Serial.print(temperatureOut); Serial.println(" C");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", ACCEL_R: "); Serial.print(ax); Serial.println(" m/s^2");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", ACCEL_P: "); Serial.print(ay); Serial.println(" m/s^2");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", ACCEL_Y: "); Serial.print(az); Serial.println(" m/s^2");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", GYRO_R: "); Serial.print(gx); Serial.println(" deg/s");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", GYRO_P: "); Serial.print(gy); Serial.println(" deg/s");

    // Serial.print("TIME_MS: "); Serial.print(timestamp);
    // Serial.print(", GYRO_Y: "); Serial.print(gz); Serial.println(" deg/s");

    // Serial.println("--------------------------------");
    // Serial.print(timestamp); Serial.print(",");
    DEBUG_SERIAL.print("$");
    RADIO_SERIAL.print("$");

    DEBUG_SERIAL.print(missionTimeStr);
    RADIO_SERIAL.print(missionTimeStr);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(packetCount);
    RADIO_SERIAL.print(packetCount);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(stateToString(currentState));
    RADIO_SERIAL.print(stateToString(currentState));

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(altitudeOut);
    RADIO_SERIAL.print(altitudeOut);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(round(rawAltitude * 10) / 10.0);
    RADIO_SERIAL.print(round(rawAltitude * 10) / 10.0);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(pressureOut);
    RADIO_SERIAL.print(pressureOut);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(temperatureOut);
    RADIO_SERIAL.print(temperatureOut);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(ax);
    RADIO_SERIAL.print(ax);
    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");
    DEBUG_SERIAL.print(ay);
    RADIO_SERIAL.print(ay);
    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");
    DEBUG_SERIAL.print(az);
    RADIO_SERIAL.print(az);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gx);
    RADIO_SERIAL.print(gx);
    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");
    DEBUG_SERIAL.print(gy);
    RADIO_SERIAL.print(gy);
    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");
    DEBUG_SERIAL.print(gz);
    RADIO_SERIAL.print(gz);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsLat, 6);
    RADIO_SERIAL.print(gpsLat, 6);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsLon, 6);
    RADIO_SERIAL.print(gpsLon, 6);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsAlt);
    RADIO_SERIAL.print(gpsAlt);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsTimeStr);
    RADIO_SERIAL.print(gpsTimeStr);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsSats);
    RADIO_SERIAL.print(gpsSats);

    DEBUG_SERIAL.print(",");
    RADIO_SERIAL.print(",");

    DEBUG_SERIAL.print(gpsFix ? 1 : 0);
    RADIO_SERIAL.print(gpsFix ? 1 : 0);

    DEBUG_SERIAL.println("*");
    RADIO_SERIAL.println("*");
  }
}