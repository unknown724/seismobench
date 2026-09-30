import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Upload, 
  Database, 
  Sparkles, 
  Clock, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { parseSeismogramCSV } from '../data/earthquakes';
import { NothingSelect } from './NothingSelect';

export function DataIngestionPanel({
  selectedEarthquakeId,
  onSelectEarthquake,
  customWaveform,
  onUploadCustomCSV,
  waveformMeta,
  amplitudeScale,
  onChangeAmplitudeScale,
  timeScale,
  onChangeTimeScale
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileProcess = (file) => {
    setUploadError(null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseSeismogramCSV(text);
        onUploadCustomCSV({
          id: 'custom-' + Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          location: 'Custom Uploaded CSV',
          date: new Date().toLocaleDateString(),
          description: `Custom uploaded file (${file.name}) containing ${parsed.time.length} points with sampling interval ${parsed.dt}s.`,
          pga: parsed.pga,
          duration: parsed.duration,
          dt: parsed.dt,
          time: parsed.time,
          accel: parsed.accel,
          detectedUnit: parsed.detectedUnit
        });
      } catch (err) {
        setUploadError(err.message || 'Failed to parse CSV file. Ensure columns contain time and acceleration.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const earthquakeOptions = [
    { value: 'elcentro', label: '1940 El Centro (Imperial Valley, CA - 0.348g)' },
    { value: 'kobe', label: '1995 Kobe JMA (Hanshin High Velocity Pulse - 0.820g)' },
    { value: 'northridge', label: '1994 Northridge (Sylmar Hospital Fling Step - 0.843g)' },
    { value: 'sweep', label: 'Synthetic Sine Sweep (1 Hz - 15 Hz Modal Test)' }
  ];

  if (customWaveform) {
    earthquakeOptions.push({
      value: customWaveform.id,
      label: `[CUSTOM CSV] ${customWaveform.name}`
    });
  }

  return (
    <div className="nothing-card p-5 flex flex-col gap-4 text-xs font-space">
      
      {/* Title & Section Tag */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D71921]" />
          <h2 className="font-ndot text-sm tracking-wider uppercase text-neutral-900 dark:text-neutral-100 font-bold">
            WAVEFORM INGESTION
          </h2>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
          [ SOURCE // 01 ]
        </span>
      </div>

      {/* Preset Earthquakes Custom Dropdown */}
      <div>
        <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider font-mono">
          Benchmark Earthquake Record
        </label>
        <NothingSelect
          value={selectedEarthquakeId}
          onChange={onSelectEarthquake}
          options={earthquakeOptions}
        />
      </div>

      {/* Drag & Drop CSV Uploader */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.dat"
          onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          className="hidden"
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#D71921] bg-[#D71921]/10'
              : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-[#121214]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <Upload className="w-4 h-4 text-neutral-400" />
            <p className="text-xs text-neutral-700 dark:text-neutral-300 font-mono">
              DROP SEISMOGRAM CSV OR <span className="text-[#D71921] underline">BROWSE</span>
            </p>
            <p className="text-[10px] text-neutral-400 font-mono">
              FORMAT: TIME (S), ACCEL (G OR M/S²)
            </p>
          </div>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-rose-500 font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
            {uploadError}
          </p>
        )}
      </div>

      {/* Waveform Statistics Readout */}
      {waveformMeta && (
        <div className="grid grid-cols-2 gap-2 bg-neutral-100 dark:bg-[#141416] p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">PEAK ACCEL (PGA)</span>
            <span className="text-[#D71921] font-bold text-sm">
              {(waveformMeta.pga * amplitudeScale).toFixed(3)} G
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">DURATION</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-bold text-sm">
              {(waveformMeta.duration / timeScale).toFixed(1)} S
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">SAMPLING FREQ</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {(1 / waveformMeta.dt * timeScale).toFixed(0)} HZ
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-neutral-400 uppercase block tracking-wider">BUFFER POINTS</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {waveformMeta.pointCount.toLocaleString()} PTS
            </span>
          </div>
        </div>
      )}

      {/* Waveform Scaling Multipliers */}
      <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <div className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D71921]" />
            <span>WAVEFORM SCALING</span>
          </div>
          <button
            onClick={() => { onChangeAmplitudeScale(1.0); onChangeTimeScale(1.0); }}
            className="text-[10px] text-neutral-400 hover:text-[#D71921] flex items-center gap-1 font-mono transition-colors"
            title="Reset scaling factors to 1.0x"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>

        {/* Amplitude Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono">
            <span>AMPLITUDE GAIN</span>
            <span className="text-[#D71921] font-bold">{amplitudeScale.toFixed(2)}X</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={amplitudeScale}
            onChange={(e) => onChangeAmplitudeScale(parseFloat(e.target.value))}
            className="w-full accent-[#D71921] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Time Scale Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-mono">
            <span>SPEED / TIME SCALE</span>
            <span className="text-[#D71921] font-bold">{timeScale.toFixed(2)}X</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={timeScale}
            onChange={(e) => onChangeTimeScale(parseFloat(e.target.value))}
            className="w-full accent-[#D71921] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
}
