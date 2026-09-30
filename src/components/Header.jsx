import React from 'react';
import { 
  Activity, 
  Cpu, 
  Play, 
  Square, 
  UploadCloud, 
  Terminal, 
  Code, 
  AlertTriangle, 
  Layers, 
  Sliders,
  RotateCcw,
  Zap,
  Usb
} from 'lucide-react';

export function Header({
  connectionState, // 'DISCONNECTED' | 'CONNECTED' | 'BUFFERING' | 'READY' | 'RUNNING' | 'ESTOP'
  isSimulated,
  onConnectPhysical,
  onStartSimulation,
  onDisconnect,
  onUploadBuffer,
  onExecuteShake,
  onEmergencyStop,
  onHomeTable,
  onOpenTerminal,
  onOpenPayloadModal,
  bufferProgress,
  strokeWarning,
  stepsPerMm
}) {
  const isConnected = connectionState !== 'DISCONNECTED';
  const isRunning = connectionState === 'RUNNING';
  const isBuffering = connectionState === 'BUFFERING';
  const isReady = connectionState === 'READY' || connectionState === 'CONNECTED';

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Title and System Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold ring-1 ring-cyan-400/40">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SeismoBench
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
                  v2.4 ESP32-S3
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span>Precision Shake Table Controller & Telemetry</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-semibold">{stepsPerMm} steps/mm</span>
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Connection Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            connectionState === 'DISCONNECTED'
              ? 'bg-slate-800/60 border-slate-700 text-slate-400'
              : isSimulated
              ? 'bg-purple-950/40 border-purple-800/60 text-purple-300 shadow-sm shadow-purple-900/20'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 shadow-sm shadow-emerald-900/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionState === 'DISCONNECTED' ? 'bg-slate-500' :
              isSimulated ? 'bg-purple-400 animate-ping' :
              'bg-emerald-400 animate-ping'
            }`} />
            <span className="font-semibold">
              {connectionState === 'DISCONNECTED' && 'OFFLINE'}
              {connectionState !== 'DISCONNECTED' && (isSimulated ? 'SIMULATOR ACTIVE' : 'ESP32-S3 ONLINE')}
            </span>
          </div>

          {/* Running State Badge */}
          <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
            connectionState === 'RUNNING' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 animate-pulse' :
            connectionState === 'BUFFERING' ? 'bg-amber-950/60 border-amber-600 text-amber-300' :
            connectionState === 'READY' ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300' :
            connectionState === 'ESTOP' ? 'bg-rose-950/80 border-rose-600 text-rose-300' :
            'bg-slate-800/40 border-slate-700/60 text-slate-400'
          }`}>
            {connectionState === 'RUNNING' && `SHAKING ACTIVE`}
            {connectionState === 'BUFFERING' && `BUFFERING ${bufferProgress}%`}
            {connectionState === 'READY' && 'BUFFER READY'}
            {connectionState === 'ESTOP' && 'E-STOP HALT'}
            {connectionState === 'CONNECTED' && 'STANDBY'}
            {connectionState === 'DISCONNECTED' && 'IDLE'}
          </div>

          {/* Bed Stroke Warning Badge */}
          {strokeWarning?.exceedsLimit && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-rose-950/60 border-rose-700 text-rose-300 text-xs font-mono font-semibold animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>LIMIT EXCEEDED (±{strokeWarning.peakAbsoluteDisp}mm)</span>
            </div>
          )}
        </div>

        {/* Action Button Controls */}
        <div className="flex items-center gap-2">
          {/* Connection Trigger Buttons */}
          {!isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onConnectPhysical}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-xs font-semibold tracking-wide shadow-md shadow-cyan-600/20 transition-colors"
                title="Connect directly to physical ESP32-S3 via Web Serial API"
              >
                <Usb className="w-3.5 h-3.5" />
                Connect ESP32
              </button>
              <button
                onClick={onStartSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 rounded-lg text-xs font-semibold tracking-wide transition-colors"
                title="Simulate ESP32-S3 hardware loopback for standalone demo"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                Simulate ESP32
              </button>
            </div>
          ) : (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              title="Disconnect Serial Port"
            >
              Disconnect
            </button>
          )}

          {/* Trajectory Buffer & Execution Buttons */}
          <button
            onClick={onUploadBuffer}
            disabled={!isConnected || isRunning || isBuffering}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold transition-colors"
            title="Upload motion trajectory steps into ESP32 SRAM DMA buffer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            Load Buffer
          </button>

          <button
            onClick={onExecuteShake}
            disabled={!isConnected || isRunning || isBuffering}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
            title="Trigger shake table sequence"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Shake
          </button>

          <button
            onClick={onEmergencyStop}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-700/20 transition-colors"
            title="Emergency Stop (E-STOP) - Immediately cut stepper pulses"
          >
            <Square className="w-3 h-3 fill-current" />
            E-STOP
          </button>

          {/* Utilities: Terminal & Code Generator */}
          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={onOpenTerminal}
            className="flex items-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 rounded-lg text-xs transition-colors"
            title="Open Serial Terminal Monitor (TX/RX packets)"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPayloadModal}
            className="flex items-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 rounded-lg text-xs transition-colors"
            title="View ESP32-S3 Firmware Code & Motion Payload"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
