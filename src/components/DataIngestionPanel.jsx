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
  Check
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4 text-sm">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 tracking-wide text-sm uppercase">
            Data Ingestion & Waveform
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Seismogram Ingest
        </span>
      </div>

      {/* Preset Earthquakes Dropdown */}
      <div>
        <label className="block text-[11px] text-slate-400 mb-1 font-medium">
          Historical Benchmark & Synthetic Profiles
        </label>
        <select
          value={selectedEarthquakeId}
          onChange={(e) => onSelectEarthquake(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium font-mono"
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
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
            <p className="text-xs text-slate-300 font-medium">
              Drop custom seismogram CSV or <span className="text-cyan-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Columns: time (s), accel (g or m/s²)
            </p>
          </div>
        </div>

        {uploadError && (
          <p className="mt-1.5 text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/60">
            {uploadError}
          </p>
        )}
      </div>

      {/* Waveform Statistics Readout */}
      {waveformMeta && (
        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Peak Ground Accel (PGA)</span>
            <span className="text-cyan-400 font-bold text-sm">
              {(waveformMeta.pga * amplitudeScale).toFixed(3)} g
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Effective Duration</span>
            <span className="text-slate-200 font-bold text-sm">
              {(waveformMeta.duration / timeScale).toFixed(1)} s
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-slate-500 uppercase block">Sampling Rate</span>
            <span className="text-slate-300 font-semibold">
              {(1 / waveformMeta.dt * timeScale).toFixed(0)} Hz <span className="text-[10px] text-slate-500">({waveformMeta.dt.toFixed(3)}s)</span>
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-slate-500 uppercase block">Buffer Points</span>
            <span className="text-slate-300 font-semibold">
              {waveformMeta.pointCount.toLocaleString()} pts
            </span>
          </div>
        </div>
      )}

      {/* Waveform Scaling Multipliers */}
      <div className="space-y-3 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waveform Scaling</span>
          </div>
          <button
            onClick={() => { onChangeAmplitudeScale(1.0); onChangeTimeScale(1.0); }}
            className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-0.5"
            title="Reset scaling factors to 1.0x"
          >
            Reset
          </button>
        </div>

        {/* Amplitude Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Amplitude Multiplier</span>
            <span className="font-mono text-cyan-300 font-semibold">{amplitudeScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={amplitudeScale}
            onChange={(e) => onChangeAmplitudeScale(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
        </div>

        {/* Time Scale Multiplier */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Speed / Time Scale</span>
            <span className="font-mono text-cyan-300 font-semibold">{timeScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={timeScale}
            onChange={(e) => onChangeTimeScale(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
}
