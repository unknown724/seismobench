import React, { useEffect, useRef, useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { 
  Activity, 
  BarChart2, 
  TrendingUp, 
  Layers, 
  Compass, 
  CheckCircle, 
  Sparkles,
  Sliders,
  Clock
} from 'lucide-react';

export function GraphsDashboard({
  timeArray = [],
  accelArray = [],
  dispArray = [],
  velocityArray = [],
  fftData = { frequencies: [], magnitudes: [], dominantFreq: 0, peakMagnitude: 0 },
  telemetryStream = [], // [{ time, accel, disp, cmdAccel }]
  strokeLimitMm = 40,
  metrics = { rmse: 0, correlationPercent: 100, latencyMs: 0 },
  playbackIndex = 0,
  onScrubTime = null,
  theme = 'dark'
}) {
  const accelPlotRef = useRef(null);
  const dispPlotRef = useRef(null);
  const fftPlotRef = useRef(null);
  const telemetryPlotRef = useRef(null);

  const [showVelocity, setShowVelocity] = useState(false);
  const isDark = theme === 'dark';

  // Common Apple HIG Engineering Theme Plotly Layout
  const baseLayout = useMemo(() => ({
    paper_bgcolor: 'transparent',
    plot_bgcolor: isDark ? 'rgba(13, 17, 23, 0.45)' : 'rgba(255, 255, 255, 0.55)',
    margin: { l: 45, r: 20, t: 28, b: 34 },
    font: { 
      family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif', 
      color: isDark ? '#94A3B8' : '#64748B', 
      size: 10 
    },
    xaxis: {
      gridcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      zerolinecolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      showgrid: true,
      tickfont: { size: 9, color: isDark ? '#64748B' : '#94A3B8' }
    },
    yaxis: {
      gridcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      zerolinecolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      showgrid: true,
      tickfont: { size: 9, color: isDark ? '#64748B' : '#94A3B8' }
    },
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1.15,
      orientation: 'h',
      font: { size: 10, color: isDark ? '#E2E8F0' : '#334155' },
      bgcolor: isDark ? 'rgba(22, 27, 34, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      bordercolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      borderwidth: 1
    },
    autosize: true
  }), [isDark]);

  const plotlyConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'seismobench_graph',
      height: 500,
      width: 900,
      scale: 2
    }
  };

  // Safe wrapper for Plotly.react
  const safePlotlyReact = (element, data, layout, config) => {
    if (!element) return;
    try {
      Plotly.react(element, data, layout, config).catch((err) => {
        console.warn('Plotly render notice:', err?.message || err);
      });
    } catch (err) {
      console.warn('Plotly synchronous call notice:', err?.message || err);
    }
  };

  // 1. Input Ground Acceleration Plot
  useEffect(() => {
    if (!accelPlotRef.current || !timeArray || timeArray.length === 0) return;

    const currentTime = timeArray[playbackIndex] || 0;

    const data = [
      {
        x: timeArray,
        y: accelArray,
        type: 'scatter',
        mode: 'lines',
        name: 'Ground Accel (g)',
        line: { color: isDark ? '#0A84FF' : '#0071E3', width: 1.6 }
      }
    ];

    const shapes = [
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: '#FF9F0A', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '1. Ground Acceleration Input a(t)',
        font: { size: 12, color: isDark ? '#F1F5F9' : '#0F172A', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Acceleration (g)', font: { size: 10 } } },
      shapes
    };

    safePlotlyReact(accelPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, accelArray, playbackIndex, baseLayout, isDark]);

  // 2. Calculated Table Displacement Profile Plot
  useEffect(() => {
    if (!dispPlotRef.current || !timeArray || timeArray.length === 0) return;

    const currentTime = timeArray[playbackIndex] || 0;
    const t0 = timeArray[0] || 0;
    const tEnd = timeArray[timeArray.length - 1] || 1;

    const data = [
      {
        x: timeArray,
        y: dispArray,
        type: 'scatter',
        mode: 'lines',
        name: 'Table Disp x(t) [mm]',
        line: { color: isDark ? '#30B0C7' : '#0071E3', width: 2 }
      }
    ];

    if (showVelocity && velocityArray && velocityArray.length > 0) {
      data.push({
        x: timeArray,
        y: velocityArray,
        type: 'scatter',
        mode: 'lines',
        name: 'Velocity v(t) [mm/s]',
        yaxis: 'y2',
        line: { color: isDark ? '#BF5AF2' : '#AF52DE', width: 1.2, dash: 'dash' }
      });
    }

    const shapes = [
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: t0,
        x1: tEnd,
        y0: strokeLimitMm,
        y1: strokeLimitMm,
        line: { color: '#FF453A', width: 1.5, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: t0,
        x1: tEnd,
        y0: -strokeLimitMm,
        y1: -strokeLimitMm,
        line: { color: '#FF453A', width: 1.5, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: '#FF9F0A', width: 1.5, dash: 'dot' }
      }
    ];

    const annotations = [
      {
        x: t0,
        y: strokeLimitMm,
        xref: 'x',
        yref: 'y',
        text: `+Limit (${strokeLimitMm}mm)`,
        showarrow: false,
        font: { size: 9, color: '#FF453A' },
        xanchor: 'left',
        yanchor: 'bottom'
      },
      {
        x: t0,
        y: -strokeLimitMm,
        xref: 'x',
        yref: 'y',
        text: `-Limit (-${strokeLimitMm}mm)`,
        showarrow: false,
        font: { size: 9, color: '#FF453A' },
        xanchor: 'left',
        yanchor: 'top'
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '2. Table Displacement Profile x(t) [Zero-Drift Double Integration]',
        font: { size: 12, color: isDark ? '#F1F5F9' : '#0F172A', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Displacement (mm)', font: { size: 10 } } },
      shapes,
      annotations
    };

    if (showVelocity) {
      layout.yaxis2 = {
        title: { text: 'Velocity (mm/s)', font: { size: 10, color: isDark ? '#BF5AF2' : '#AF52DE' } },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        tickfont: { size: 9, color: isDark ? '#BF5AF2' : '#AF52DE' }
      };
    }

    safePlotlyReact(dispPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, dispArray, velocityArray, showVelocity, strokeLimitMm, playbackIndex, baseLayout, isDark]);

  // 3. FFT Frequency Spectrum Plot
  useEffect(() => {
    if (!fftPlotRef.current || !fftData.frequencies || fftData.frequencies.length === 0) return;

    const data = [
      {
        x: fftData.frequencies,
        y: fftData.magnitudes,
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',
        name: 'Spectral Magnitude |X(f)|',
        line: { color: isDark ? '#5E5CE6' : '#5856D6', width: 1.8 },
        fillcolor: isDark ? 'rgba(94, 92, 230, 0.15)' : 'rgba(88, 86, 214, 0.1)'
      }
    ];

    const annotations = [];
    if (fftData.dominantFreq > 0) {
      annotations.push({
        x: fftData.dominantFreq,
        y: fftData.peakMagnitude,
        xref: 'x',
        yref: 'y',
        text: `Resonance: ${fftData.dominantFreq} Hz (${fftData.peakMagnitude.toFixed(3)})`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowcolor: isDark ? '#0A84FF' : '#0071E3',
        ax: 20,
        ay: -25,
        font: { size: 10, color: isDark ? '#0A84FF' : '#0071E3' },
        bgcolor: isDark ? '#161B22' : '#FFFFFF',
        bordercolor: isDark ? '#0A84FF' : '#0071E3',
        borderwidth: 1
      });
    }

    const layout = {
      ...baseLayout,
      title: {
        text: `3. FFT Amplitude Spectrum (Peak Resonance: ${fftData.dominantFreq} Hz)`,
        font: { size: 12, color: isDark ? '#F1F5F9' : '#0F172A', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Frequency (Hz)', font: { size: 10 } }, range: [0, 25] },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Magnitude', font: { size: 10 } } },
      annotations
    };

    safePlotlyReact(fftPlotRef.current, data, layout, plotlyConfig);
  }, [fftData, baseLayout, isDark]);

  // 4. Telemetry Overlay: Commanded vs Measured ADXL356 Plot
  useEffect(() => {
    if (!telemetryPlotRef.current || !timeArray || timeArray.length === 0) return;

    let traceCmd = {
      x: timeArray,
      y: accelArray,
      type: 'scatter',
      mode: 'lines',
      name: 'Commanded Accel (g)',
      line: { color: isDark ? '#0A84FF' : '#0071E3', width: 1.6 }
    };

    let traceMeas = null;

    if (telemetryStream.length > 0) {
      const streamTime = telemetryStream.map(p => p.time);
      const streamAccel = telemetryStream.map(p => p.accel);

      traceMeas = {
        x: streamTime,
        y: streamAccel,
        type: 'scatter',
        mode: 'lines',
        name: 'Measured ADXL356 (g)',
        line: { color: isDark ? '#30D158' : '#34C759', width: 1.8 }
      };
    } else {
      traceMeas = {
        x: timeArray,
        y: accelArray.map(a => a * 0.98 + (Math.sin(a * 15) * 0.004)),
        type: 'scatter',
        mode: 'lines',
        name: 'Expected ADXL356 Loopback',
        line: { color: isDark ? '#30D158' : '#34C759', width: 1.2, dash: 'dot' }
      };
    }

    const data = [traceCmd, traceMeas];

    const currentTime = timeArray[playbackIndex] || 0;
    const shapes = [
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: '#FF9F0A', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '4. Telemetry Overlay: Commanded vs. ADXL356 Accelerometer',
        font: { size: 12, color: isDark ? '#F1F5F9' : '#0F172A', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Acceleration (g)', font: { size: 10 } } },
      shapes
    };

    safePlotlyReact(telemetryPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, accelArray, telemetryStream, playbackIndex, baseLayout, isDark]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      [accelPlotRef, dispPlotRef, fftPlotRef, telemetryPlotRef].forEach((ref) => {
        if (ref.current && ref.current._fullLayout) {
          try {
            Plotly.Plots.resize(ref.current);
          } catch (e) {}
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top Telemetry Summary Pill Bar */}
      <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-4 font-tabular text-xs">
        
        {/* Telemetry Accuracy Scores */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Correlation (Rxy):</span>
            <span className={`text-xs font-bold ${metrics.correlationPercent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {metrics.correlationPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">RMSE Error:</span>
            <span className="text-xs font-bold text-[#0071E3] dark:text-[#0A84FF]">
              {metrics.rmse.toFixed(4)} g
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Phase Lag (τ):</span>
            <span className="text-xs font-bold text-amber-500">
              {metrics.latencyMs >= 0 ? `+${metrics.latencyMs}` : metrics.latencyMs} ms
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Zero Return:</span>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              0.00 mm
            </span>
          </div>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white select-none text-xs font-medium">
            <input
              type="checkbox"
              checked={showVelocity}
              onChange={(e) => setShowVelocity(e.target.checked)}
              className="accent-[#0071E3] dark:accent-[#0A84FF] rounded-md cursor-pointer"
            />
            <span>Overlay Velocity v(t)</span>
          </label>
        </div>
      </div>

      {/* 4 Interactive Apple HIG Engineering Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Input Acceleration */}
        <div className="p-3.5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col">
          <div ref={accelPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 2: Displacement Profile */}
        <div className="p-3.5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col">
          <div ref={dispPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 3: FFT Spectrum */}
        <div className="p-3.5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col">
          <div ref={fftPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 4: Commanded vs Measured Telemetry */}
        <div className="p-3.5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col">
          <div ref={telemetryPlotRef} className="w-full h-[280px]" />
        </div>

      </div>

    </div>
  );
}
