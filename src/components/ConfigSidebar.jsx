import React from 'react';
import { 
  Settings, 
  Cpu, 
  Sliders, 
  Maximize2, 
  ShieldAlert, 
  Filter, 
  Gauge, 
  SlidersHorizontal
} from 'lucide-react';
import { NothingSelect } from './NothingSelect';

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

  const beltOptions = [
    { value: 2, label: 'GT2 (2.0 mm Pitch)' },
    { value: 3, label: 'GT3 (3.0 mm Pitch)' },
    { value: 1, label: 'Direct Leadscrew (1.0 mm)' },
    { value: 8, label: 'T8 Leadscrew (8.0 mm)' }
  ];

  const pulleyOptions = [
    { value: 16, label: '16T (32 mm/rev)' },
    { value: 20, label: '20T (40 mm/rev)' },
    { value: 24, label: '24T (48 mm/rev)' },
    { value: 32, label: '32T (64 mm/rev)' }
  ];

  const motorOptions = [
    { value: 200, label: 'NEMA 17 (1.8° / 200 Steps)' },
    { value: 400, label: 'NEMA 17 (0.9° / 400 Steps)' }
  ];

  const microsteppingOptions = [
    { value: 8, label: '1/8 Microstepping' },
    { value: 16, label: '1/16 Microstepping' },
    { value: 32, label: '1/32 Microstepping' },
    { value: 64, label: '1/64 Microstepping' }
  ];

  return (
    <div className="nothing-card p-5 flex flex-col gap-4 text-xs font-space">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D71921]" />
          <h2 className="font-ndot text-sm tracking-wider uppercase text-neutral-900 dark:text-neutral-100 font-bold">
            HARDWARE KINEMATICS
          </h2>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
          [ TMC2209 // 02 ]
        </span>
      </div>

      {/* Calculated Kinematics Box */}
      <div className="bg-neutral-100 dark:bg-[#141416] rounded-xl p-3.5 border border-neutral-200 dark:border-neutral-800 font-mono">
        <div className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 flex items-center justify-between">
          <span>DRIVE RESOLUTION</span>
          <span className="text-[#D71921] font-bold">CALIBRATED</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stepsPerMm}</span>
          <span className="text-xs text-neutral-500 font-mono uppercase">STEPS / MM</span>
        </div>
        <div className="text-[10px] text-neutral-400 font-mono mt-1.5 flex justify-between border-t border-neutral-200 dark:border-neutral-800/80 pt-1.5">
          <span>1 STEP = {(1 / stepsPerMm * 1000).toFixed(1)} µM</span>
          <span>{mmPerRev} MM / REV</span>
        </div>
      </div>

      {/* Mechanical Transmission */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Sliders className="w-3.5 h-3.5 text-[#D71921]" />
          <span>TRANSMISSION & DRIVE</span>
        </div>

        {/* Belt Pitch & Pulley Teeth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Belt Type</label>
            <NothingSelect
              value={beltPitchMm}
              onChange={(val) => onChangeConfig({ beltPitchMm: parseFloat(val) })}
              options={beltOptions}
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Pulley Teeth</label>
            <NothingSelect
              value={pulleyTeeth}
              onChange={(val) => onChangeConfig({ pulleyTeeth: parseInt(val) })}
              options={pulleyOptions}
            />
          </div>
        </div>

        {/* Stepper Motor & Microstepping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Motor Step Angle</label>
            <NothingSelect
              value={motorStepsPerRev}
              onChange={(val) => onChangeConfig({ motorStepsPerRev: parseInt(val) })}
              options={motorOptions}
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Microstepping</label>
            <NothingSelect
              value={microstepping}
              onChange={(val) => onChangeConfig({ microstepping: parseInt(val) })}
              options={microsteppingOptions}
            />
          </div>
        </div>
      </div>

      {/* Safety Stroke Bounds */}
      <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D71921]" />
            <span>STROKE & LIMITS</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">BED: {strokeLimitMm * 2}MM TOTAL</span>
        </div>

        {/* Stroke Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono">
            <span>STROKE ENVELOPE (±X MM)</span>
            <span className="font-mono text-[#D71921] font-bold">±{strokeLimitMm} MM</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={strokeLimitMm}
            onChange={(e) => onChangeConfig({ strokeLimitMm: parseFloat(e.target.value) })}
            className="w-full accent-[#D71921] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Warning Banner */}
        {strokeWarning?.exceedsLimit && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>STROKE EXCEEDED (±{strokeWarning.peakAbsoluteDisp} MM)</span>
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Table stroke envelope limit is ±{strokeLimitMm} mm.
            </p>
            <button
              onClick={() => onApplyRecommendedScale(strokeWarning.recommendedScale)}
              className="mt-2.5 w-full py-1.5 bg-[#D71921] hover:bg-[#b5141b] text-white rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer uppercase"
            >
              Auto-Clamp to {Math.round(strokeWarning.recommendedScale * 100)}%
            </button>
          </div>
        )}

        {/* Speed & Accel limits */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Max Velocity</label>
            <div className="relative">
              <input
                type="number"
                value={maxVelocityMmS}
                onChange={(e) => onChangeConfig({ maxVelocityMmS: parseFloat(e.target.value) || 100 })}
                className="w-full bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
              />
              <span className="absolute right-2 top-2 text-[10px] text-neutral-400 font-mono">MM/S</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono uppercase">Max Accel</label>
            <div className="relative">
              <input
                type="number"
                value={maxAccelMmS2}
                onChange={(e) => onChangeConfig({ maxAccelMmS2: parseFloat(e.target.value) || 2000 })}
                className="w-full bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
              />
              <span className="absolute right-2 top-2 text-[10px] text-neutral-400 font-mono">MM/S²</span>
            </div>
          </div>
        </div>
      </div>

      {/* DSP Pipeline Tuning */}
      <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#D71921]" />
            <span>DSP & DRIFT FILTER</span>
          </div>
          <span className="text-[10px] text-[#D71921] font-mono">2ND-ORDER</span>
        </div>

        {/* High-Pass Cutoff Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono">
            <span>BUTTERWORTH CUTOFF (FC)</span>
            <span className="font-mono text-[#D71921] font-bold">{hpCutoffHz.toFixed(2)} HZ</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.50"
            step="0.05"
            value={hpCutoffHz}
            onChange={(e) => onChangeConfig({ hpCutoffHz: parseFloat(e.target.value) })}
            className="w-full accent-[#D71921] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
            <span>0.05 HZ</span>
            <span>0.20 HZ (DEFAULT)</span>
            <span>1.50 HZ</span>
          </div>
        </div>

        {/* Acceleration Unit Selection */}
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-[#141416] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
          <span className="text-xs text-neutral-600 dark:text-neutral-400 uppercase">Input Units</span>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-neutral-200 dark:bg-[#1a1a1c]">
            <button
              onClick={() => onChangeConfig({ accelUnit: 'g' })}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                accelUnit === 'g'
                  ? 'bg-white dark:bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              G
            </button>
            <button
              onClick={() => onChangeConfig({ accelUnit: 'm/s2' })}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                accelUnit === 'm/s2'
                  ? 'bg-white dark:bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              M/S²
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
