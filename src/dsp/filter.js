/**
 * Digital Signal Processing - Digital 2nd-Order High-Pass Butterworth Filter
 * Includes Forward-Backward (filtfilt) zero-phase filtering and baseline detrending.
 */

/**
 * Calculates 2nd-order Butterworth High-Pass Filter IIR coefficients
 * using the Bilinear Transform with frequency pre-warping.
 * 
 * @param {number} fc - Cutoff frequency in Hz
 * @param {number} fs - Sampling frequency in Hz
 * @returns {{b: number[], a: number[]}}
 */
export function calculateButterworthHpCoeffs(fc, fs) {
  // Ensure cutoff is within stable Nyquist range
  const nyquist = fs / 2;
  const clampedFc = Math.max(0.001, Math.min(fc, nyquist * 0.95));
  
  // Bilinear transform with pre-warping
  const omegaC = Math.PI * clampedFc / fs;
  const K = Math.tan(omegaC);
  const K2 = K * K;
  const sqrt2K = Math.SQRT2 * K;
  
  const D = 1 + sqrt2K + K2;
  
  // High-pass transfer function coefficients
  const b0 = 1 / D;
  const b1 = -2 / D;
  const b2 = 1 / D;
  
  const a1 = (2 * (K2 - 1)) / D;
  const a2 = (1 - sqrt2K + K2) / D;
  
  return {
    b: [b0, b1, b2],
    a: [1, a1, a2]
  };
}

/**
 * Direct Form II Transposed IIR Filtering
 * @param {number[]} x - Input signal array
 * @param {number[]} b - Feedforward coefficients [b0, b1, b2]
 * @param {number[]} a - Feedback coefficients [1, a1, a2]
 * @returns {number[]} Filtered signal array
 */
export function iirFilter(x, b, a) {
  const n = x.length;
  const y = new Float64Array(n);
  
  let s1 = 0;
  let s2 = 0;
  
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = b[0] * xi + s1;
    s1 = b[1] * xi - a[1] * yi + s2;
    s2 = b[2] * xi - a[2] * yi;
    y[i] = yi;
  }
  
  return Array.from(y);
}

/**
 * Zero-Phase Forward-Backward Filtering (filtfilt)
 * Eliminates phase shift/lag which is crucial for mechanical alignment.
 * 
 * @param {number[]} x - Input signal
 * @param {number} fc - Cutoff frequency in Hz
 * @param {number} fs - Sampling frequency in Hz
 * @returns {number[]} Zero-phase filtered signal
 */
export function butterworthHighPassZeroPhase(x, fc, fs) {
  if (!x || x.length < 4) return x ? [...x] : [];
  
  const { b, a } = calculateButterworthHpCoeffs(fc, fs);
  
  // Forward pass
  const forward = iirFilter(x, b, a);
  
  // Reverse
  forward.reverse();
  
  // Backward pass
  const backward = iirFilter(forward, b, a);
  
  // Reverse back to normal orientation
  backward.reverse();
  
  return backward;
}

/**
 * Removes DC offset (mean) and linear trend from a signal.
 * @param {number[]} signal
 * @returns {number[]} Detrended signal
 */
export function removeLinearTrend(signal) {
  const n = signal.length;
  if (n <= 1) return [...signal];
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += signal[i];
    sumXY += i * signal[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return signal.map((val, i) => val - (slope * i + intercept));
}

/**
 * Taper signal ends using a Tukey (cosine-tapered) window
 * to ensure acceleration cleanly begins and ends at 0.
 * @param {number[]} signal
 * @param {number} taperRatio - fraction of signal tapered at each end (e.g. 0.05 = 5%)
 * @returns {number[]} Tapered signal
 */
export function applyCosineTaper(signal, taperRatio = 0.03) {
  const n = signal.length;
  const m = Math.floor(n * taperRatio);
  if (m <= 0) return [...signal];
  
  const output = [...signal];
  for (let i = 0; i < m; i++) {
    const factor = 0.5 * (1 - Math.cos((Math.PI * i) / m));
    output[i] *= factor;
    output[n - 1 - i] *= factor;
  }
  return output;
}
