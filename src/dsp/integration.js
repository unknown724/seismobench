import { butterworthHighPassZeroPhase, removeLinearTrend, applyCosineTaper } from './filter.js';

export const G_TO_MM_S2 = 9806.65; // 1 g = 9806.65 mm/s^2

/**
 * Performs numerical double integration from acceleration to velocity to displacement.
 * Applies multi-stage baseline drift correction and high-pass filtering to guarantee
 * that displacement starts at 0.0 mm and returns cleanly to 0.0 mm.
 * 
 * @param {number[]} time - Time array in seconds
 * @param {number[]} rawAccel - Acceleration array (in g's or mm/s^2)
 * @param {Object} options
 * @param {number} options.cutoffFreq - High-pass cutoff frequency in Hz (default: 0.2)
 * @param {boolean} options.isUnitG - True if input is in g, false if in mm/s^2 (default: true)
 * @param {boolean} options.applyTaper - Whether to apply Tukey cosine taper at ends
 * @returns {{
 *   time: number[],
 *   accelFiltered: number[], // in g
 *   velocity: number[],      // in mm/s
 *   displacement: number[],  // in mm
 *   maxDisp: number,
 *   minDisp: number,
 *   peakVelocity: number,
 *   peakAccel: number,
 *   dt: number,
 *   fs: number
 * }}
 */
export function doubleIntegrateDriftFree(time, rawAccel, options = {}) {
  const {
    cutoffFreq = 0.2,
    isUnitG = true,
    applyTaper = true
  } = options;

  const n = time.length;
  if (n < 4) {
    return {
      time,
      accelFiltered: rawAccel,
      velocity: new Array(n).fill(0),
      displacement: new Array(n).fill(0),
      maxDisp: 0,
      minDisp: 0,
      peakVelocity: 0,
      peakAccel: 0,
      dt: 0.02,
      fs: 50
    };
  }

  // Calculate sampling interval dt and sampling frequency fs
  const dt = (time[n - 1] - time[0]) / (n - 1);
  const fs = 1 / dt;

  // 1. Convert to physical acceleration in mm/s^2
  let accelMmS2 = rawAccel.map(a => (isUnitG ? a * G_TO_MM_S2 : a * 1000));

  // 2. Pre-filter acceleration: Detrend + High-Pass filter
  accelMmS2 = removeLinearTrend(accelMmS2);
  accelMmS2 = butterworthHighPassZeroPhase(accelMmS2, cutoffFreq, fs);
  if (applyTaper) {
    accelMmS2 = applyCosineTaper(accelMmS2, 0.03);
  }

  // 3. First Integration: a(t) -> v(t) using Trapezoidal Rule
  const velocityRaw = new Float64Array(n);
  velocityRaw[0] = 0;
  for (let i = 1; i < n; i++) {
    velocityRaw[i] = velocityRaw[i - 1] + 0.5 * (accelMmS2[i - 1] + accelMmS2[i]) * dt;
  }

  // 4. Velocity Baseline Correction: Remove linear trend & High-Pass filter
  let velocityCorrected = removeLinearTrend(Array.from(velocityRaw));
  velocityCorrected = butterworthHighPassZeroPhase(velocityCorrected, cutoffFreq, fs);
  if (applyTaper) {
    velocityCorrected = applyCosineTaper(velocityCorrected, 0.03);
  }

  // Force velocity ends to exactly zero
  velocityCorrected[0] = 0;
  velocityCorrected[n - 1] = 0;

  // 5. Second Integration: v(t) -> x(t) using Trapezoidal Rule
  const dispRaw = new Float64Array(n);
  dispRaw[0] = 0;
  for (let i = 1; i < n; i++) {
    dispRaw[i] = dispRaw[i - 1] + 0.5 * (velocityCorrected[i - 1] + velocityCorrected[i]) * dt;
  }

  // 6. Final Displacement Detrend & Boundary Tapering:
  // Shake table mechanics MUST start at 0.0 mm and return cleanly to 0.0 mm
  let displacement = removeLinearTrend(Array.from(dispRaw));
  displacement = butterworthHighPassZeroPhase(displacement, cutoffFreq * 0.9, fs);

  // Smoothly blend boundary to exactly 0 at start and end
  const boundarySteps = Math.min(Math.floor(n * 0.05), 50);
  for (let i = 0; i < boundarySteps; i++) {
    const ramp = (1 - Math.cos((Math.PI * i) / boundarySteps)) * 0.5;
    displacement[i] *= ramp;
    displacement[n - 1 - i] *= ramp;
  }
  displacement[0] = 0.0;
  displacement[n - 1] = 0.0;

  // Convert filtered acceleration back to g for display
  const accelFilteredG = accelMmS2.map(a => a / G_TO_MM_S2);

  // Calculate waveform metrics
  let maxDisp = -Infinity;
  let minDisp = Infinity;
  let peakVelocity = 0;
  let peakAccel = 0;

  for (let i = 0; i < n; i++) {
    const d = displacement[i];
    const v = Math.abs(velocityCorrected[i]);
    const a = Math.abs(accelFilteredG[i]);

    if (d > maxDisp) maxDisp = d;
    if (d < minDisp) minDisp = d;
    if (v > peakVelocity) peakVelocity = v;
    if (a > peakAccel) peakAccel = a;
  }

  return {
    time,
    accelFiltered: accelFilteredG,
    velocity: velocityCorrected,
    displacement,
    maxDisp,
    minDisp,
    peakVelocity,
    peakAccel,
    dt,
    fs
  };
}
