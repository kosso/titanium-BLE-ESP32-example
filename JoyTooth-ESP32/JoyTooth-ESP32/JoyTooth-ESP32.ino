/*
    Based on Neil Kolban example for IDF: https://github.com/nkolban/esp32-snippets/blob/master/cpp_utils/tests/BLE%20Tests/SampleServer.cpp
    Ported to Arduino ESP32 by Evandro Copercini
    updates by chegewara

    This example by @kosso for use with accompanying Axway Titanium iOS application. 
    
*/
#include <Wire.h>  // Only needed for Arduino 1.6.5 and earlier
#include "SSD1306.h" // alias for `#include "SSD1306Wire.h"

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>


// TTGO ESP32 modile with OLED and 18650 Battery SDA, SCL
SSD1306 display(0x3c, 5, 4);

// Fonts
// See : http://oleddisplay.squix.ch/ for font generation
#include "Lato_Bold_12.h"
#include "Lato_Bold_14.h"
#include "Lato_Bold_10.h"
#include "SansSerif_bold_10.h"

// An image, if needed...
// See: http://www.majer.ch/lcd/adf_bitmap.php
/*
 * via: https://github.com/squix78/esp8266-oled-ssd1306/issues/53
First, design your new 128x64 black and white image in photoshop or whatever... (black pixels will be lit-up on the OLED)
I think that the image size must be a multiple from 8, I'm not sure...
Rotate your image 90 degrees clockwise.
Mirror the full image (in photoshop CS5: image/image rotation/flip canvas horizontal)
Final image should look like top-left is really top-left but your image is rotated 90 degrees and at the same time mirrored.
Save as a lossless format, preferable BMP (you can use Windows or OS format, 1 bit, 8 bit,... all does not matter!)
Upload your new BMP file to https://convertio.co/image-converter/ and convert to image/XBM
Download the result, open it in notepad and copy/past the array into your code … (you can use or ignore PROGMEM)

 */
// #include "img_wifi.h"


// See the following for generating UUIDs:
// https://www.uuidgenerator.net/
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint8_t txValue = 0;
BLEServer *pServer = NULL;
BLECharacteristic * pCharacteristic;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

#define LED_PIN 2

#define DISPLAY_WIDTH 128
#define DISPLAY_HEIGHT 64


float xval = 0;
float yval = 0;
String message = ""; // test
int counter = 0;

String value = "";

char * msg;

void displayValue(float x, float y){
  display.setColor(BLACK);
  display.fillRect(0,30, DISPLAY_WIDTH, 34);
  display.setColor(WHITE);
  display.setFont(ArialMT_Plain_10);
  display.drawString(DISPLAY_WIDTH / 4, 34, "DIRECTION");  
  display.drawString((DISPLAY_WIDTH / 4) * 3, 34, "SPEED"); 
   
  display.setFont(Lato_Bold_14);
  display.drawString(DISPLAY_WIDTH / 4, 46, String(xval));  
  display.drawString((DISPLAY_WIDTH / 4) * 3, 46, String(yval));  
  
  display.display();  
}


void displayConnection(){

  
  if(deviceConnected){
    display.setColor(WHITE);
    display.fillRect(0, 16, DISPLAY_WIDTH, 14);
    display.setColor(BLACK);
    display.setFont(Lato_Bold_12);
    display.drawString(DISPLAY_WIDTH / 2, 16, "APP CONNECTED");
  } else {
    display.setColor(BLACK);
    display.fillRect(0, 16, DISPLAY_WIDTH, 16);
    display.setColor(WHITE);
    // display.drawLine(0, 16, DISPLAY_WIDTH, 16);
    display.setFont(ArialMT_Plain_10);
    display.drawString(DISPLAY_WIDTH / 2, 18, "ready");
    display.setColor(BLACK);
    display.fillRect(0, 30, DISPLAY_WIDTH, 34);
    
  }  
  display.display();
}

// ioS app found : 4FAFC201-1FB5-459E-8FCC-C5C9C331914B
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      value = "";
      Serial.println("BLE client connected");
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      Serial.println("BLE client disconnected");
      deviceConnected = false;
      
    };
};


float  GetValue(String pString){
  char vTempValue[10];
  pString.toCharArray(vTempValue,sizeof(vTempValue));
  return  atof(vTempValue);
}

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();
  
      
      if (rxValue.length() > 0) {
        
        //Serial.println("*********");
        //Serial.print("Received Value: ");
        //for (int i = 0; i < rxValue.length(); i++){
          //Serial.print(rxValue[i]);
        //} 

        // this could probably be done better! :)
        // the recieved string will be "0.00,0.00"" -> "1.00,1.00"
        // So we split the value by the comma and store the floats to display on the OLED screen and for controller a motor, or something...
        
        value = String(rxValue.c_str());
        char buf[sizeof(value)];
        value.toCharArray(buf, sizeof(buf));
        char *p = buf;
        char *str;
        int t = 0;        
        while ((str = strtok_r(p,",",&p)) != NULL){ // delimiter is the semicolon
          //Serial.println(String(t) + " : " + str);
          if(t==0){
             xval = GetValue(String(str));
             //Serial.print("X: " + String(xval));
          } else {
            yval = GetValue(String(str));
            //Serial.println("Y: " + String(yval));
          }
          t++;
        }   
        // Serial.println(String(xval)+" , "+String(yval));
      } else {
        value = "";
      }
    }
};


void setup() {
  Serial.begin(115200);
  Serial.println("JOYTOOTH v0.1");

  Wire.begin(5, 4); // Strart OLED screen
  
  BLEDevice::init("JOYTOOTH");
  //BLEDevice::init("Long name works now");
  pServer = BLEDevice::createServer();
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE |
                                         BLECharacteristic::PROPERTY_WRITE_NR |
                                         BLECharacteristic::PROPERTY_NOTIFY
                                       );

  pCharacteristic->setValue("ready and waiting"); // write
  pCharacteristic->setCallbacks(new MyCallbacks()); // reads
  pServer->setCallbacks(new MyServerCallbacks());// events
  
  pService->start();

  // BLEAdvertising *pAdvertising = pServer->getAdvertising();  // this still is working for backward compatibility
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);

  
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  delay(250);
  
  BLEDevice::startAdvertising();
  Serial.println("BLE Characteristic defined! Waiting for client app connection....");

  delay(250);

  display.init();
  display.flipScreenVertically();
  display.clear();  
  //display.setFont(ArialMT_Plain_10);
  display.setFont(Lato_Bold_14);
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.drawString(DISPLAY_WIDTH / 2, 0, "JOYTOOTH v 0.1");

  display.display();
   
}

void loop() {

  // Update client app connection on screen.
  displayConnection();
   
  if (deviceConnected) {

      // # Test writes to mobile app..
      // pCharacteristic->setValue(&txValue, 1);
      // const char* val = String(counter).c_str();        
      // pCharacteristic->setValue(val);
      // pCharacteristic->setValue(String(counter).c_str());
      // txValue++;
 
      /*
      message = "hello there! " + String(counter);
      pCharacteristic->setValue(message.c_str());
      pCharacteristic->notify();
      Serial.println(message);     
      counter++;
      delay(200); // bluetooth stack will go into congestion, if too many packets are sent
      */

      // Update screen with x,y values
      displayValue(xval, yval);
  }
  
  
}
