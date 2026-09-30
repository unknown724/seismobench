import React, { useMemo } from 'react';
import { Layers, Activity, AlertCircle, Compass } from 'lucide-react';

export function ShakeTableVisualizer({
  currentDispMm = 0,
  currentAccelG = 0,
  currentVelocityMmS = 0,
  strokeLimitMm = 40,
  connectionState,
  isSimulated
}) {
  // Clamp visual position within graphical rail view
  const railLengthMm = strokeLimitMm * 2.4; // visual width in mm
  const normalizedPos = Math.max(-strokeLimitMm * 1.15, Math.min(strokeLimitMm * 1.15, currentDispMm));
  
  // Convert position in mm to SVG coordinates (width 600)
  // center is at x = 300
  const centerSvgX = 300;
  const pixelsPerMm = 240 / strokeLimitMm;
  const carriageSvgX = centerSvgX + (normalizedPos * pixelsPerMm);
  const leftLimitSvgX = centerSvgX - (strokeLimitMm * pixelsPerMm);
  const rightLimitSvgX = centerSvgX + (strokeLimitMm * pixelsPerMm);

  const isExceeded = Math.abs(currentDispMm) > strokeLimitMm;
  const isCloseToLimit = Math.abs(currentDispMm) > strokeLimitMm * 0.85;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header and Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 tracking-wide text-xs uppercase">
            Mechanical Kinematics & Table Carriage
          </h2>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Pos:</span>
            <span className={`font-bold ${isExceeded ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
              {currentDispMm >= 0 ? `+${currentDispMm.toFixed(2)}` : currentDispMm.toFixed(2)} mm
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Vel:</span>
            <span className="text-emerald-400 font-semibold">
              {currentVelocityMmS >= 0 ? `+${currentVelocityMmS.toFixed(1)}` : currentVelocityMmS.toFixed(1)} mm/s
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Accel:</span>
            <span className="text-amber-400 font-semibold">
              {currentAccelG >= 0 ? `+${currentAccelG.toFixed(3)}` : currentAccelG.toFixed(3)} g
            </span>
          </div>
        </div>
      </div>

      {/* SVG Hardware Diagram */}
      <div className="relative w-full bg-slate-950 rounded-lg p-2 border border-slate-800 overflow-hidden flex flex-col items-center">
        
        <svg 
          viewBox="0 0 600 135" 
          className="w-full max-h-[140px] select-none"
        >
          <defs>
            {/* Linear rail gradient */}
            <linearGradient id="railGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Aluminum carriage gradient */}
            <linearGradient id="carriageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* NEMA 17 motor pattern */}
            <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Machine Base Extrusion */}
          <rect x="20" y="98" width="560" height="20" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <line x1="20" y1="108" x2="580" y2="108" stroke="#1e293b" strokeWidth="2" strokeDasharray="6,4" />

          {/* Stepper Motor Left */}
          <rect x="15" y="45" width="34" height="52" rx="4" fill="url(#motorGrad)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="32" cy="71" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <text x="32" y="40" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">NEMA17 L</text>

          {/* Idler Pulley Right */}
          <rect x="551" y="45" width="34" height="52" rx="4" fill="url(#motorGrad)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="568" cy="71" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <text x="568" y="40" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">NEMA17 R</text>

          {/* Dual Precision Linear Shafts */}
          <rect x="45" y="60" width="510" height="6" rx="2" fill="url(#railGrad)" stroke="#64748b" strokeWidth="0.5" />
          <rect x="45" y="80" width="510" height="6" rx="2" fill="url(#railGrad)" stroke="#64748b" strokeWidth="0.5" />

          {/* GT2 Timing Belt Upper & Lower Path */}
          <line x1="32" y1="67" x2="568" y2="67" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3,2" opacity="0.85" />
          <line x1="32" y1="75" x2="568" y2="75" stroke="#10b981" strokeWidth="2" strokeDasharray="3,2" opacity="0.6" />

          {/* Mechanical Endstop Bounds Markers */}
          {/* Left Limit */}
          <line 
            x1={leftLimitSvgX} 
            y1="38" 
            x2={leftLimitSvgX} 
            y2="100" 
            stroke={isExceeded && currentDispMm < 0 ? "#f43f5e" : "#e11d48"} 
            strokeWidth="2" 
            strokeDasharray="4,3" 
          />
          <text x={leftLimitSvgX} y="32" fill="#f43f5e" fontSize="9" fontFamily="monospace" textAnchor="middle">
            -{strokeLimitMm}mm
          </text>

          {/* Zero Center Line */}
          <line x1={centerSvgX} y1="42" x2={centerSvgX} y2="98" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
          <text x={centerSvgX} y="32" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
            0.0
          </text>

          {/* Right Limit */}
          <line 
            x1={rightLimitSvgX} 
            y1="38" 
            x2={rightLimitSvgX} 
            y2="100" 
            stroke={isExceeded && currentDispMm > 0 ? "#f43f5e" : "#e11d48"} 
            strokeWidth="2" 
            strokeDasharray="4,3" 
          />
          <text x={rightLimitSvgX} y="32" fill="#f43f5e" fontSize="9" fontFamily="monospace" textAnchor="middle">
            +{strokeLimitMm}mm
          </text>

          {/* Sliding Carriage Assembly */}
          <g transform={`translate(${carriageSvgX - 45}, 48)`}>
            {/* Linear Bearing Blocks (LM8UU) */}
            <rect x="5" y="8" width="18" height="12" rx="2" fill="#64748b" stroke="#334155" />
            <rect x="67" y="8" width="18" height="12" rx="2" fill="#64748b" stroke="#334155" />
            <rect x="5" y="28" width="18" height="12" rx="2" fill="#64748b" stroke="#334155" />
            <rect x="67" y="28" width="18" height="12" rx="2" fill="#64748b" stroke="#334155" />

            {/* Aluminum Plate Carriage Bed */}
            <rect 
              x="0" 
              y="2" 
              width="90" 
              height="44" 
              rx="5" 
              fill={isExceeded ? "#be123c" : "#0284c7"} 
              stroke={isExceeded ? "#f43f5e" : "#38bdf8"} 
              strokeWidth="2" 
              className="transition-colors duration-150"
            />

            {/* Anodized bed grid pattern */}
            <line x1="22" y1="6" x2="22" y2="42" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="45" y1="6" x2="45" y2="42" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <line x1="68" y1="6" x2="68" y2="42" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* ADXL356 Accelerometer Sensor Board */}
            <rect x="33" y="14" width="24" height="20" rx="3" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="45" cy="24" r="3" fill="#4ade80" />
            {/* Blinking sensor LED */}
            <circle 
              cx="52" 
              cy="18" 
              r="2" 
              fill={connectionState === 'RUNNING' ? "#22c55e" : "#eab308"} 
              className={connectionState === 'RUNNING' ? "animate-ping" : ""}
            />
            <text x="45" y="32" fill="#bbf7d0" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              ADXL356
            </text>

            {/* Center Pointer */}
            <polygon points="45,46 41,51 49,51" fill="#38bdf8" />
          </g>

        </svg>

        {/* Safety Warning Indicator if Out of Bounds */}
        {isExceeded && (
          <div className="absolute top-2 right-2 bg-rose-950/90 text-rose-300 border border-rose-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>MECHANICAL STROKE LIMIT REACHED</span>
          </div>
        )}
      </div>

      {/* Sensor Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
            <span>Dual-Drive Carriage</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
            <span>ADXL356 Accelerometer</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Soft Stroke Limits (±{strokeLimitMm}mm)</span>
          </span>
        </div>
        <span>GT2 Belt 20T Pulley</span>
      </div>
    </div>
  );
}
