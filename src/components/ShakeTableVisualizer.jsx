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
  const normalizedPos = Math.max(-strokeLimitMm * 1.15, Math.min(strokeLimitMm * 1.15, currentDispMm));
  
  const centerSvgX = 300;
  const pixelsPerMm = 240 / strokeLimitMm;
  const carriageSvgX = centerSvgX + (normalizedPos * pixelsPerMm);
  const leftLimitSvgX = centerSvgX - (strokeLimitMm * pixelsPerMm);
  const rightLimitSvgX = centerSvgX + (strokeLimitMm * pixelsPerMm);

  const isExceeded = Math.abs(currentDispMm) > strokeLimitMm;

  return (
    <div className="nothing-card p-5 flex flex-col gap-3 font-space">
      
      {/* Header and Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#121214] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#D71921]" />
          </div>
          <div>
            <h2 className="font-ndot text-sm tracking-widest text-neutral-900 dark:text-neutral-100 font-bold uppercase flex items-center gap-2">
              <span>MECHANICAL KINEMATICS</span>
              <span className="text-[10px] text-neutral-400 font-mono">[ DUAL-GT2 ]</span>
            </h2>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider">
              CARRIAGE STROKE ENVELOPE // ADXL356 SENSOR LOOP
            </p>
          </div>
        </div>

        {/* Live Telemetry Readouts (Nothing OS Monospace Badges) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Position */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#141416] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">POS:</span>
            <span className={`font-bold font-tabular ${isExceeded ? 'text-[#D71921] animate-pulse' : 'text-neutral-900 dark:text-neutral-100'}`}>
              {currentDispMm >= 0 ? `+${currentDispMm.toFixed(2)}` : currentDispMm.toFixed(2)} MM
            </span>
          </div>

          {/* Velocity */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#141416] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">VEL:</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-bold font-tabular">
              {currentVelocityMmS >= 0 ? `+${currentVelocityMmS.toFixed(1)}` : currentVelocityMmS.toFixed(1)} MM/S
            </span>
          </div>

          {/* Acceleration */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#141416] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">ACCEL:</span>
            <span className="text-[#D71921] font-bold font-tabular">
              {currentAccelG >= 0 ? `+${currentAccelG.toFixed(3)}` : currentAccelG.toFixed(3)} G
            </span>
          </div>
        </div>
      </div>

      {/* SVG Hardware Diagram: Teenage Engineering & Nothing Industrial Design */}
      <div className="relative w-full bg-neutral-100 dark:bg-[#08080A] rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col items-center">
        
        <svg 
          viewBox="0 0 600 135" 
          className="w-full max-h-[140px] select-none"
        >
          <defs>
            {/* Matte Shaft Pattern */}
            <linearGradient id="nothingRail" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#737373" />
              <stop offset="50%" stopColor="#A3A3A3" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>

            {/* Nothing Red Carriage Accent */}
            <linearGradient id="nothingCarriage" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#222225" />
              <stop offset="100%" stopColor="#141416" />
            </linearGradient>
          </defs>

          {/* Machine Extrusion Base */}
          <rect x="20" y="98" width="560" height="20" rx="3" fill="#171717" stroke="#333333" strokeWidth="1" />
          <line x1="20" y1="108" x2="580" y2="108" stroke="#000000" strokeWidth="1.5" strokeDasharray="4,4" />

          {/* Stepper Motor Left */}
          <rect x="15" y="45" width="34" height="52" rx="4" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="1.2" />
          <circle cx="32" cy="71" r="9" fill="#0C0C0E" stroke="#555555" strokeWidth="1" />
          <text x="32" y="38" fill="#888888" fontSize="7.5" fontFamily="monospace" textAnchor="middle">M1 // L</text>

          {/* Stepper Motor Right */}
          <rect x="551" y="45" width="34" height="52" rx="4" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="1.2" />
          <circle cx="568" cy="71" r="9" fill="#0C0C0E" stroke="#555555" strokeWidth="1" />
          <text x="568" y="38" fill="#888888" fontSize="7.5" fontFamily="monospace" textAnchor="middle">M2 // R</text>

          {/* Dual Precision Linear Shafts */}
          <rect x="45" y="60" width="510" height="5" rx="1.5" fill="url(#nothingRail)" stroke="#444444" strokeWidth="0.5" />
          <rect x="45" y="80" width="510" height="5" rx="1.5" fill="url(#nothingRail)" stroke="#444444" strokeWidth="0.5" />

          {/* GT2 Timing Belt */}
          <line x1="32" y1="67" x2="568" y2="67" stroke="#D71921" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.9" />
          <line x1="32" y1="75" x2="568" y2="75" stroke="#D71921" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />

          {/* Left Limit */}
          <line 
            x1={leftLimitSvgX} 
            y1="36" 
            x2={leftLimitSvgX} 
            y2="102" 
            stroke="#D71921" 
            strokeWidth="1.5" 
            strokeDasharray="3,3" 
          />
          <text x={leftLimitSvgX} y="30" fill="#D71921" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            -{strokeLimitMm}MM
          </text>

          {/* Zero Center Line */}
          <line x1={centerSvgX} y1="40" x2={centerSvgX} y2="100" stroke="#777777" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
          <text x={centerSvgX} y="30" fill="#999999" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
            0.0
          </text>

          {/* Right Limit */}
          <line 
            x1={rightLimitSvgX} 
            y1="36" 
            x2={rightLimitSvgX} 
            y2="102" 
            stroke="#D71921" 
            strokeWidth="1.5" 
            strokeDasharray="3,3" 
          />
          <text x={rightLimitSvgX} y="30" fill="#D71921" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            +{strokeLimitMm}MM
          </text>

          {/* Sliding Carriage Assembly */}
          <g transform={`translate(${carriageSvgX - 45}, 48)`}>
            {/* Linear Bearing Blocks */}
            <rect x="5" y="8" width="18" height="12" rx="2" fill="#2E2E32" stroke="#444448" />
            <rect x="67" y="8" width="18" height="12" rx="2" fill="#2E2E32" stroke="#444448" />
            <rect x="5" y="28" width="18" height="12" rx="2" fill="#2E2E32" stroke="#444448" />
            <rect x="67" y="28" width="18" height="12" rx="2" fill="#2E2E32" stroke="#444448" />

            {/* Aluminum Plate Carriage Bed */}
            <rect 
              x="0" 
              y="2" 
              width="90" 
              height="44" 
              rx="4" 
              fill={isExceeded ? "#5A0004" : "url(#nothingCarriage)"} 
              stroke={isExceeded ? "#D71921" : "#55555A"} 
              strokeWidth="1.5" 
              className="transition-colors duration-150"
            />

            {/* Dot-matrix style grid pattern on carriage */}
            <circle cx="22" cy="14" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="45" cy="14" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="68" cy="14" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="22" cy="34" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="45" cy="34" r="1" fill="#FFFFFF" opacity="0.3" />
            <circle cx="68" cy="34" r="1" fill="#FFFFFF" opacity="0.3" />

            {/* ADXL356 Accelerometer Board */}
            <rect x="33" y="14" width="24" height="20" rx="3" fill="#0C0C0E" stroke="#D71921" strokeWidth="1" />
            
            {/* Red sensor status LED */}
            <circle 
              cx="45" 
              cy="22" 
              r="2.5" 
              fill="#D71921" 
              className={connectionState === 'RUNNING' ? "animate-ping" : ""}
            />
            <text x="45" y="31" fill="#FFFFFF" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              ADXL356
            </text>

            {/* Center Pointer */}
            <polygon points="45,46 41,50 49,50" fill="#D71921" />
          </g>

        </svg>

        {/* Warning Indicator */}
        {isExceeded && (
          <div className="absolute top-2.5 right-2.5 bg-[#D71921] text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>STROKE LIMIT BREACHED</span>
          </div>
        )}
      </div>

      {/* Sensor Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white inline-block" />
            <span>CARRIAGE BED</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D71921] inline-block" />
            <span>ADXL356</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#D71921] inline-block" />
            <span>±{strokeLimitMm}MM ENVELOPE</span>
          </span>
        </div>
        <span>GT2 // 20T PULLEY</span>
      </div>
    </div>
  );
}
