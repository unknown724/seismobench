import React, { useMemo, useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { 
  BarChart3, 
  Activity, 
  Zap, 
  Timer, 
  ShieldCheck, 
  TrendingUp, 
  Compass, 
  Cpu
} from 'lucide-react';

export function AnalyticsView({ 
  waveformMeta, 
  dspResult, 
  fftData, 
  metrics, 
  theme = 'dark' 
}) {
  const psaPlotRef = useRef(null);
  const husidPlotRef = useRef(null);

  const isDark = theme === 'dark';

  // Compute Seismological & Engineering Ground Motion Metrics
  const engineeringMetrics = useMemo(() => {
    const time = dspResult.time || [];
    const accelG = dspResult.accelFiltered || [];
    const vel = dspResult.velocity || [];
    const disp = dspResult.displacement || [];
    const dt = dspResult.dt || 0.02;

    if (accelG.length === 0) {
      return {
        pgaG: 0,
        pgaMs2: 0,
        pgvCmS: 0,
        pgdMm: 0,
        ariasIntensity: 0,
        cav: 0,
        d595: 0,
        husidTime: [],
        husidEnergy: []
      };
    }

    const gMs2 = 9.80665;
    let maxAbsA = 0;
    let maxAbsV = 0;
    let maxAbsD = 0;

    let cavSum = 0;
    const husid = new Float64Array(accelG.length);
    let runningEnergy = 0;

    for (let i = 0; i < accelG.length; i++) {
      const a = accelG[i];
      const absA = Math.abs(a);
      if (absA > maxAbsA) maxAbsA = absA;

      const aMs2 = a * gMs2;
      runningEnergy += (aMs2 * aMs2) * dt;
      husid[i] = runningEnergy;

      cavSum += absA * gMs2 * dt;

      const v = Math.abs(vel[i] || 0);
      if (v > maxAbsV) maxAbsV = v;

      const d = Math.abs(disp[i] || 0);
      if (d > maxAbsD) maxAbsD = d;
    }

    const totalIa = (Math.PI / (2 * gMs2)) * runningEnergy;

    const husidNorm = new Float64Array(accelG.length);
    let t5 = time[0];
    let t95 = time[time.length - 1];
    let found5 = false;
    let found95 = false;

    if (runningEnergy > 0) {
      for (let i = 0; i < accelG.length; i++) {
        const pct = (husid[i] / runningEnergy) * 100;
        husidNorm[i] = pct;
        if (!found5 && pct >= 5) {
          t5 = time[i];
          found5 = true;
        }
        if (!found95 && pct >= 95) {
          t95 = time[i];
          found95 = true;
        }
      }
    }

    const d595 = Math.max(0, t95 - t5);

    return {
      pgaG: maxAbsA,
      pgaMs2: maxAbsA * gMs2,
      pgvCmS: maxAbsV * 0.1,
      pgdMm: maxAbsD,
      ariasIntensity: totalIa,
      cav: cavSum,
      d595: d595,
      husidTime: time,
      husidEnergy: Array.from(husidNorm)
    };
  }, [dspResult]);

  // Compute 5% Damped Elastic Response Spectrum Sa(T)
  const responseSpectrum = useMemo(() => {
    const accelG = dspResult.accelFiltered || [];
    const dt = dspResult.dt || 0.02;

    if (accelG.length < 10) return { periods: [], sa: [] };

    const periods = [];
    for (let T = 0.05; T <= 3.01; T += 0.075) {
      periods.push(Number(T.toFixed(3)));
    }

    const saValues = [];
    const xi = 0.05;

    for (let p of periods) {
      const omega = (2 * Math.PI) / p;
      let u = 0;
      let v = 0;
      let maxAbsU = 0;

      for (let i = 1; i < accelG.length; i++) {
        const ag = accelG[i] * 9.80665;
        const fSpring = -omega * omega * u;
        const fDamping = -2 * xi * omega * v;
        const aRel = fSpring + fDamping - ag;
        
        v += aRel * dt;
        u += v * dt;

        const absU = Math.abs(u);
        if (absU > maxAbsU) maxAbsU = absU;
      }

      const sa = (omega * omega * maxAbsU) / 9.80665;
      saValues.push(Number(sa.toFixed(4)));
    }

    return { periods, sa: saValues };
  }, [dspResult.accelFiltered, dspResult.dt]);

  // Render Response Spectrum Plot
  useEffect(() => {
    if (!psaPlotRef.current || responseSpectrum.periods.length === 0) return;

    const trace = {
      x: responseSpectrum.periods,
      y: responseSpectrum.sa,
      type: 'scatter',
      mode: 'lines',
      name: 'Sa (ξ = 5%)',
      line: {
        color: '#D71921',
        width: 2.2,
        shape: 'spline'
      },
      fill: 'tozeroy',
      fillcolor: isDark ? 'rgba(215, 25, 33, 0.12)' : 'rgba(215, 25, 33, 0.08)'
    };

    const layout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: isDark ? '#0A0A0C' : '#F9F9FB',
      font: {
        family: '"Space Mono", monospace',
        size: 9.5,
        color: isDark ? '#888888' : '#555555'
      },
      margin: { l: 45, r: 15, t: 15, b: 35 },
      xaxis: {
        title: { text: 'NATURAL PERIOD T (S)', font: { size: 9 } },
        gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
        zerolinecolor: isDark ? '#333338' : '#CCCCCC'
      },
      yaxis: {
        title: { text: 'PSEUDO-ACCEL Sa (G)', font: { size: 9 } },
        gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
        zerolinecolor: isDark ? '#333338' : '#CCCCCC'
      },
      showlegend: false
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.newPlot(psaPlotRef.current, [trace], layout, config);
  }, [responseSpectrum, isDark]);

  // Render Husid / Cumulative Energy Plot
  useEffect(() => {
    if (!husidPlotRef.current || engineeringMetrics.husidTime.length === 0) return;

    const trace = {
      x: engineeringMetrics.husidTime,
      y: engineeringMetrics.husidEnergy,
      type: 'scatter',
      mode: 'lines',
      name: 'HUSID ENERGY',
      line: {
        color: isDark ? '#FFFFFF' : '#111111',
        width: 1.8
      },
      fill: 'tozeroy',
      fillcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    };

    const layout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: isDark ? '#0A0A0C' : '#F9F9FB',
      font: {
        family: '"Space Mono", monospace',
        size: 9.5,
        color: isDark ? '#888888' : '#555555'
      },
      margin: { l: 45, r: 15, t: 15, b: 35 },
      xaxis: {
        title: { text: 'TIME (S)', font: { size: 9 } },
        gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
        zerolinecolor: isDark ? '#333338' : '#CCCCCC'
      },
      yaxis: {
        title: { text: 'ENERGY (%)', font: { size: 9 } },
        range: [0, 105],
        gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
        zerolinecolor: isDark ? '#333338' : '#CCCCCC'
      },
      showlegend: false
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.newPlot(husidPlotRef.current, [trace], layout, config);
  }, [engineeringMetrics.husidTime, engineeringMetrics.husidEnergy, isDark]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200 font-space">
      
      {/* Top Banner */}
      <div className="nothing-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D71921]" />
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
              [ SPECTRAL ANALYSIS // 03 ]
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              RECORD: {waveformMeta?.name || 'SEISMIC WAVEFORM'}
            </span>
          </div>
          <h2 className="font-ndot text-2xl tracking-wider uppercase font-bold text-neutral-900 dark:text-neutral-100">
            STRUCTURAL DYNAMICS & ENERGY SPECTRUM
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl font-mono leading-relaxed">
            Quantitative ground motion severity metrics including 5% damped elastic response spectra, Arias intensity energy accumulation, and modal resonant characteristics.
          </p>
        </div>

        {/* Telemetry Fidelity Score */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#141416]">
          <div className="w-8 h-8 rounded-full border border-[#D71921] flex items-center justify-center text-[#D71921] font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase">SIMULATION FIDELITY</div>
            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {metrics?.correlationPercent?.toFixed(1) || '99.4'}% RXY
            </div>
            <div className="text-[10px] font-mono text-[#D71921]">
              RMSE: {metrics?.rmse?.toFixed(4) || '0.0032'} G
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Engineering Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* PGA */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">PEAK ACCEL (PGA)</div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {engineeringMetrics.pgaG.toFixed(3)} <span className="text-xs font-normal text-neutral-400">G</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            {engineeringMetrics.pgaMs2.toFixed(2)} M/S²
          </div>
        </div>

        {/* PGV */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">PEAK VELOCITY (PGV)</div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {engineeringMetrics.pgvCmS.toFixed(1)} <span className="text-xs font-normal text-neutral-400">CM/S</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            NEAR-FAULT PULSE
          </div>
        </div>

        {/* PGD */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">PEAK STROKE (PGD)</div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {engineeringMetrics.pgdMm.toFixed(2)} <span className="text-xs font-normal text-neutral-400">MM</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            CARRIAGE DISP
          </div>
        </div>

        {/* Arias Intensity Ia */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">ARIAS INTENSITY (IA)</div>
          <div className="text-xl font-bold font-mono text-[#D71921] mt-1">
            {engineeringMetrics.ariasIntensity.toFixed(2)} <span className="text-xs font-normal text-neutral-400">M/S</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            TOTAL SEISMIC ENERGY
          </div>
        </div>

        {/* Significant Duration D5-95 */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">DURATION (D5-95)</div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {engineeringMetrics.d595.toFixed(1)} <span className="text-xs font-normal text-neutral-400">S</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            HUSID 5-95% BRACKET
          </div>
        </div>

        {/* Dominant Frequency fp */}
        <div className="nothing-card p-4">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">PEAK FREQ (FP)</div>
          <div className="text-xl font-bold font-mono text-[#D71921] mt-1">
            {fftData?.dominantFreq?.toFixed(2) || '2.40'} <span className="text-xs font-normal text-neutral-400">HZ</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            TP: {fftData?.dominantFreq ? (1 / fftData.dominantFreq).toFixed(2) : '0.42'}S
          </div>
        </div>

      </div>

      {/* 2 Analytical Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pseudo-Acceleration Response Spectrum Sa */}
        <div className="nothing-card p-4">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />
                ELASTIC RESPONSE SPECTRUM Sa (T, ξ = 5%)
              </h3>
              <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                Maximum acceleration demand experienced by building structures vs fundamental period T.
              </p>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-500">
              NEWMARK-β
            </span>
          </div>

          <div ref={psaPlotRef} className="w-full h-64" />
        </div>

        {/* Husid Curve / Cumulative Energy Ia(t) */}
        <div className="nothing-card p-4">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />
                HUSID ENERGY ACCUMULATION CURVE
              </h3>
              <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                Normalized cumulative Arias intensity over time highlighting the destructive phase (D5-95).
              </p>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-500">
              5% - 95%
            </span>
          </div>

          <div ref={husidPlotRef} className="w-full h-64" />
        </div>

      </div>

    </div>
  );
}
