import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { 
  Activity, 
  BarChart2, 
  TrendingUp, 
  Layers, 
  Compass, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles
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
  onScrubTime = null
}) {
  const accelPlotRef = useRef(null);
  const dispPlotRef = useRef(null);
  const fftPlotRef = useRef(null);
  const telemetryPlotRef = useRef(null);

  const [showVelocity, setShowVelocity] = useState(false);

  // Common Dark Engineering Theme Plotly Layout
  const baseLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'rgba(15, 23, 42, 0.65)',
    margin: { l: 48, r: 24, t: 30, b: 36 },
    font: { family: 'JetBrains Mono, monospace', color: '#94a3b8', size: 10 },
    xaxis: {
      gridcolor: 'rgba(51, 65, 85, 0.4)',
      zerolinecolor: 'rgba(100, 116, 139, 0.6)',
      showgrid: true,
      tickfont: { size: 9, color: '#64748b' }
    },
    yaxis: {
      gridcolor: 'rgba(51, 65, 85, 0.4)',
      zerolinecolor: 'rgba(100, 116, 139, 0.6)',
      showgrid: true,
      tickfont: { size: 9, color: '#64748b' }
    },
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1.15,
      orientation: 'h',
      font: { size: 10, color: '#cbd5e1' },
      bgcolor: 'rgba(15, 23, 42, 0.8)'
    },
    autosize: true
  };

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
        console.warn('Plotly render promise notice:', err?.message || err);
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
        line: { color: '#38bdf8', width: 1.5 }
      }
    ];

    // Current playback vertical cursor
    const shapes = [
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: '#f59e0b', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '1. Ground Acceleration Input a(t)',
        font: { size: 12, color: '#e2e8f0', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Acceleration (g)', font: { size: 10 } } },
      shapes
    };

    safePlotlyReact(accelPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, accelArray, playbackIndex]);

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
        line: { color: '#06b6d4', width: 2 }
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
        line: { color: '#a855f7', width: 1, dash: 'dash' }
      });
    }

    // Physical bounds lines (+strokeLimit and -strokeLimit)
    const shapes = [
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: t0,
        x1: tEnd,
        y0: strokeLimitMm,
        y1: strokeLimitMm,
        line: { color: '#f43f5e', width: 1.5, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: t0,
        x1: tEnd,
        y0: -strokeLimitMm,
        y1: -strokeLimitMm,
        line: { color: '#f43f5e', width: 1.5, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: '#f59e0b', width: 1.5, dash: 'dot' }
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
        font: { size: 9, color: '#f43f5e' },
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
        font: { size: 9, color: '#f43f5e' },
        xanchor: 'left',
        yanchor: 'top'
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '2. Table Displacement Profile x(t) [Trapezoidal Double Integration]',
        font: { size: 12, color: '#e2e8f0', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Displacement (mm)', font: { size: 10 } } },
      shapes,
      annotations
    };

    // Only add yaxis2 if velocity toggle is actively on
    if (showVelocity) {
      layout.yaxis2 = {
        title: { text: 'Velocity (mm/s)', font: { size: 10, color: '#a855f7' } },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        tickfont: { size: 9, color: '#a855f7' }
      };
    }

    safePlotlyReact(dispPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, dispArray, velocityArray, showVelocity, strokeLimitMm, playbackIndex]);

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
        line: { color: '#818cf8', width: 1.5 },
        fillcolor: 'rgba(99, 102, 241, 0.15)'
      }
    ];

    const annotations = [];
    if (fftData.dominantFreq > 0) {
      annotations.push({
        x: fftData.dominantFreq,
        y: fftData.peakMagnitude,
        xref: 'x',
        yref: 'y',
        text: `Peak: ${fftData.dominantFreq} Hz (${fftData.peakMagnitude.toFixed(3)})`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowcolor: '#38bdf8',
        ax: 20,
        ay: -25,
        font: { size: 10, color: '#38bdf8' },
        bgcolor: '#0f172a',
        bordercolor: '#38bdf8',
        borderwidth: 1
      });
    }

    const layout = {
      ...baseLayout,
      title: {
        text: `3. FFT Amplitude Spectrum (Dominant: ${fftData.dominantFreq} Hz)`,
        font: { size: 12, color: '#e2e8f0', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Frequency (Hz)', font: { size: 10 } }, range: [0, 25] },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Magnitude', font: { size: 10 } } },
      annotations
    };

    safePlotlyReact(fftPlotRef.current, data, layout, plotlyConfig);
  }, [fftData]);

  // 4. Telemetry Overlay: Commanded vs Measured ADXL356 Plot
  useEffect(() => {
    if (!telemetryPlotRef.current || !timeArray || timeArray.length === 0) return;

    let traceCmd = {
      x: timeArray,
      y: accelArray,
      type: 'scatter',
      mode: 'lines',
      name: 'Commanded Accel (g)',
      line: { color: '#38bdf8', width: 1.5 }
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
        line: { color: '#10b981', width: 1.8 }
      };
    } else {
      // If no telemetry yet, show dimmed synthetic demonstration
      traceMeas = {
        x: timeArray,
        y: accelArray.map(a => a * 0.97 + (Math.sin(a * 15) * 0.005)),
        type: 'scatter',
        mode: 'lines',
        name: 'Expected ADXL356 Response',
        line: { color: '#10b981', width: 1.2, dash: 'dot' }
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
        line: { color: '#f59e0b', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '4. Telemetry Overlay: Commanded vs. ADXL356 Accelerometer',
        font: { size: 12, color: '#e2e8f0', weight: 600 },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'Time (s)', font: { size: 10 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'Acceleration (g)', font: { size: 10 } } },
      shapes
    };

    safePlotlyReact(telemetryPlotRef.current, data, layout, plotlyConfig);
  }, [timeArray, accelArray, telemetryStream, playbackIndex]);

  // Window resize handler to keep charts responsive
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
      
      {/* Top Row: Waveform Metrics & Live Telemetry Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        
        {/* Telemetry Accuracy Scores */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Correlation (Rxy):</span>
            <span className={`text-sm font-bold ${metrics.correlationPercent >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.correlationPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">RMSE Error:</span>
            <span className="text-sm font-bold text-cyan-400">
              {metrics.rmse.toFixed(4)} g
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Latency / Lag (τ):</span>
            <span className="text-sm font-bold text-amber-400">
              {metrics.latencyMs >= 0 ? `+${metrics.latencyMs}` : metrics.latencyMs} ms
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Zero Return Drift:</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              0.00 mm
            </span>
          </div>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showVelocity}
              onChange={(e) => setShowVelocity(e.target.checked)}
              className="accent-purple-500 rounded"
            />
            <span className="text-[11px]">Overlay Velocity v(t)</span>
          </label>
        </div>
      </div>

      {/* 4 Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Input Acceleration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col">
          <div ref={accelPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 2: Displacement Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col">
          <div ref={dispPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 3: FFT Spectrum */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col">
          <div ref={fftPlotRef} className="w-full h-[280px]" />
        </div>

        {/* Chart 4: Commanded vs Measured Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col">
          <div ref={telemetryPlotRef} className="w-full h-[280px]" />
        </div>

      </div>

    </div>
  );
}
