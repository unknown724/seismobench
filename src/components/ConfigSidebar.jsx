import React from 'react';
import { 
  Settings, 
  Cpu, 
  Sliders, 
  Maximize2, 
  ShieldAlert, 
  Filter, 
  Gauge, 
  HelpCircle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export function ConfigSidebar({
  config,
  onChangeConfig,
  strokeWarning,
  onApplyRecommendedScale
}) {
  const {
    beltPitchMm,
    pulleyTeeth,
    motorStepsPerRev,
    microstepping,
    strokeLimitMm,
    maxVelocityMmS,
    maxAccelMmS2,
    hpCutoffHz,
    autoScaleExceeding,
    accelUnit
  } = config;

  // Calculated Steps per mm
  const stepsPerMm = Number(
    ((motorStepsPerRev * microstepping) / (pulleyTeeth * beltPitchMm)).toFixed(2)
  );

  const mmPerRev = pulleyTeeth * beltPitchMm;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-5 text-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 tracking-wide text-sm uppercase">
            Hardware & Mechanics
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
          Dual TMC2209
        </span>
      </div>

      {/* Calculated Kinematics Overview Box */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 font-mono">
        <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Kinematic Resolution</span>
          <span className="text-emerald-400 text-xs font-semibold">TMC2209 UART</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-cyan-400">{stepsPerMm}</span>
          <span className="text-xs text-slate-400">steps / mm</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
          <span>1 Step = {(1 / stepsPerMm * 1000).toFixed(1)} µm</span>
          <span>{mmPerRev} mm / rev</span>
        </div>
      </div>

      {/* Form Fields: Mechanical Transmission */}
      <div className="space-y-3.5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transmission & Drive</span>
        </div>

        {/* Belt Pitch & Pulley Teeth */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Belt Type</label>
            <select
              value={beltPitchMm}
              onChange={(e) => onChangeConfig({ beltPitchMm: parseFloat(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="2">GT2 (2.0 mm Pitch)</option>
              <option value="3">GT3 (3.0 mm Pitch)</option>
              <option value="1">Direct Leadscrew (1mm)</option>
              <option value="8">T8 Leadscrew (8mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Pulley Teeth</label>
            <select
              value={pulleyTeeth}
              onChange={(e) => onChangeConfig({ pulleyTeeth: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="16">16T (32 mm/rev)</option>
              <option value="20">20T (40 mm/rev)</option>
              <option value="24">24T (48 mm/rev)</option>
              <option value="32">32T (64 mm/rev)</option>
            </select>
          </div>
        </div>

        {/* Stepper Motor & Microstepping */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Motor Type</label>
            <select
              value={motorStepsPerRev}
              onChange={(e) => onChangeConfig({ motorStepsPerRev: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="200">NEMA 17 (1.8° / 200)</option>
              <option value="400">NEMA 17 (0.9° / 400)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Microstepping</label>
            <select
              value={microstepping}
              onChange={(e) => onChangeConfig({ microstepping: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="8">1/8 Microstepping</option>
              <option value="16">1/16 Microstepping</option>
              <option value="32">1/32 Microstepping</option>
              <option value="64">1/64 Microstepping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Safety Clamping & Stroke Limits */}
      <div className="space-y-3.5 border-t border-slate-800 pt-3.5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Stroke & Limits</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Bed: {strokeLimitMm * 2}mm Total</span>
        </div>

        {/* Physical Stroke Limit */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Stroke Limit (±X mm)</span>
            <span className="font-mono text-cyan-300 font-semibold">±{strokeLimitMm} mm</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={strokeLimitMm}
            onChange={(e) => onChangeConfig({ strokeLimitMm: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
        </div>

        {/* Clip Alert Banner if displacement breaches stroke */}
        {strokeWarning?.exceedsLimit && (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-lg p-2.5 text-rose-300 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Table Stroke Exceeded!</span>
            </div>
            <p className="text-[11px] text-rose-300/90 mt-1">
              Peak carriage displacement is <strong className="text-white">±{strokeWarning.peakAbsoluteDisp} mm</strong> (Limit: ±{strokeLimitMm} mm).
            </p>
            <button
              onClick={() => onApplyRecommendedScale(strokeWarning.recommendedScale)}
              className="mt-2 w-full py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <span>Auto-Clamp to {Math.round(strokeWarning.recommendedScale * 100)}%</span>
            </button>
          </div>
        )}

        {/* Max Velocity & Max Accel Limits */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Max Velocity</label>
            <div className="relative">
              <input
                type="number"
                value={maxVelocityMmS}
                onChange={(e) => onChangeConfig({ maxVelocityMmS: parseFloat(e.target.value) || 100 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 font-mono"
              />
              <span className="absolute right-2 top-1 text-[10px] text-slate-500">mm/s</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Max Accel</label>
            <div className="relative">
              <input
                type="number"
                value={maxAccelMmS2}
                onChange={(e) => onChangeConfig({ maxAccelMmS2: parseFloat(e.target.value) || 2000 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 font-mono"
              />
              <span className="absolute right-2 top-1 text-[10px] text-slate-500">mm/s²</span>
            </div>
          </div>
        </div>
      </div>

      {/* DSP Pipeline Tuning */}
      <div className="space-y-3.5 border-t border-slate-800 pt-3.5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>DSP & Drift Filter</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Zero-Phase</span>
        </div>

        {/* High-Pass Cutoff Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>HP Butterworth Cutoff (fc)</span>
            <span className="font-mono text-cyan-300 font-semibold">{hpCutoffHz.toFixed(2)} Hz</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.50"
            step="0.05"
            value={hpCutoffHz}
            onChange={(e) => onChangeConfig({ hpCutoffHz: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
            <span>0.05 Hz (Sub-audio)</span>
            <span>0.20 Hz (Default)</span>
            <span>1.50 Hz</span>
          </div>
        </div>

        {/* Acceleration Unit Selection */}
        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-xs text-slate-300">Input Data Units</span>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => onChangeConfig({ accelUnit: 'g' })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                accelUnit === 'g' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              g
            </button>
            <button
              onClick={() => onChangeConfig({ accelUnit: 'm/s2' })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                accelUnit === 'm/s2' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              m/s²
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
