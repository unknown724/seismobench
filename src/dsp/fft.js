/**
 * Pure JavaScript Cooley-Tukey Radix-2 Fast Fourier Transform (FFT)
 * Computes frequency spectrum, single-sided magnitude, and dominant frequencies.
 */

/**
 * Returns the next power of 2 greater than or equal to n.
 * @param {number} n 
 * @returns {number}
 */
export function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Bit-reversal permutation for Cooley-Tukey Radix-2 FFT
 */
function bitReverse(real, imag, n) {
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      // Swap real
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;
      // Swap imag
      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }
}

/**
 * In-place Cooley-Tukey Radix-2 FFT
 * @param {Float64Array} real
 * @param {Float64Array} imag
 */
export function fftRadix2(real, imag) {
  const n = real.length;
  bitReverse(real, imag, n);

  // Butterfly updates
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1;
      let wI = 0;

      for (let j = 0; j < halfLen; j++) {
        const uR = real[i + j];
        const uI = imag[i + j];

        const vR = real[i + j + halfLen] * wR - imag[i + j + halfLen] * wI;
        const vI = real[i + j + halfLen] * wI + imag[i + j + halfLen] * wR;

        real[i + j] = uR + vR;
        imag[i + j] = uI + vI;

        real[i + j + halfLen] = uR - vR;
        imag[i + j + halfLen] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }
}

/**
 * Computes single-sided FFT Magnitude Spectrum for real input signal
 * 
 * @param {number[]} signal - Time-domain signal
 * @param {number} fs - Sampling rate in Hz
 * @param {Object} options
 * @param {string} options.window - Window function ('hanning', 'hamming', 'rectangular')
 * @param {number} options.maxFreq - Maximum frequency to return (e.g. 25 Hz)
 * @returns {{
 *   frequencies: number[],
 *   magnitudes: number[],
 *   dominantFreq: number,
 *   peakMagnitude: number
 * }}
 */
export function computeFFT(signal, fs, options = {}) {
  const {
    window = 'hanning',
    maxFreq = 25
  } = options;

  const rawN = signal.length;
  if (rawN < 4) {
    return { frequencies: [0], magnitudes: [0], dominantFreq: 0, peakMagnitude: 0 };
  }

  // Zero-pad to next power of 2
  const N = Math.max(256, nextPowerOf2(rawN));
  const real = new Float64Array(N);
  const imag = new Float64Array(N);

  // Apply Window function to original samples
  for (let i = 0; i < rawN; i++) {
    let winFactor = 1.0;
    if (window === 'hanning') {
      winFactor = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (rawN - 1)));
    } else if (window === 'hamming') {
      winFactor = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (rawN - 1));
    }
    real[i] = signal[i] * winFactor;
  }

  // Execute Radix-2 FFT
  fftRadix2(real, imag);

  // Calculate single-sided magnitude spectrum
  const halfN = N / 2;
  const frequencies = [];
  const magnitudes = [];

  let peakMag = 0;
  let dominantFreq = 0;

  // Normalization factor: 2 / rawN (with window coherent gain correction)
  const windowGain = window === 'hanning' ? 0.5 : (window === 'hamming' ? 0.54 : 1.0);
  const scale = 2 / (rawN * windowGain);

  for (let k = 0; k < halfN; k++) {
    const freq = (k * fs) / N;
    if (freq > maxFreq) break;

    // Magnitude
    let mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]) * scale;
    if (k === 0) mag /= 2; // DC component

    frequencies.push(freq);
    magnitudes.push(mag);

    // Track peak dominant frequency (skip near-DC < 0.2 Hz)
    if (freq >= 0.2 && mag > peakMag) {
      peakMag = mag;
      dominantFreq = freq;
    }
  }

  return {
    frequencies,
    magnitudes,
    dominantFreq: Number(dominantFreq.toFixed(2)),
    peakMagnitude: Number(peakMag.toFixed(4))
  };
}
