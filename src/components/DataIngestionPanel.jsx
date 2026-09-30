import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Upload, 
  Database, 
  Sparkles, 
  Clock, 
  Compass, 
  TrendingUp, 
  SlidersHorizontal,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { parseSeismogramCSV } from '../data/earthquakes';

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
          location: 'User Custom CSV',
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

  return (
    <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-xl flex flex-col gap-4 text-sm transition-all">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight text-xs uppercase">
              Waveform Ingestion
            </h2>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
              Calibrated Benchmark & Custom CSV
            </p>
          </div>
        </div>
      </div>

      {/* Preset Earthquakes Dropdown */}
      <div>
        <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5 font-medium">
          Historical Benchmark Records
        </label>
        <select
          value={selectedEarthquakeId}
          onChange={(e) => onSelectEarthquake(e.target.value)}
          className="w-full bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071E3] dark:focus:border-[#0A84FF] rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none transition-all shadow-inner"
        >
          <option value="elcentro">1940 El Centro (NS Component - Imperial Valley)</option>
          <option value="kobe">1995 Kobe (Kobe JMA Station - High Velocity Pulse)</option>
          <option value="northridge">1994 Northridge (Sylmar Station - Fling Step)</option>
          <option value="sweep">Synthetic Sine Sweep (1 Hz - 15 Hz Resonance Test)</option>
          {customWaveform && (
            <option value={customWaveform.id}>[Custom CSV] {customWaveform.name}</option>
          )}
        </select>
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
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#0071E3] dark:border-[#0A84FF] bg-blue-500/10'
              : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16] bg-neutral-100/50 dark:bg-white/[0.02]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <Upload className="w-5 h-5 text-neutral-400 group-hover:text-[#0071E3]" />
            <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              Drop custom seismogram CSV or <span className="text-[#0071E3] dark:text-[#0A84FF] underline">browse</span>
            </p>
            <p className="text-[10px] text-neutral-400 font-mono">
              Columns: time (s), accel (g or m/s²)
            </p>
          </div>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-rose-500 font-mono bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            {uploadError}
          </p>
        )}
      </div>

      {/* Waveform Statistics Readout */}
      {waveformMeta && (
        <div className="grid grid-cols-2 gap-2.5 bg-neutral-100/70 dark:bg-white/[0.03] p-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] font-tabular text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Peak Accel (PGA)</span>
            <span className="text-[#0071E3] dark:text-[#0A84FF] font-bold text-sm">
              {(waveformMeta.pga * amplitudeScale).toFixed(3)} g
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Duration</span>
            <span className="text-neutral-800 dark:text-neutral-200 font-bold text-sm">
              {(waveformMeta.duration / timeScale).toFixed(1)} s
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Sampling Rate</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
              {(1 / waveformMeta.dt * timeScale).toFixed(0)} Hz <span className="text-[10px] text-neutral-400">({waveformMeta.dt.toFixed(3)}s)</span>
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Buffer Count</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
              {waveformMeta.pointCount.toLocaleString()} pts
            </span>
          </div>
        </div>
      )}

      {/* Waveform Scaling Multipliers */}
      <div className="space-y-3.5 border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
            <span>Waveform Scaling</span>
          </div>
          <button
            onClick={() => { onChangeAmplitudeScale(1.0); onChangeTimeScale(1.0); }}
            className="text-[11px] text-neutral-400 hover:text-[#0071E3] dark:hover:text-[#0A84FF] flex items-center gap-1 font-mono transition-colors"
            title="Reset scaling factors to 1.0x"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Amplitude Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-tabular">
            <span>Amplitude Multiplier</span>
            <span className="font-mono text-[#0071E3] dark:text-[#0A84FF] font-bold">{amplitudeScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={amplitudeScale}
            onChange={(e) => onChangeAmplitudeScale(parseFloat(e.target.value))}
            className="w-full accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Time Scale Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1 font-tabular">
            <span>Speed / Time Scale</span>
            <span className="font-mono text-[#0071E3] dark:text-[#0A84FF] font-bold">{timeScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={timeScale}
            onChange={(e) => onChangeTimeScale(parseFloat(e.target.value))}
            className="w-full accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
}
