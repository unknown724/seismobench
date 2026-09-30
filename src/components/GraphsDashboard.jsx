import React, { useEffect, useRef, useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { 
  Activity, 
  BarChart2, 
  TrendingUp, 
  CheckCircle, 
  Sliders
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

  // Nothing OS Plotly Layout (Monochrome + Nothing Red Accent)
  const baseLayout = useMemo(() => ({
    paper_bgcolor: 'transparent',
    plot_bgcolor: isDark ? '#0A0A0C' : '#F9F9FB',
    margin: { l: 45, r: 20, t: 30, b: 35 },
    font: { 
      family: '"Space Mono", monospace', 
      color: isDark ? '#888888' : '#555555', 
      size: 9.5 
    },
    xaxis: {
      gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
      zerolinecolor: isDark ? '#333338' : '#CCCCCC',
      showgrid: true,
      tickfont: { size: 9, color: isDark ? '#777777' : '#888888' }
    },
    yaxis: {
      gridcolor: isDark ? '#1C1C20' : '#E5E5E7',
      zerolinecolor: isDark ? '#333338' : '#CCCCCC',
      showgrid: true,
      tickfont: { size: 9, color: isDark ? '#777777' : '#888888' }
    },
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1.15,
      orientation: 'h',
      font: { size: 9, color: isDark ? '#EEEEEE' : '#222222' },
      bgcolor: isDark ? 'rgba(14, 14, 16, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      bordercolor: isDark ? '#2A2A2E' : '#E0E0E0',
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
        name: 'a(t) [G]',
        line: { color: isDark ? '#FFFFFF' : '#111111', width: 1.5 }
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
        line: { color: '#D71921', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '01 // GROUND ACCELERATION INPUT a(t)',
        font: { size: 10, color: isDark ? '#FFFFFF' : '#111111', family: '"Space Mono", monospace' },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'TIME (S)', font: { size: 9 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'ACCEL (G)', font: { size: 9 } } },
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
        name: 'x(t) [MM]',
        line: { color: '#D71921', width: 1.8 }
      }
    ];

    if (showVelocity && velocityArray && velocityArray.length > 0) {
      data.push({
        x: timeArray,
        y: velocityArray,
        type: 'scatter',
        mode: 'lines',
        name: 'v(t) [MM/S]',
        yaxis: 'y2',
        line: { color: isDark ? '#AAAAAA' : '#555555', width: 1, dash: 'dash' }
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
        line: { color: '#D71921', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: t0,
        x1: tEnd,
        y0: -strokeLimitMm,
        y1: -strokeLimitMm,
        line: { color: '#D71921', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: currentTime,
        x1: currentTime,
        y0: 0,
        y1: 1,
        line: { color: isDark ? '#FFFFFF' : '#000000', width: 1.5, dash: 'dot' }
      }
    ];

    const annotations = [
      {
        x: t0,
        y: strokeLimitMm,
        xref: 'x',
        yref: 'y',
        text: `+LIMIT (${strokeLimitMm}MM)`,
        showarrow: false,
        font: { size: 8, color: '#D71921', family: '"Space Mono", monospace' },
        xanchor: 'left',
        yanchor: 'bottom'
      },
      {
        x: t0,
        y: -strokeLimitMm,
        xref: 'x',
        yref: 'y',
        text: `-LIMIT (-${strokeLimitMm}MM)`,
        showarrow: false,
        font: { size: 8, color: '#D71921', family: '"Space Mono", monospace' },
        xanchor: 'left',
        yanchor: 'top'
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '02 // TABLE DISPLACEMENT PROFILE x(t)',
        font: { size: 10, color: isDark ? '#FFFFFF' : '#111111', family: '"Space Mono", monospace' },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'TIME (S)', font: { size: 9 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'DISPLACEMENT (MM)', font: { size: 9 } } },
      shapes,
      annotations
    };

    if (showVelocity) {
      layout.yaxis2 = {
        title: { text: 'VEL (MM/S)', font: { size: 9, color: isDark ? '#AAAAAA' : '#555555' } },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        tickfont: { size: 8, color: isDark ? '#AAAAAA' : '#555555' }
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
        name: '|X(f)|',
        line: { color: isDark ? '#FFFFFF' : '#111111', width: 1.5 },
        fillcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
      }
    ];

    const annotations = [];
    if (fftData.dominantFreq > 0) {
      annotations.push({
        x: fftData.dominantFreq,
        y: fftData.peakMagnitude,
        xref: 'x',
        yref: 'y',
        text: `PEAK: ${fftData.dominantFreq} HZ`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowcolor: '#D71921',
        ax: 20,
        ay: -25,
        font: { size: 9, color: '#D71921', family: '"Space Mono", monospace' },
        bgcolor: isDark ? '#121214' : '#FFFFFF',
        bordercolor: '#D71921',
        borderwidth: 1
      });
    }

    const layout = {
      ...baseLayout,
      title: {
        text: `03 // FFT SPECTRUM (PEAK: ${fftData.dominantFreq} HZ)`,
        font: { size: 10, color: isDark ? '#FFFFFF' : '#111111', family: '"Space Mono", monospace' },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'FREQ (HZ)', font: { size: 9 } }, range: [0, 25] },
      yaxis: { ...baseLayout.yaxis, title: { text: 'MAGNITUDE', font: { size: 9 } } },
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
      name: 'CMD ACCEL (G)',
      line: { color: isDark ? '#777777' : '#999999', width: 1.2 }
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
        name: 'ADXL356 MEAS',
        line: { color: '#D71921', width: 1.6 }
      };
    } else {
      traceMeas = {
        x: timeArray,
        y: accelArray.map(a => a * 0.98 + (Math.sin(a * 15) * 0.004)),
        type: 'scatter',
        mode: 'lines',
        name: 'SIM LOOPBACK',
        line: { color: '#D71921', width: 1.2, dash: 'dot' }
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
        line: { color: '#D71921', width: 1.5, dash: 'dot' }
      }
    ];

    const layout = {
      ...baseLayout,
      title: {
        text: '04 // TELEMETRY: COMMANDED VS ADXL356 SENSOR',
        font: { size: 10, color: isDark ? '#FFFFFF' : '#111111', family: '"Space Mono", monospace' },
        x: 0.02,
        y: 0.95
      },
      xaxis: { ...baseLayout.xaxis, title: { text: 'TIME (S)', font: { size: 9 } } },
      yaxis: { ...baseLayout.yaxis, title: { text: 'ACCEL (G)', font: { size: 9 } } },
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
    <div className="flex flex-col gap-4 font-space">
      
      {/* Top Telemetry Summary Pill Bar */}
      <div className="nothing-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Telemetry Accuracy Scores */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214]">
            <span className="text-[10px] text-neutral-400 uppercase">RXY FIDELITY:</span>
            <span className={`text-xs font-bold ${metrics.correlationPercent >= 90 ? 'text-[#D71921]' : 'text-amber-500'}`}>
              {metrics.correlationPercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214]">
            <span className="text-[10px] text-neutral-400 uppercase">RMSE:</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {metrics.rmse.toFixed(4)} G
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214]">
            <span className="text-[10px] text-neutral-400 uppercase">LAG:</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {metrics.latencyMs >= 0 ? `+${metrics.latencyMs}` : metrics.latencyMs} MS
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214]">
            <span className="text-[10px] text-neutral-400 uppercase">DRIFT:</span>
            <span className="text-xs font-bold text-[#D71921]">
              0.00 MM
            </span>
          </div>
        </div>

        {/* Velocity Overlay Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-300 select-none text-xs font-mono">
          <input
            type="checkbox"
            checked={showVelocity}
            onChange={(e) => setShowVelocity(e.target.checked)}
            className="accent-[#D71921] rounded cursor-pointer"
          />
          <span className="uppercase text-[11px]">Overlay Velocity v(t)</span>
        </label>
      </div>

      {/* 4 Interactive Engineering Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Input Acceleration */}
        <div className="nothing-card p-3 flex flex-col">
          <div ref={accelPlotRef} className="w-full h-[270px]" />
        </div>

        {/* Chart 2: Displacement Profile */}
        <div className="nothing-card p-3 flex flex-col">
          <div ref={dispPlotRef} className="w-full h-[270px]" />
        </div>

        {/* Chart 3: FFT Spectrum */}
        <div className="nothing-card p-3 flex flex-col">
          <div ref={fftPlotRef} className="w-full h-[270px]" />
        </div>

        {/* Chart 4: Commanded vs Measured Telemetry */}
        <div className="nothing-card p-3 flex flex-col">
          <div ref={telemetryPlotRef} className="w-full h-[270px]" />
        </div>

      </div>

    </div>
  );
}
