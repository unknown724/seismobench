import { ELCENTRO_TIME, ELCENTRO_ACCEL } from './elcentro_data.js';

/**
 * Seismic Event Records, Preloaded Waveforms, and CSV Parsing
 */

/**
 * Generates a realistic Synthetic Sine Sweep (1 Hz to 15 Hz resonance test)
 * @param {number} duration - Duration in seconds (default: 15s)
 * @param {number} dt - Time step in seconds (default: 0.01s = 100 Hz)
 * @param {number} pga - Peak acceleration in g (default: 0.25g)
 */
export function generateSineSweep(duration = 15.0, dt = 0.01, pga = 0.25) {
  const n = Math.floor(duration / dt);
  const time = new Float64Array(n);
  const accel = new Float64Array(n);

  const fStart = 1.0;  // 1 Hz
  const fEnd = 15.0;   // 15 Hz

  for (let i = 0; i < n; i++) {
    const t = i * dt;
    time[i] = Number(t.toFixed(4));

    // Linear frequency chirp formula: phi(t) = 2*pi*(fStart*t + (fEnd - fStart)/(2*T) * t^2)
    const phase = 2 * Math.PI * (fStart * t + ((fEnd - fStart) / (2 * duration)) * t * t);

    // Smooth envelope: 5% ramp-up, steady, 5% ramp-down
    let env = 1.0;
    const rampTime = 0.75;
    if (t < rampTime) {
      env = 0.5 * (1 - Math.cos((Math.PI * t) / rampTime));
    } else if (t > duration - rampTime) {
      env = 0.5 * (1 - Math.cos((Math.PI * (duration - t)) / rampTime));
    }

    accel[i] = Number((pga * env * Math.sin(phase)).toFixed(5));
  }

  return {
    id: 'sweep',
    name: 'Synthetic Sine Sweep (1 Hz - 15 Hz)',
    location: 'Mechanical Resonance Test',
    date: 'Synthetic Standard',
    description: 'Chirp signal sweeping through 1 to 15 Hz natural frequencies with Tukey windowing to identify shake table chassis and model resonance.',
    pga: pga,
    duration: duration,
    dt: dt,
    time: Array.from(time),
    accel: Array.from(accel)
  };
}

/**
 * Generates synthetic realistic 1995 Kobe Earthquake waveform (Kobe JMA Station record)
 * High-velocity fling step pulse with prominent 1.5 Hz - 3 Hz destructive energy.
 */
export function generateKobeWaveform() {
  const dt = 0.02;
  const duration = 25.0;
  const n = Math.floor(duration / dt);
  const time = [];
  const accel = [];
  const pga = 0.82; // 0.82g peak

  // Envelope peak centered around t = 7.5s
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    time.push(Number(t.toFixed(3)));

    let val = 0;
    if (t >= 3.0 && t <= 20.0) {
      const tc = t - 7.5;
      // Main velocity pulse
      const pulse1 = Math.exp(-0.25 * tc * tc) * Math.sin(2 * Math.PI * 1.4 * tc);
      const pulse2 = 0.5 * Math.exp(-0.15 * Math.pow(t - 9.0, 2)) * Math.sin(2 * Math.PI * 2.8 * t + 0.8);
      const pulse3 = 0.3 * Math.exp(-0.1 * Math.pow(t - 11.5, 2)) * Math.sin(2 * Math.PI * 4.2 * t + 1.5);
      const microTremors = 0.12 * Math.sin(2 * Math.PI * 7.5 * t) * Math.exp(-0.08 * Math.pow(t - 8.0, 2));

      val = (pulse1 + pulse2 + pulse3 + microTremors) * pga * 0.95;
    }

    accel.push(Number(val.toFixed(5)));
  }

  return {
    id: 'kobe',
    name: '1995 Kobe Earthquake (Kobe JMA)',
    location: 'Kobe, Japan',
    date: 'Jan 17, 1995',
    description: 'Severe near-fault ground motion characterized by high peak velocity (100 cm/s) and intense 1-3 Hz pulses that devastated Hanshin infrastructure.',
    pga: 0.82,
    duration: duration,
    dt: dt,
    time,
    accel
  };
}

/**
 * Generates synthetic realistic 1994 Northridge Earthquake waveform (Sylmar County Hospital Station)
 * High peak acceleration (0.84g) with strong fling step and high-frequency content.
 */
export function generateNorthridgeWaveform() {
  const dt = 0.02;
  const duration = 20.0;
  const n = Math.floor(duration / dt);
  const time = [];
  const accel = [];
  const pga = 0.84;

  for (let i = 0; i < n; i++) {
    const t = i * dt;
    time.push(Number(t.toFixed(3)));

    let val = 0;
    if (t >= 2.5 && t <= 16.0) {
      const tc = t - 5.8;
      // Distinctive Sylmar double forward directivity pulse
      const p1 = Math.exp(-0.35 * tc * tc) * Math.cos(2 * Math.PI * 1.8 * tc);
      const p2 = -0.7 * Math.exp(-0.25 * Math.pow(t - 7.2, 2)) * Math.sin(2 * Math.PI * 2.2 * t);
      const p3 = 0.45 * Math.exp(-0.18 * Math.pow(t - 9.5, 2)) * Math.sin(2 * Math.PI * 5.1 * t);
      const p4 = 0.2 * Math.sin(2 * Math.PI * 9.8 * t) * Math.exp(-0.12 * Math.pow(t - 6.5, 2));

      val = (p1 + p2 + p3 + p4) * pga * 0.92;
    }

    accel.push(Number(val.toFixed(5)));
  }

  return {
    id: 'northridge',
    name: '1994 Northridge Earthquake (Sylmar Station)',
    location: 'Los Angeles, California',
    date: 'Jan 17, 1994',
    description: 'Classic thrust-fault earthquake with intense forward-directivity motion and high spectral acceleration recorded at the Sylmar County Hospital.',
    pga: 0.84,
    duration: duration,
    dt: dt,
    time,
    accel
  };
}

/**
 * Parses CSV raw text into { time, accel, pga, dt, duration }
 * Supports:
 * - Header detection: time, acceleration, accel, t, a
 * - Unit detection: g, m/s^2, cm/s^2, mm/s^2
 * - Comma, tab, semicolon or whitespace delimiters
 * 
 * @param {string} csvText 
 * @returns {{
 *   time: number[],
 *   accel: number[],
 *   dt: number,
 *   duration: number,
 *   pga: number,
 *   detectedUnit: string
 * }}
 */
export function parseSeismogramCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 5) {
    throw new Error('CSV file contains too few lines for a valid seismogram.');
  }

  let delimiter = ',';
  const firstLine = lines[0];
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (!firstLine.includes(',') && firstLine.trim().split(/\s+/).length >= 2) delimiter = ' ';

  let timeColIdx = 0;
  let accelColIdx = 1;
  let startLine = 0;
  let detectedUnit = 'g';

  // Check if first line is a header
  const headerParts = (delimiter === ' ' ? firstLine.trim().split(/\s+/) : firstLine.split(delimiter)).map(s => s.trim().toLowerCase());
  const isHeader = headerParts.some(p => p.includes('time') || p.includes('acc') || p.includes('sec') || isNaN(parseFloat(p)));

  if (isHeader) {
    startLine = 1;
    for (let c = 0; c < headerParts.length; c++) {
      const h = headerParts[c];
      if (h.includes('time') || h.includes('sec') || h === 't') {
        timeColIdx = c;
      }
      if (h.includes('acc') || h === 'a' || h.includes('gal') || h.includes('g') || h.includes('m/s')) {
        accelColIdx = c;
        if (h.includes('m/s') || h.includes('m/s2') || h.includes('m/s^2')) detectedUnit = 'm/s2';
        else if (h.includes('gal') || h.includes('cm/s')) detectedUnit = 'gal';
      }
    }
  }

  const times = [];
  const accels = [];
  let peakVal = 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const parts = delimiter === ' ' ? line.split(/\s+/) : line.split(delimiter);
    if (parts.length <= Math.max(timeColIdx, accelColIdx)) continue;

    const t = parseFloat(parts[timeColIdx]);
    let a = parseFloat(parts[accelColIdx]);

    if (!isNaN(t) && !isNaN(a)) {
      // Unit normalization to g
      if (detectedUnit === 'm/s2') {
        a = a / 9.80665;
      } else if (detectedUnit === 'gal') {
        a = a / 980.665;
      }

      times.push(t);
      accels.push(a);

      const absA = Math.abs(a);
      if (absA > peakVal) peakVal = absA;
    }
  }

  if (times.length < 5) {
    throw new Error('Could not parse valid numerical time and acceleration columns from CSV.');
  }

  const dt = (times[times.length - 1] - times[0]) / (times.length - 1);
  const duration = times[times.length - 1] - times[0];

  return {
    time: times,
    accel: accels,
    dt: Number(dt.toFixed(5)),
    duration: Number(duration.toFixed(3)),
    pga: Number(peakVal.toFixed(4)),
    detectedUnit
  };
}

export function getElCentro1940() {
  const pga = Math.max(...ELCENTRO_ACCEL.map(Math.abs));
  return {
    id: 'elcentro',
    name: '1940 El Centro (NS Component)',
    location: 'Imperial Valley, California',
    date: 'May 18, 1940',
    description: 'The definitive benchmark earthquake record in structural engineering. Recorded at the El Centro Irrigation District terminal building.',
    pga: Number(pga.toFixed(4)),
    duration: Number((ELCENTRO_TIME[ELCENTRO_TIME.length - 1] - ELCENTRO_TIME[0]).toFixed(2)),
    dt: Number(((ELCENTRO_TIME[ELCENTRO_TIME.length - 1] - ELCENTRO_TIME[0]) / (ELCENTRO_TIME.length - 1)).toFixed(4)),
    time: ELCENTRO_TIME,
    accel: ELCENTRO_ACCEL
  };
}

/**
 * Loads El Centro 1940 dataset from the public directory or fetch
 */
export async function fetchElCentro1940() {
  return getElCentro1940();
}

/**
 * Synthetic mathematical model of El Centro 1940 in case of local network sandbox
 */
export function generateElCentroSynthetic() {
  const dt = 0.02;
  const duration = 31.2;
  const n = Math.floor(duration / dt);
  const time = [];
  const accel = [];
  const pga = 0.348;

  for (let i = 0; i < n; i++) {
    const t = i * dt;
    time.push(Number(t.toFixed(3)));

    let val = 0;
    if (t >= 1.5 && t <= 28.0) {
      const env = Math.exp(-0.06 * (t - 2.0)) * Math.pow((t - 1.5) / 3.0, 1.8);
      const carrier = 0.6 * Math.sin(2 * Math.PI * 2.1 * t)
                    + 0.3 * Math.sin(2 * Math.PI * 4.4 * t + 1.2)
                    + 0.2 * Math.sin(2 * Math.PI * 1.2 * t + 0.5)
                    + 0.15 * Math.sin(2 * Math.PI * 7.8 * t + 2.1);
      val = carrier * Math.min(1.0, env) * (pga / 1.1);
    }
    accel.push(Number(val.toFixed(5)));
  }

  return {
    id: 'elcentro',
    name: '1940 El Centro (NS Component)',
    location: 'Imperial Valley, California',
    date: 'May 18, 1940',
    description: 'The definitive benchmark earthquake record in structural engineering. Recorded at the El Centro Irrigation District terminal building.',
    pga: 0.348,
    duration: duration,
    dt: dt,
    time,
    accel
  };
}
