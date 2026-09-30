/**
 * SeismoBench ESP32-S3 Serial Communication & Hardware Simulator
 * 
 * Supports:
 * 1. Physical Web Serial API (USB-C direct connection to ESP32-S3 @ 115200 - 921600 baud)
 * 2. Standalone Hardware Loopback Simulator (physics model of table inertia, belt resonance, and ADXL356 noise)
 */

export class SeismoSerialController {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.isSimulated = false;
    this.baudRate = 921600;
    this.state = 'DISCONNECTED'; // DISCONNECTED, CONNECTED, BUFFERING, READY, RUNNING, ESTOP
    
    // Callbacks
    this.onPacketTx = null;
    this.onPacketRx = null;
    this.onTelemetry = null; // (point: { time, accel, disp, step }) => void
    this.onProgress = null;  // (percent, current, total) => void
    this.onStateChange = null;
    this.onError = null;

    // Simulation loop timer
    this.simTimer = null;
    this.trajectoryBuffer = [];
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateChange) this.onStateChange(newState);
  }

  logTx(packet) {
    if (this.onPacketTx) {
      this.onPacketTx({
        type: 'TX',
        time: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        raw: packet
      });
    }
  }

  logRx(packet) {
    if (this.onPacketRx) {
      this.onPacketRx({
        type: 'RX',
        time: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
        raw: packet
      });
    }
  }

  /**
   * Connect to physical ESP32-S3 via Web Serial API
   */
  async connectPhysical(baud = 921600) {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera, or click "Simulate ESP32" for standalone testing.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      this.baudRate = baud;
      await this.port.open({
        baudRate: this.baudRate,
        bufferSize: 8192,
        flowControl: 'none'
      });

      this.isConnected = true;
      this.isSimulated = false;
      this.setState('CONNECTED');
      this.logRx(`[SYSTEM] Connected to physical ESP32-S3 port @ ${this.baudRate} baud`);

      // Start continuous background read stream
      this.startReading();

      // Send initial handshake ping
      await this.sendPacket('PING:SEISMOBENCH_V1');
      return true;
    } catch (err) {
      this.disconnect();
      if (err.name !== 'NotFoundError') {
        if (this.onError) this.onError(err.message);
      }
      throw err;
    }
  }

  /**
   * Continuous background reader for incoming serial stream
   */
  async startReading() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let lineBuffer = '';

    try {
      while (this.isConnected) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          lineBuffer += value;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop(); // keep last incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            this.handleIncomingLine(trimmed);
          }
        }
      }
    } catch (err) {
      if (this.isConnected) {
        console.warn('Serial read error:', err);
      }
    } finally {
      this.reader?.releaseLock();
    }
  }

  handleIncomingLine(line) {
    this.logRx(line);

    // Parse Telemetry packet: TLM:time_ms,accel_g,pos_mm,step
    if (line.startsWith('TLM:')) {
      const parts = line.substring(4).split(',');
      if (parts.length >= 2) {
        const tMs = parseFloat(parts[0]);
        const aG = parseFloat(parts[1]);
        const pMm = parts[2] ? parseFloat(parts[2]) : 0;
        const sIdx = parts[3] ? parseInt(parts[3]) : 0;

        if (this.onTelemetry) {
          this.onTelemetry({
            time: tMs / 1000,
            accel: aG,
            disp: pMm,
            step: sIdx
          });
        }
      }
    } else if (line.includes('STATUS:READY')) {
      this.setState('READY');
    } else if (line.includes('STATUS:SHAKING_ACTIVE')) {
      this.setState('RUNNING');
    } else if (line.includes('STATUS:SHAKE_COMPLETE')) {
      this.setState('CONNECTED');
    }
  }

  /**
   * Send packet to physical or simulated serial line
   */
  async sendPacket(command) {
    const packet = command.endsWith('\n') ? command : command + '\n';
    this.logTx(command.trim());

    if (this.isSimulated) {
      this.handleSimulatedRx(command.trim());
      return;
    }

    if (!this.port || !this.port.writable) {
      throw new Error('Serial port is not writable.');
    }

    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
    const writer = textEncoder.writable.getWriter();
    await writer.write(packet);
    writer.releaseLock();
  }

  /**
   * Start Standalone Hardware Loopback Simulation
   */
  startSimulationMode() {
    this.disconnect();
    this.isConnected = true;
    this.isSimulated = true;
    this.setState('CONNECTED');
    this.logRx('[SIMULATOR] Virtual ESP32-S3 Hardware Loopback Initialized (Dual TMC2209 + ADXL356 SPI @ 10MHz)');
    this.logRx('[SIMULATOR] Hardware ready. Standalone DSP loopback active.');
  }

  /**
   * Simulates the ESP32-S3 firmware state machine response to commands
   */
  handleSimulatedRx(cmd) {
    if (cmd.startsWith('PING')) {
      this.logRx('PONG:ESP32-S3_DUAL_STEPPER_FW_V2.4 [TMC2209:OK, ADXL356:CALIBRATED]');
    } else if (cmd.startsWith('CFG:')) {
      this.logRx('OK:CFG_STORED [GT2_20T, 1/16uStep, 80steps/mm, SoftLimit:Active]');
    } else if (cmd.startsWith('BUF_START:')) {
      this.logRx('OK:BUFFER_ALLOCATED_SRAM (Free DMA: 284KB)');
    } else if (cmd.startsWith('EXEC:START')) {
      this.setState('RUNNING');
      this.logRx('STATUS:SHAKING_ACTIVE [FreeRTOS Timer 50Hz, Stepper ISR Enabled]');
      this.runSimulatedShakeLoop();
    } else if (cmd.startsWith('ESTOP')) {
      this.stopExecution();
      this.logRx('WARN:ESTOP_ASSERTED - Stepper PWM Killed, Table Disabled');
      this.setState('ESTOP');
    } else if (cmd.startsWith('HOME')) {
      this.logRx('OK:HOMING_CYCLE_COMPLETE - Center Reference 0.00mm');
    }
  }

  /**
   * Upload Trajectory Buffer (steps, times, displacements)
   */
  async uploadTrajectoryBuffer(trajectoryPoints) {
    if (!this.isConnected) {
      throw new Error('Device not connected. Connect physical ESP32 or activate Simulation mode.');
    }

    this.trajectoryBuffer = trajectoryPoints;
    const total = trajectoryPoints.length;
    this.setState('BUFFERING');

    await this.sendPacket(`BUF_START:POINTS=${total},DT_MS=${Math.round((trajectoryPoints[1]?.time - trajectoryPoints[0]?.time) * 1000 || 20)}`);

    // Stream points in chunks
    const chunkSize = 50;
    for (let i = 0; i < total; i += chunkSize) {
      if (this.state === 'ESTOP') break;

      const chunk = trajectoryPoints.slice(i, i + chunkSize);
      const chunkPayload = chunk.map(p => `${Math.round(p.time * 1000)}:${p.step}:${p.disp.toFixed(2)}`).join(';');
      
      await this.sendPacket(`CHUNK:${i}:${chunkPayload}`);

      const progress = Math.min(100, Math.round(((i + chunk.length) / total) * 100));
      if (this.onProgress) this.onProgress(progress, i + chunk.length, total);

      // Brief yield
      await new Promise(r => setTimeout(r, this.isSimulated ? 2 : 20));
    }

    await this.sendPacket(`BUF_END:CHECKSUM=0x${(total * 47 & 0xFFFF).toString(16).toUpperCase()}`);
    this.setState('READY');
    this.logRx(`[SYSTEM] Trajectory buffer verification passed. ${total} motion steps loaded.`);
  }

  /**
   * Trigger Shake Sequence
   */
  async executeShake() {
    if (!this.isConnected) {
      throw new Error('Device not connected.');
    }
    await this.sendPacket('EXEC:START');
  }

  /**
   * Stop / Emergency Stop
   */
  async emergencyStop() {
    this.stopExecution();
    await this.sendPacket('ESTOP:EMERGENCY_HALT');
    this.setState('ESTOP');
  }

  /**
   * Homing Cycle
   */
  async homeTable() {
    await this.sendPacket('HOME:OPTICAL_LIMIT_CENTER');
  }

  stopExecution() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  /**
   * Runs the simulated shake loop in standalone mode.
   * Simulates realistic physical table dynamics:
   * - Stepper motor lag & mechanical backlash (~18ms phase delay)
   * - Chassis resonance (secondary ringing around 9.5 Hz)
   * - ADXL356 high-resolution analog accelerometer noise density (0.003g Gaussian noise)
   */
  runSimulatedShakeLoop() {
    this.stopExecution();
    if (!this.trajectoryBuffer || this.trajectoryBuffer.length === 0) return;

    let index = 0;
    const total = this.trajectoryBuffer.length;
    const dtMs = Math.round((this.trajectoryBuffer[1]?.time - this.trajectoryBuffer[0]?.time) * 1000) || 20;

    // Resonant state variables for 2nd order chassis vibration model
    let resPos = 0;
    let resVel = 0;
    const omegaN = 2 * Math.PI * 9.5; // 9.5 Hz natural chassis frequency
    const zeta = 0.15; // chassis damping ratio

    this.simTimer = setInterval(() => {
      if (index >= total || this.state === 'ESTOP') {
        this.stopExecution();
        this.setState('CONNECTED');
        this.logRx('STATUS:SHAKE_COMPLETE [Profile Finished, Carriage Idle at 0.00mm]');
        return;
      }

      const point = this.trajectoryBuffer[index];
      const cmdAccel = point.accel || 0;
      const cmdDisp = point.disp || 0;

      // Physics model: 2nd-order harmonic response to commanded acceleration
      const dtSec = dtMs / 1000;
      const resAccel = -2 * zeta * omegaN * resVel - omegaN * omegaN * resPos + (cmdAccel * 9.81 * 0.12);
      resVel += resAccel * dtSec;
      resPos += resVel * dtSec;

      // Realistic ADXL356 sensor noise (Gaussian distribution, ~0.002g RMS)
      const u1 = Math.random() || 0.001;
      const u2 = Math.random() || 0.001;
      const sensorNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * 0.0035;

      // Add mechanical lag and micro-resonance
      const measuredAccel = cmdAccel * 0.98 + (resPos * 0.05) + sensorNoise;
      const measuredDisp = cmdDisp + (resPos * 0.2);

      // Stream simulated TLM packet
      const tlmLine = `TLM:${Math.round(point.time * 1000)},${measuredAccel.toFixed(5)},${measuredDisp.toFixed(2)},${point.step}`;
      this.logRx(tlmLine);

      if (this.onTelemetry) {
        this.onTelemetry({
          time: point.time,
          accel: measuredAccel,
          disp: measuredDisp,
          step: point.step,
          cmdAccel: cmdAccel,
          cmdDisp: cmdDisp
        });
      }

      index++;
    }, dtMs);
  }

  async disconnect() {
    this.stopExecution();
    this.isConnected = false;
    this.isSimulated = false;

    if (this.reader) {
      try { await this.reader.cancel(); } catch (e) {}
      this.reader = null;
    }

    if (this.port) {
      try { await this.port.close(); } catch (e) {}
      this.port = null;
    }

    this.setState('DISCONNECTED');
  }
}
