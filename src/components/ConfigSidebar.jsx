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
  CheckCircle2,
  SlidersHorizontal
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
    accelUnit
  } = config;

  // Calculated Steps per mm
  const stepsPerMm = Number(
    ((motorStepsPerRev * microstepping) / (pulleyTeeth * beltPitchMm)).toFixed(2)
  );

  const mmPerRev = pulleyTeeth * beltPitchMm;

  return (
    <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col gap-4 text-sm transition-all">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight text-xs uppercase">
              Hardware Parameters
            </h2>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
              Kinematics & Safety Bounds
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#0071E3] dark:text-[#0A84FF] px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium">
          TMC2209 UART
        </span>
      </div>

      {/* Calculated Kinematics Overview Box */}
      <div className="bg-neutral-100/70 dark:bg-white/[0.03] rounded-2xl p-3.5 border border-black/[0.04] dark:border-white/[0.06] font-tabular">
        <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Kinematic Resolution</span>
          <span className="text-emerald-500 font-bold text-xs">Calibrated</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stepsPerMm}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">steps / mm</span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono mt-1 flex justify-between">
          <span>1 Step = {(1 / stepsPerMm * 1000).toFixed(1)} µm</span>
          <span>{mmPerRev} mm / rev</span>
        </div>
      </div>

      {/* Form Fields: Mechanical Transmission */}
      <div className="space-y-3.5">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
          <span>Transmission & Drive</span>
        </div>

        {/* Belt Pitch & Pulley Teeth */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Belt Type</label>
            <select
              value={beltPitchMm}
              onChange={(e) => onChangeConfig({ beltPitchMm: parseFloat(e.target.value) })}
              className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#0071E3] font-mono shadow-inner"
            >
              <option value="2">GT2 (2.0 mm Pitch)</option>
              <option value="3">GT3 (3.0 mm Pitch)</option>
              <option value="1">Direct Leadscrew (1mm)</option>
              <option value="8">T8 Leadscrew (8mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Pulley Teeth</label>
            <select
              value={pulleyTeeth}
              onChange={(e) => onChangeConfig({ pulleyTeeth: parseInt(e.target.value) })}
              className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#0071E3] font-mono shadow-inner"
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
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Motor Step Angle</label>
            <select
              value={motorStepsPerRev}
              onChange={(e) => onChangeConfig({ motorStepsPerRev: parseInt(e.target.value) })}
              className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#0071E3] font-mono shadow-inner"
            >
              <option value="200">NEMA 17 (1.8° / 200)</option>
              <option value="400">NEMA 17 (0.9° / 400)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Microstepping</label>
            <select
              value={microstepping}
              onChange={(e) => onChangeConfig({ microstepping: parseInt(e.target.value) })}
              className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#0071E3] font-mono shadow-inner"
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
      <div className="space-y-3.5 border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Stroke & Limits</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Bed: {strokeLimitMm * 2}mm Total</span>
        </div>

        {/* Physical Stroke Limit */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-tabular">
            <span>Stroke Envelope (±X mm)</span>
            <span className="font-mono text-[#0071E3] dark:text-[#0A84FF] font-bold">±{strokeLimitMm} mm</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={strokeLimitMm}
            onChange={(e) => onChangeConfig({ strokeLimitMm: parseFloat(e.target.value) })}
            className="w-full accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Clip Alert Banner if displacement breaches stroke */}
        {strokeWarning?.exceedsLimit && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-rose-600 dark:text-rose-400 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Stroke Envelope Exceeded!</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
              Peak carriage displacement is <strong className="text-rose-600 dark:text-rose-400">±{strokeWarning.peakAbsoluteDisp} mm</strong> (Envelope limit: ±{strokeLimitMm} mm).
            </p>
            <button
              onClick={() => onApplyRecommendedScale(strokeWarning.recommendedScale)}
              className="mt-2.5 w-full py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-mono text-[11px] font-semibold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Auto-Clamp to {Math.round(strokeWarning.recommendedScale * 100)}%</span>
            </button>
          </div>
        )}

        {/* Max Velocity & Max Accel Limits */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Max Velocity</label>
            <div className="relative">
              <input
                type="number"
                value={maxVelocityMmS}
                onChange={(e) => onChangeConfig({ maxVelocityMmS: parseFloat(e.target.value) || 100 })}
                className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-mono shadow-inner"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-neutral-400">mm/s</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Max Accel</label>
            <div className="relative">
              <input
                type="number"
                value={maxAccelMmS2}
                onChange={(e) => onChangeConfig({ maxAccelMmS2: parseFloat(e.target.value) || 2000 })}
                className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-mono shadow-inner"
              />
              <span className="absolute right-2 top-1.5 text-[10px] text-neutral-400">mm/s²</span>
            </div>
          </div>
        </div>
      </div>

      {/* DSP Pipeline Tuning */}
      <div className="space-y-3.5 border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
            <span>DSP & Drift Filter</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">Zero-Phase</span>
        </div>

        {/* High-Pass Cutoff Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-tabular">
            <span>HP Butterworth Cutoff (fc)</span>
            <span className="font-mono text-[#0071E3] dark:text-[#0A84FF] font-bold">{hpCutoffHz.toFixed(2)} Hz</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.50"
            step="0.05"
            value={hpCutoffHz}
            onChange={(e) => onChangeConfig({ hpCutoffHz: parseFloat(e.target.value) })}
            className="w-full accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
            <span>0.05 Hz</span>
            <span>0.20 Hz (Default)</span>
            <span>1.50 Hz</span>
          </div>
        </div>

        {/* Acceleration Unit Selection */}
        <div className="flex items-center justify-between bg-neutral-100/70 dark:bg-white/[0.03] p-2.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Input Data Units</span>
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-200/60 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => onChangeConfig({ accelUnit: 'g' })}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                accelUnit === 'g' ? 'bg-white dark:bg-[#1C2128] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.1]' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              g
            </button>
            <button
              onClick={() => onChangeConfig({ accelUnit: 'm/s2' })}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                accelUnit === 'm/s2' ? 'bg-white dark:bg-[#1C2128] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.1]' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
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
