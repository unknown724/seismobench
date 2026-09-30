import React, { useMemo } from 'react';
import { Layers, Activity, AlertCircle, Compass, Cpu } from 'lucide-react';

export function ShakeTableVisualizer({
  currentDispMm = 0,
  currentAccelG = 0,
  currentVelocityMmS = 0,
  strokeLimitMm = 40,
  connectionState,
  isSimulated
}) {
  // Clamp visual position within graphical rail view
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
    <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col gap-3.5 transition-all">
      
      {/* Header and Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight text-xs uppercase flex items-center gap-2">
              <span>Mechanical Kinematics & Carriage</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
              Dual NEMA 17 • GT2 2mm Pitch • ADXL356 Telemetry Loop
            </p>
          </div>
        </div>

        {/* Live Telemetry Readouts */}
        <div className="flex items-center gap-2.5 font-tabular text-xs">
          {/* Position */}
          <div className="flex items-center gap-2 bg-neutral-100/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-inner">
            <span className="text-neutral-400 text-[10px] font-mono uppercase">Pos</span>
            <span className={`font-bold ${isExceeded ? 'text-[#FF453A] animate-pulse' : 'text-[#0071E3] dark:text-[#0A84FF]'}`}>
              {currentDispMm >= 0 ? `+${currentDispMm.toFixed(2)}` : currentDispMm.toFixed(2)} mm
            </span>
          </div>

          {/* Velocity */}
          <div className="flex items-center gap-2 bg-neutral-100/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-inner">
            <span className="text-neutral-400 text-[10px] font-mono uppercase">Vel</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentVelocityMmS >= 0 ? `+${currentVelocityMmS.toFixed(1)}` : currentVelocityMmS.toFixed(1)} mm/s
            </span>
          </div>

          {/* Acceleration */}
          <div className="flex items-center gap-2 bg-neutral-100/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-inner">
            <span className="text-neutral-400 text-[10px] font-mono uppercase">Accel</span>
            <span className="text-amber-500 font-bold">
              {currentAccelG >= 0 ? `+${currentAccelG.toFixed(3)}` : currentAccelG.toFixed(3)} g
            </span>
          </div>
        </div>
      </div>

      {/* SVG Hardware Diagram with Liquid Specular Styling */}
      <div className="relative w-full bg-neutral-100/70 dark:bg-[#0D1117]/85 rounded-2xl p-2.5 border border-black/[0.04] dark:border-white/[0.06] overflow-hidden flex flex-col items-center shadow-inner">
        
        <svg 
          viewBox="0 0 600 135" 
          className="w-full max-h-[140px] select-none"
        >
          <defs>
            {/* Linear rail gradient */}
            <linearGradient id="railGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Aluminum carriage gradient */}
            <linearGradient id="carriageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#0071E3" />
            </linearGradient>

            {/* Stepper motor pattern */}
            <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Machine Base Extrusion */}
          <rect x="20" y="98" width="560" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <line x1="20" y1="108" x2="580" y2="108" stroke="#0f172a" strokeWidth="2" strokeDasharray="6,4" />

          {/* Stepper Motor Left */}
          <rect x="15" y="45" width="34" height="52" rx="6" fill="url(#motorGrad)" stroke="#64748b" strokeWidth="1" />
          <circle cx="32" cy="71" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
          <text x="32" y="40" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">NEMA17 L</text>

          {/* Stepper Motor Right */}
          <rect x="551" y="45" width="34" height="52" rx="6" fill="url(#motorGrad)" stroke="#64748b" strokeWidth="1" />
          <circle cx="568" cy="71" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
          <text x="568" y="40" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">NEMA17 R</text>

          {/* Dual Precision Linear Shafts */}
          <rect x="45" y="60" width="510" height="6" rx="2" fill="url(#railGrad)" stroke="#475569" strokeWidth="0.5" />
          <rect x="45" y="80" width="510" height="6" rx="2" fill="url(#railGrad)" stroke="#475569" strokeWidth="0.5" />

          {/* GT2 Timing Belt Upper & Lower Path */}
          <line x1="32" y1="67" x2="568" y2="67" stroke="#30D158" strokeWidth="2" strokeDasharray="3,2" opacity="0.9" />
          <line x1="32" y1="75" x2="568" y2="75" stroke="#30D158" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />

          {/* Mechanical Endstop Bounds Markers */}
          {/* Left Limit */}
          <line 
            x1={leftLimitSvgX} 
            y1="38" 
            x2={leftLimitSvgX} 
            y2="100" 
            stroke={isExceeded && currentDispMm < 0 ? "#FF453A" : "#FF9F0A"} 
            strokeWidth="1.5" 
            strokeDasharray="4,3" 
          />
          <text x={leftLimitSvgX} y="32" fill="#FF453A" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            -{strokeLimitMm}mm
          </text>

          {/* Zero Center Line */}
          <line x1={centerSvgX} y1="42" x2={centerSvgX} y2="98" stroke="#0071E3" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
          <text x={centerSvgX} y="32" fill="#0A84FF" fontSize="9" fontFamily="monospace" textAnchor="middle">
            0.0
          </text>

          {/* Right Limit */}
          <line 
            x1={rightLimitSvgX} 
            y1="38" 
            x2={rightLimitSvgX} 
            y2="100" 
            stroke={isExceeded && currentDispMm > 0 ? "#FF453A" : "#FF9F0A"} 
            strokeWidth="1.5" 
            strokeDasharray="4,3" 
          />
          <text x={rightLimitSvgX} y="32" fill="#FF453A" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            +{strokeLimitMm}mm
          </text>

          {/* Sliding Carriage Assembly */}
          <g transform={`translate(${carriageSvgX - 45}, 48)`}>
            {/* Linear Bearing Blocks (LM8UU) */}
            <rect x="5" y="8" width="18" height="12" rx="3" fill="#64748b" stroke="#334155" />
            <rect x="67" y="8" width="18" height="12" rx="3" fill="#64748b" stroke="#334155" />
            <rect x="5" y="28" width="18" height="12" rx="3" fill="#64748b" stroke="#334155" />
            <rect x="67" y="28" width="18" height="12" rx="3" fill="#64748b" stroke="#334155" />

            {/* Aluminum Plate Carriage Bed */}
            <rect 
              x="0" 
              y="2" 
              width="90" 
              height="44" 
              rx="8" 
              fill={isExceeded ? "#be123c" : "url(#carriageGrad)"} 
              stroke={isExceeded ? "#FF453A" : "rgba(255,255,255,0.4)"} 
              strokeWidth="1.5" 
              className="transition-colors duration-150"
            />

            {/* Anodized bed grid pattern */}
            <line x1="22" y1="6" x2="22" y2="42" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="45" y1="6" x2="45" y2="42" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="68" y1="6" x2="68" y2="42" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

            {/* ADXL356 Accelerometer Sensor Board */}
            <rect x="33" y="14" width="24" height="20" rx="4" fill="#064e3b" stroke="#34D158" strokeWidth="1.5" />
            <circle cx="45" cy="24" r="3" fill="#30D158" />
            
            {/* Blinking sensor LED */}
            <circle 
              cx="52" 
              cy="18" 
              r="2" 
              fill={connectionState === 'RUNNING' ? "#30D158" : "#FF9F0A"} 
              className={connectionState === 'RUNNING' ? "animate-ping" : ""}
            />
            <text x="45" y="32" fill="#d1fae5" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              ADXL356
            </text>

            {/* Center Pointer */}
            <polygon points="45,46 41,51 49,51" fill="#64D2FF" />
          </g>

        </svg>

        {/* Safety Warning Indicator if Out of Bounds */}
        {isExceeded && (
          <div className="absolute top-2.5 right-2.5 bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 px-3 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>MECHANICAL STROKE LIMIT EXCEEDED</span>
          </div>
        )}
      </div>

      {/* Sensor Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0071E3] dark:bg-[#0A84FF] inline-block shadow-sm" />
            <span>Dual-Drive Carriage</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#30D158] inline-block shadow-sm" />
            <span>ADXL356 Sensor</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF453A] inline-block shadow-sm" />
            <span>Stroke Envelope (±{strokeLimitMm}mm)</span>
          </span>
        </div>
        <span className="text-neutral-400">GT2 Belt • 20T Pulley</span>
      </div>
    </div>
  );
}
