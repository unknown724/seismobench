import React, { useState } from 'react';
import { 
  Code, 
  X, 
  Copy, 
  Check, 
  Download, 
  FileJson, 
  FileCode, 
  FileText,
  Layers,
  Cpu
} from 'lucide-react';

export function PayloadGeneratorModal({
  isOpen,
  onClose,
  timeArray = [],
  dispArray = [],
  accelArray = [],
  stepsPerMm = 80.0,
  waveformMeta = {}
}) {
  const [activeTab, setActiveTab] = useState('cpp_firmware'); // 'json' | 'cpp_firmware' | 'c_header' | 'csv'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate Trajectory Points: [ { t_ms, target_step, disp_mm, accel_g }, ... ]
  const trajectoryPoints = timeArray.map((t, i) => {
    const disp = dispArray[i] || 0;
    const targetStep = Math.round(disp * stepsPerMm);
    return {
      t_ms: Math.round(t * 1000),
      target_step: targetStep,
      disp_mm: Number(disp.toFixed(3)),
      accel_g: Number((accelArray[i] || 0).toFixed(4))
    };
  });

  // 1. JSON Payload format
  const jsonPayload = JSON.stringify(
    {
      meta: {
        name: waveformMeta.name || 'Seismic Waveform',
        steps_per_mm: stepsPerMm,
        point_count: trajectoryPoints.length,
        dt_ms: Math.round((trajectoryPoints[1]?.t_ms - trajectoryPoints[0]?.t_ms) || 20),
        duration_s: Number((timeArray[timeArray.length - 1] || 0).toFixed(2))
      },
      points: trajectoryPoints
    },
    null,
    2
  );

  // 2. C/C++ Header PROGMEM format
  const cHeaderCode = `// SeismoBench Trajectory Header for ESP32-S3
// Generated automatically: ${new Date().toISOString()}
// Waveform: ${waveformMeta.name || 'Seismic Waveform'}
// Steps/mm: ${stepsPerMm} | Points: ${trajectoryPoints.length}

#ifndef SEISMOBENCH_TRAJECTORY_H
#define SEISMOBENCH_TRAJECTORY_H

#include <Arduino.h>

struct TrajectoryStep {
  uint32_t t_ms;
  int32_t target_step;
  float disp_mm;
  float accel_g;
};

const uint16_t TRAJECTORY_COUNT = ${trajectoryPoints.length};

const TrajectoryStep SEISMIC_TRAJECTORY[TRAJECTORY_COUNT] PROGMEM = {
${trajectoryPoints.slice(0, 150).map(p => `  { ${p.t_ms}, ${p.target_step}, ${p.disp_mm}f, ${p.accel_g}f }`).join(',\n')}${trajectoryPoints.length > 150 ? `,\n  // ... ${trajectoryPoints.length - 150} points truncated for header preview` : ''}
};

#endif // SEISMOBENCH_TRAJECTORY_H
`;

  // 3. Complete ESP32-S3 C++ Arduino / ESP-IDF Firmware
  const esp32FirmwareCode = `/**
 * ============================================================================
 * SeismoBench ESP32-S3 Precision Dual-Stepper Shake Table Controller
 * Target Hardware: ESP32-S3 DevKit-C (Dual-Core LX7 @ 240MHz)
 * Motor Drivers: Dual TMC2209 Stepper Drivers (UART or Step/Dir mode)
 * Sensor: Analog Devices ADXL356 3-Axis Analog Accelerometer
 * ============================================================================
 */

#include <Arduino.h>
#include <ArduinoJson.h>

// --- PIN DEFINITIONS ---
// TMC2209 Motor Left (X1)
#define PIN_STEP_L     15
#define PIN_DIR_L      16
#define PIN_EN_L       17

// TMC2209 Motor Right (X2 - Dual Synced)
#define PIN_STEP_R     18
#define PIN_DIR_R      19
#define PIN_EN_R       21

// ADXL356 Accelerometer Analog Inputs (Low Noise)
#define PIN_ADXL_X     4   // ADC1_CH3
#define PIN_ADXL_Y     5   // ADC1_CH4
#define PIN_ADXL_Z     6   // ADC1_CH5

// Optical Endstops / Limits
#define PIN_LIMIT_MIN  7
#define PIN_LIMIT_MAX  8

// --- CONFIGURATION PARAMETERS ---
const float STEPS_PER_MM = ${stepsPerMm}f;
const uint32_t SERIAL_BAUD = 921600;

// Dual Stepper Position Tracking
volatile int32_t currentStepPos = 0;
volatile int32_t targetStepPos = 0;
volatile bool isRunning = false;
volatile bool isHomed = false;

// Task handles
TaskHandle_t hStepMotorTask;
TaskHandle_t hTelemetryTask;

// --- STEPPER HARDWARE TIMER ISR (HIGH FREQUENCY) ---
void IRAM_ATTR onStepTimer() {
  if (!isRunning) return;

  if (currentStepPos < targetStepPos) {
    digitalWrite(PIN_DIR_L, HIGH);
    digitalWrite(PIN_DIR_R, HIGH);
    digitalWrite(PIN_STEP_L, HIGH);
    digitalWrite(PIN_STEP_R, HIGH);
    delayMicroseconds(2);
    digitalWrite(PIN_STEP_L, LOW);
    digitalWrite(PIN_STEP_R, LOW);
    currentStepPos++;
  } else if (currentStepPos > targetStepPos) {
    digitalWrite(PIN_DIR_L, LOW);
    digitalWrite(PIN_DIR_R, LOW);
    digitalWrite(PIN_STEP_L, HIGH);
    digitalWrite(PIN_STEP_R, HIGH);
    delayMicroseconds(2);
    digitalWrite(PIN_STEP_L, LOW);
    digitalWrite(PIN_STEP_R, LOW);
    currentStepPos--;
  }
}

// --- CORE 1: FAST TELEMETRY & ADXL356 SAMPLING ---
void TelemetryTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(20); // 50 Hz (20ms interval)

  for (;;) {
    vTaskDelayUntil(&xLastWakeTime, xFrequency);

    if (isRunning) {
      // 12-bit ADC reading on ESP32-S3 (0-4095, 3.3V)
      // ADXL356 sensitivity: 80 mV/g (±10g range)
      int rawX = analogRead(PIN_ADXL_X);
      float vX = (rawX / 4095.0f) * 3.3f;
      float accelG = (vX - 1.65f) / 0.080f; // Zero-bias at 1.65V

      float currentDispMm = (float)currentStepPos / STEPS_PER_MM;

      // Stream high-speed JSON packet to Web Serial
      Serial.printf("{\\"type\\":\\"TELEMETRY\\",\\"time\\":%lu,\\"accel\\":%.4f,\\"disp\\":%.3f}\\n",
        millis(), accelG, currentDispMm);
    }
  }
}

// --- SETUP & HARDWARE INITIALIZATION ---
void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial && millis() < 3000);

  // Stepper Pins
  pinMode(PIN_STEP_L, OUTPUT);
  pinMode(PIN_DIR_L, OUTPUT);
  pinMode(PIN_EN_L, OUTPUT);
  pinMode(PIN_STEP_R, OUTPUT);
  pinMode(PIN_DIR_R, OUTPUT);
  pinMode(PIN_EN_R, OUTPUT);

  // Active-Low Driver Enable
  digitalWrite(PIN_EN_L, LOW);
  digitalWrite(PIN_EN_R, LOW);

  // ADC Sensor Pins
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full-scale ~3.1V

  // Spawn RTOS Telemetry Task on Core 1
  xTaskCreatePinnedToCore(
    TelemetryTask,
    "TelemetryTask",
    4096,
    NULL,
    2,
    &hTelemetryTask,
    1
  );

  Serial.println("{\\"type\\":\\"STATUS\\",\\"state\\":\\"IDLE\\",\\"device\\":\\"ESP32-S3\\"}");
}

// --- MAIN PARSER LOOP (WEB SERIAL INTERFACE) ---
void loop() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\\n');
    input.trim();

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, input);

    if (!err) {
      const char* cmd = doc["cmd"];

      if (strcmp(cmd, "PING") == 0) {
        Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"PONG\\"}");
      } 
      else if (strcmp(cmd, "HOME") == 0) {
        currentStepPos = 0;
        targetStepPos = 0;
        isHomed = true;
        Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"HOMED\\"}");
      }
      else if (strcmp(cmd, "SHAKE") == 0) {
        isRunning = true;
        Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"SHAKE_STARTED\\"}");
      }
      else if (strcmp(cmd, "ESTOP") == 0) {
        isRunning = false;
        digitalWrite(PIN_EN_L, HIGH); // Disable drivers
        digitalWrite(PIN_EN_R, HIGH);
        Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"EMERGENCY_STOPPED\\"}");
      }
    }
  }
}
`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'json':
        return jsonPayload;
      case 'cpp_firmware':
        return esp32FirmwareCode;
      case 'c_header':
        return cHeaderCode;
      default:
        return jsonPayload;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCode();
    const ext = activeTab === 'cpp_firmware' ? 'ino' : (activeTab === 'c_header' ? 'h' : 'json');
    const filename = `seismobench_${activeTab}_${Date.now()}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[680px] rounded-3xl overflow-hidden backdrop-blur-3xl bg-white/95 dark:bg-[#161B22]/95 border border-black/10 dark:border-white/10 shadow-2xl flex flex-col text-sm"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-neutral-100/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight text-sm flex items-center gap-2">
                ESP32-S3 Code & Trajectory Payload Generator
              </h3>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                Dual TMC2209 Steppers • ADXL356 Sensor • {trajectoryPoints.length} Trajectory Steps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200/60 dark:bg-white/[0.06] hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0071E3] dark:bg-[#0A84FF] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-neutral-100/60 dark:bg-white/[0.02] px-6 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('cpp_firmware')}
            className={`flex items-center gap-1.5 px-4 py-3 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cpp_firmware'
                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>ESP32-S3 Firmware (.ino)</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-4 py-3 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Buffer Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('c_header')}
            className={`flex items-center gap-1.5 px-4 py-3 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'c_header'
                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>C/C++ Header (.h)</span>
          </button>
        </div>

        {/* Code Content Display */}
        <div className="flex-1 bg-neutral-900 dark:bg-[#0B0E14] p-5 overflow-y-auto font-mono text-xs select-text">
          <pre className="text-neutral-200 leading-relaxed font-mono">
            {getActiveCode()}
          </pre>
        </div>

      </div>
    </div>
  );
}
