/**
 * Telemetry and Signal Comparison Metrics
 * Computes RMSE, Normalized Cross-Correlation (Rxy), and Latency offset (tau).
 */

/**
 * Calculates Root Mean Square Error (RMSE) between two signals
 * @param {number[]} commanded - Expected reference array
 * @param {number[]} measured - Measured sensor array
 * @returns {number} RMSE score
 */
export function calculateRMSE(commanded, measured) {
  const n = Math.min(commanded.length, measured.length);
  if (n === 0) return 0;

  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    const err = commanded[i] - measured[i];
    sumSqErr += err * err;
  }

  return Math.sqrt(sumSqErr / n);
}

/**
 * Computes Normalized Cross-Correlation and estimates phase lag/latency in milliseconds.
 * 
 * @param {number[]} x - Commanded signal
 * @param {number[]} y - Measured signal
 * @param {number} dt - Sampling time step in seconds
 * @param {number} maxLagSec - Maximum lag window to search (default 0.2s = 200ms)
 * @returns {{
 *   correlationPercent: number, // Rxy at zero or peak lag (0 - 100%)
 *   latencyMs: number,          // Phase delay in ms (positive means measured lags behind commanded)
 *   peakRxy: number             // Normalized max cross-correlation (-1 to 1)
 * }}
 */
export function calculateCrossCorrelationAndLag(x, y, dt, maxLagSec = 0.25) {
  const n = Math.min(x.length, y.length);
  if (n < 8 || dt <= 0) {
    return { correlationPercent: 100, latencyMs: 0, peakRxy: 1 };
  }

  // Calculate means
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < n; i++) {
    meanX += x[i];
    meanY += y[i];
  }
  meanX /= n;
  meanY /= n;

  // Calculate variances
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    varX += dx * dx;
    varY += dy * dy;
  }

  const denom = Math.sqrt(varX * varY);
  if (denom === 0) {
    return { correlationPercent: 100, latencyMs: 0, peakRxy: 1 };
  }

  const maxLagSteps = Math.min(Math.floor(maxLagSec / dt), Math.floor(n / 4));
  let bestR = -Infinity;
  let bestLagSteps = 0;
  let zeroLagR = 0;

  for (let lag = -maxLagSteps; lag <= maxLagSteps; lag++) {
    let sumProd = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      const j = i + lag;
      if (j >= 0 && j < n) {
        sumProd += (x[i] - meanX) * (y[j] - meanY);
        count++;
      }
    }

    if (count > 0) {
      const r = sumProd / denom;
      if (lag === 0) zeroLagR = r;
      if (r > bestR) {
        bestR = r;
        bestLagSteps = lag;
      }
    }
  }

  const latencyMs = bestLagSteps * dt * 1000;
  const correlationPercent = Math.max(0, Math.min(100, bestR * 100));

  return {
    correlationPercent: Number(correlationPercent.toFixed(1)),
    latencyMs: Number(latencyMs.toFixed(1)),
    peakRxy: Number(bestR.toFixed(4)),
    zeroLagR: Number(zeroLagR.toFixed(4))
  };
}

/**
 * Checks if displacement profile exceeds physical carriage stroke limits.
 * Calculates safety margins and recommended scaling factor if clipping occurs.
 * 
 * @param {number[]} displacement - Table displacement array in mm
 * @param {number} strokeLimitMm - Single-sided stroke limit (+/- mm, e.g. 40mm)
 * @returns {{
 *   exceedsLimit: boolean,
 *   maxPositiveDisp: number,
 *   maxNegativeDisp: number,
 *   peakAbsoluteDisp: number,
 *   clipMargin: number,
 *   recommendedScale: number
 * }}
 */
export function checkPhysicalLimits(displacement, strokeLimitMm = 40) {
  let maxPos = 0;
  let maxNeg = 0;

  for (let i = 0; i < displacement.length; i++) {
    const d = displacement[i];
    if (d > maxPos) maxPos = d;
    if (d < maxNeg) maxNeg = d;
  }

  const peak = Math.max(Math.abs(maxPos), Math.abs(maxNeg));
  const exceeds = peak > strokeLimitMm;
  const margin = strokeLimitMm - peak;
  const recommendedScale = exceeds ? Number((strokeLimitMm / peak * 0.95).toFixed(3)) : 1.0;

  return {
    exceedsLimit: exceeds,
    maxPositiveDisp: Number(maxPos.toFixed(2)),
    maxNegativeDisp: Number(maxNeg.toFixed(2)),
    peakAbsoluteDisp: Number(peak.toFixed(2)),
    clipMargin: Number(margin.toFixed(2)),
    recommendedScale
  };
}
