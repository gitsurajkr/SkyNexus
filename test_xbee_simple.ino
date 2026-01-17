// Ultra simple XBee test - NO sensors, NO GPS
// Just Arduino sending messages via Serial (XBee on TX/RX pins)

int counter = 0;

void setup() {
  // Initialize built-in LED for visual feedback
  pinMode(LED_BUILTIN, OUTPUT);
  
  // Serial = XBee on TX/RX pins
  Serial.begin(9600);
  
  // Wait for XBee to initialize
  delay(3000);
  
  // Blink LED to show we started
  for(int i = 0; i < 5; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(200);
    digitalWrite(LED_BUILTIN, LOW);
    delay(200);
  }
  
  Serial.println("=== ARDUINO XBEE TEST ===");
  Serial.println("Starting transmission...");
}

void loop() {
  // Send simple message
  Serial.print("Message #");
  Serial.println(counter);
  
  // Blink LED each time we send
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
  
  counter++;
  
  // Send every 2 seconds
  delay(2000);
}
