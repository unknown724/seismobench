import React, { useState } from 'react';
import { 
  Code, 
  X, 
  Copy, 
  Check, 
  Download, 
  FileJson, 
  FileCode, 
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
  const [activeTab, setActiveTab] = useState('cpp_firmware'); // 'json' | 'cpp_firmware' | 'c_header'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

// TMC2209 Pins (X1 & X2)
#define PIN_STEP_L     15
#define PIN_DIR_L      16
#define PIN_EN_L       17
#define PIN_STEP_R     18
#define PIN_DIR_R      19
#define PIN_EN_R       21

// ADXL356 Analog Pins
#define PIN_ADXL_X     4

const float STEPS_PER_MM = ${stepsPerMm}f;
const uint32_t SERIAL_BAUD = 921600;

volatile int32_t currentStepPos = 0;
volatile int32_t targetStepPos = 0;
volatile bool isRunning = false;

void setup() {
  Serial.begin(SERIAL_BAUD);
  pinMode(PIN_STEP_L, OUTPUT);
  pinMode(PIN_DIR_L, OUTPUT);
  pinMode(PIN_EN_L, OUTPUT);
  pinMode(PIN_STEP_R, OUTPUT);
  pinMode(PIN_DIR_R, OUTPUT);
  pinMode(PIN_EN_R, OUTPUT);

  digitalWrite(PIN_EN_L, LOW);
  digitalWrite(PIN_EN_R, LOW);
  analogReadResolution(12);

  Serial.println("{\\"type\\":\\"STATUS\\",\\"state\\":\\"IDLE\\",\\"device\\":\\"ESP32-S3\\"}");
}

void loop() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\\n');
    input.trim();
    if (input.indexOf("PING") >= 0) {
      Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"PONG\\"}");
    } else if (input.indexOf("HOME") >= 0) {
      currentStepPos = 0;
      targetStepPos = 0;
      Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"HOMED\\"}");
    } else if (input.indexOf("ESTOP") >= 0) {
      isRunning = false;
      digitalWrite(PIN_EN_L, HIGH);
      digitalWrite(PIN_EN_R, HIGH);
      Serial.println("{\\"type\\":\\"ACK\\",\\"reply\\":\\"EMERGENCY_STOPPED\\"}");
    }
  }
}
`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'json': return jsonPayload;
      case 'cpp_firmware': return esp32FirmwareCode;
      case 'c_header': return cHeaderCode;
      default: return jsonPayload;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 font-space"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[680px] rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0E0E10] shadow-2xl flex flex-col text-xs"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-[#121214]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921]" />
            <div>
              <h3 className="font-ndot font-bold text-sm tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                ESP32-S3 FIRMWARE & PAYLOAD GENERATOR
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                DUAL TMC2209 • ADXL356 SENSOR • {trajectoryPoints.length} TRAJECTORY STEPS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#D71921]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D71921] text-white text-xs font-bold hover:bg-[#b5141b] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1 bg-neutral-100 dark:bg-[#141416] text-xs">
          <button
            onClick={() => setActiveTab('cpp_firmware')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cpp_firmware'
                ? 'border-[#D71921] text-[#D71921] font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>FIRMWARE (.INO)</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'border-[#D71921] text-[#D71921] font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON BUFFER</span>
          </button>

          <button
            onClick={() => setActiveTab('c_header')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'c_header'
                ? 'border-[#D71921] text-[#D71921] font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>C/C++ HEADER (.H)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 bg-[#060608] p-4 overflow-y-auto font-mono text-xs select-text">
          <pre className="text-neutral-300 leading-relaxed font-mono">
            {getActiveCode()}
          </pre>
        </div>

      </div>
    </div>
  );
}
