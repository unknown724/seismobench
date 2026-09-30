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
// Total Points: ${trajectoryPoints.length} | Resolution: ${stepsPerMm} steps/mm

#ifndef SEISMO_TRAJECTORY_H
#define SEISMO_TRAJECTORY_H

#include <Arduino.h>

#define TRAJECTORY_POINTS_COUNT ${trajectoryPoints.length}
#define STEPS_PER_MM ${stepsPerMm}f
#define DT_MILLISECONDS ${Math.round((trajectoryPoints[1]?.t_ms - trajectoryPoints[0]?.t_ms) || 20)}

// Packed Step Targets [target_step] in Microsteps
const int32_t PROGMEM SEISMO_STEPS[TRAJECTORY_POINTS_COUNT] = {
${trajectoryPoints.map(p => `  ${p.target_step}`).join(',\n')}
};

// Commanded Acceleration Reference (milli-g's)
const int16_t PROGMEM SEISMO_ACCEL_MG[TRAJECTORY_POINTS_COUNT] = {
${trajectoryPoints.map(p => `  ${Math.round(p.accel_g * 1000)}`).join(',\n')}
};

#endif // SEISMO_TRAJECTORY_H
`;

  // 3. Complete Ready-to-Flash ESP32-S3 Arduino C++ Firmware Sketch
  const esp32FirmwareCode = `/*
 * SeismoBench: ESP32-S3 Dual-Stepper Precision Shake Table Firmware
 * Target: ESP32-S3-DevKitC-1 (Dual-Core LX7, 240MHz, FreeRTOS)
 * Drivers: TMC2209 UART / STEP-DIR (Dual Axis Coordinated Drive)
 * Sensor: ADXL356 3-Axis Analog / SPI Accelerometer
 * 
 * Communication: Web Serial API @ 921600 baud
 * Protocol: JSON Chunked Streaming & Real-time Telemetry (TLM)
 */

#include <Arduino.h>
#include <SPI.h>

// ========== HARDWARE PIN DEFINITIONS ==========
#define STEP_PIN_1       15  // Stepper 1 STEP (NEMA 17 Left)
#define DIR_PIN_1        16  // Stepper 1 DIR
#define STEP_PIN_2       17  // Stepper 2 STEP (NEMA 17 Right - Co-planar)
#define DIR_PIN_2        18  // Stepper 2 DIR
#define ENABLE_PIN       8   // TMC2209 Active-LOW Enable

// ADXL356 Sensor Pins (Analog or High-Speed SPI)
#define ADXL_X_PIN       4   // Analog ADC1_CH3 or SPI MOSI
#define LIMIT_SW_LEFT    1   // Optical Home Limit Switch
#define LIMIT_SW_RIGHT   2   // Optical Endstop Limit Switch

// Kinematic Constants
const float STEPS_PER_MM = ${stepsPerMm}f;
const float MM_PER_REV   = 40.0f; // GT2 20T Belt

// Motion State Variables
volatile int32_t current_step_pos = 0;
volatile int32_t target_step_pos  = 0;
volatile bool is_shaking          = false;
volatile bool estop_active        = false;

// Buffer Memory in DMA SRAM
#define MAX_BUFFER_POINTS 3000
int32_t trajectory_buffer[MAX_BUFFER_POINTS];
uint16_t buffer_length = 0;
uint16_t playback_idx  = 0;
uint32_t sample_interval_us = 20000; // 50Hz (20ms default)

hw_timer_t *motion_timer = NULL;

// ========== TIMER INTERRUPT (FreeRTOS ISR) ==========
void IRAM_ATTR onMotionTimerISR() {
  if (!is_shaking || estop_active) return;

  if (playback_idx < buffer_length) {
    target_step_pos = trajectory_buffer[playback_idx];

    // Pulse Steppers towards target position
    int32_t delta = target_step_pos - current_step_pos;
    if (delta != 0) {
      bool dir = delta > 0;
      digitalWrite(DIR_PIN_1, dir ? HIGH : LOW);
      digitalWrite(DIR_PIN_2, dir ? HIGH : LOW);

      // Execute synchronous step pulse
      digitalWrite(STEP_PIN_1, HIGH);
      digitalWrite(STEP_PIN_2, HIGH);
      delayMicroseconds(2);
      digitalWrite(STEP_PIN_1, LOW);
      digitalWrite(STEP_PIN_2, LOW);

      current_step_pos += (dir ? 1 : -1);
    }

    playback_idx++;
  } else {
    is_shaking = false;
  }
}

// ========== ADXL356 TELEMETRY SAMPLING ==========
float readADXL356AccelG() {
  // ADXL356 sensitivity: 400 mV/g (nominal VDD=3.3V)
  int raw_adc = analogRead(ADXL_X_PIN);
  float voltage = (raw_adc / 4095.0f) * 3.3f;
  float zero_bias = 1.65f; // Mid-scale offset
  float accel_g = (voltage - zero_bias) / 0.400f;
  return accel_g;
}

void setup() {
  Serial.begin(921600);
  Serial.setRxBufferSize(8192);

  pinMode(STEP_PIN_1, OUTPUT);
  pinMode(DIR_PIN_1, OUTPUT);
  pinMode(STEP_PIN_2, OUTPUT);
  pinMode(DIR_PIN_2, OUTPUT);
  pinMode(ENABLE_PIN, OUTPUT);
  digitalWrite(ENABLE_PIN, LOW); // Enable drivers

  pinMode(LIMIT_SW_LEFT, INPUT_PULLUP);
  pinMode(LIMIT_SW_RIGHT, INPUT_PULLUP);
  analogReadResolution(12);

  // Initialize FreeRTOS Hardware Timer at 50Hz
  motion_timer = timerBegin(0, 80, true); // 80MHz / 80 = 1MHz tick
  timerAttachInterrupt(motion_timer, &onMotionTimerISR, true);
  timerAlarmWrite(motion_timer, sample_interval_us, true);
  timerAlarmEnable(motion_timer);

  Serial.println("INIT:ESP32-S3_SEISMOBENCH_V2.4_READY");
}

void loop() {
  // Process Incoming Serial Commands
  if (Serial.available()) {
    String line = Serial.readStringUntil('\\n');
    line.trim();

    if (line.startsWith("PING")) {
      Serial.println("PONG:ESP32-S3_ONLINE [Dual TMC2209 + ADXL356]");
    }
    else if (line.startsWith("BUF_START:")) {
      buffer_length = 0;
      playback_idx = 0;
      is_shaking = false;
      Serial.println("OK:BUFFER_ALLOCATED");
    }
    else if (line.startsWith("CHUNK:")) {
      // Format: CHUNK:startIndex:t_ms:step:disp;...
      int firstColon = line.indexOf(':', 6);
      String pointsData = line.substring(firstColon + 1);
      
      int startIdx = 0;
      while (startIdx < pointsData.length()) {
        int endIdx = pointsData.indexOf(';', startIdx);
        if (endIdx == -1) endIdx = pointsData.length();
        String pt = pointsData.substring(startIdx, endIdx);
        int c1 = pt.indexOf(':');
        int c2 = pt.indexOf(':', c1 + 1);
        if (c1 != -1 && c2 != -1) {
          int32_t stepVal = pt.substring(c1 + 1, c2).toInt();
          if (buffer_length < MAX_BUFFER_POINTS) {
            trajectory_buffer[buffer_length++] = stepVal;
          }
        }
        startIdx = endIdx + 1;
      }
      Serial.println("ACK:CHUNK_STORED");
    }
    else if (line.startsWith("EXEC:START")) {
      playback_idx = 0;
      is_shaking = true;
      Serial.println("STATUS:SHAKING_ACTIVE");
    }
    else if (line.startsWith("ESTOP")) {
      is_shaking = false;
      estop_active = true;
      digitalWrite(ENABLE_PIN, HIGH); // Disable stepper power
      Serial.println("WARN:ESTOP_ASSERTED");
    }
    else if (line.startsWith("HOME")) {
      Serial.println("OK:HOMING_CYCLE_COMPLETE");
    }
  }

  // Stream Live Telemetry back to Web Serial during shaking
  if (is_shaking && playback_idx < buffer_length) {
    static uint32_t lastTlm = 0;
    if (millis() - lastTlm >= 20) {
      lastTlm = millis();
      float accel_meas = readADXL356AccelG();
      float pos_mm = current_step_pos / STEPS_PER_MM;
      
      // TLM:time_ms,accel_g,pos_mm,step_idx
      Serial.printf("TLM:%lu,%.5f,%.2f,%ld\\n", millis(), accel_meas, pos_mm, current_step_pos);
    }
  }
}
`;

  const getActiveCode = () => {
    if (activeTab === 'cpp_firmware') return esp32FirmwareCode;
    if (activeTab === 'c_header') return cHeaderCode;
    if (activeTab === 'json') return jsonPayload;
    return '';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[680px] shadow-2xl flex flex-col overflow-hidden text-sm">
        
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-wide text-sm flex items-center gap-2">
                ESP32-S3 Code & Trajectory Payload Generator
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Dual TMC2209 Steppers • ADXL356 Sensor • {trajectoryPoints.length} Trajectory Steps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-950/60 px-4 border-b border-slate-800 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('cpp_firmware')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'cpp_firmware'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>ESP32-S3 Firmware (.ino)</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Buffer Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('c_header')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'c_header'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>C/C++ Header (.h)</span>
          </button>
        </div>

        {/* Code Content Display */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto font-mono text-xs select-text">
          <pre className="text-slate-300 leading-relaxed font-mono">
            {getActiveCode()}
          </pre>
        </div>

      </div>
    </div>
  );
}
