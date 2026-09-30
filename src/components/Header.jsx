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
  BarChart3, 
  Moon, 
  Sun, 
  Usb,
  Radio
} from 'lucide-react';

export function Header({
  activeView = 'bench', // 'bench' | 'analytics'
  onChangeView,
  theme = 'dark',
  onToggleTheme,
  connectionState,
  isSimulated,
  onConnectPhysical,
  onStartSimulation,
  onDisconnect,
  onUploadBuffer,
  onExecuteShake,
  onEmergencyStop,
  onOpenTerminal,
  onOpenPayloadModal,
  bufferProgress,
  strokeWarning,
  stepsPerMm
}) {
  const isConnected = connectionState !== 'DISCONNECTED';
  const isRunning = connectionState === 'RUNNING';
  const isBuffering = connectionState === 'BUFFERING';

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-[#060606]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Nothing OS Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#121214] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-ndot text-sm tracking-widest text-neutral-900 dark:text-neutral-100 font-bold uppercase">
                SEISMOBENCH (R)
              </span>
              <span className="text-[10px] font-space px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                ESP32-S3
              </span>
            </div>
            <p className="text-[10px] font-space text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <span>DUAL STEPPER BENCH</span>
              <span>/</span>
              <span className="text-[#D71921] font-semibold">{stepsPerMm} STEPS/MM</span>
            </p>
          </div>
        </div>

        {/* Center: Nothing Segmented View Controller (Bench & Analytics only) */}
        <nav className="flex items-center p-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214] text-xs font-space">
          <button
            onClick={() => onChangeView('bench')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              activeView === 'bench'
                ? 'bg-white dark:bg-[#202022] text-neutral-900 dark:text-white font-bold shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {activeView === 'bench' && <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />}
            <span>BENCH // SIMULATOR</span>
          </button>

          <button
            onClick={() => onChangeView('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              activeView === 'analytics'
                ? 'bg-white dark:bg-[#202022] text-neutral-900 dark:text-white font-bold shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {activeView === 'analytics' && <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />}
            <span>SPECTRAL // ANALYTICS</span>
          </button>
        </nav>

        {/* Right: Hardware State & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Connection State Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-space border ${
            !isConnected
              ? 'border-neutral-300 dark:border-neutral-800 text-neutral-400 bg-neutral-100 dark:bg-[#121214]'
              : isSimulated
              ? 'border-neutral-400 dark:border-neutral-700 text-neutral-900 dark:text-white bg-white dark:bg-[#1a1a1c]'
              : 'border-[#D71921]/50 text-[#D71921] bg-[#D71921]/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              !isConnected ? 'bg-neutral-400' : isSimulated ? 'bg-purple-400' : 'bg-[#D71921] animate-pulse'
            }`} />
            <span>{!isConnected ? 'OFFLINE' : isSimulated ? 'SIMULATOR' : 'USB-C LIVE'}</span>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214] text-xs font-space text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[10px]">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-800" />
                <span className="hidden sm:inline text-[10px]">DARK</span>
              </>
            )}
          </button>

          {/* Hardware Connection Action Dropdown / Button */}
          {!isConnected ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onStartSimulation}
                className="px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-[#1c1c1f] hover:border-neutral-400 text-xs font-space font-medium text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                title="Start Standalone ESP32 Hardware Loopback Simulator"
              >
                SIMULATE
              </button>
              <button
                onClick={onConnectPhysical}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-space font-bold hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
                title="Connect physical ESP32-S3 via Web Serial API"
              >
                <Usb className="w-3.5 h-3.5" />
                <span>CONNECT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Shake Execution Button */}
              <button
                onClick={onExecuteShake}
                disabled={isRunning || isBuffering}
                className="px-3.5 py-1.5 rounded-full bg-[#D71921] text-white text-xs font-space font-bold hover:bg-[#b5141b] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
              </button>

              {/* Emergency Stop */}
              <button
                onClick={onEmergencyStop}
                className="px-3 py-1.5 rounded-full border border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-space font-bold transition-all cursor-pointer flex items-center gap-1"
                title="EMERGENCY STOP (Cut Power)"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>E-STOP</span>
              </button>
            </div>
          )}

          {/* Terminal & Payload Buttons */}
          <button
            onClick={onOpenTerminal}
            className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Open Web Serial Terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenPayloadModal}
            className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121214] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Export ESP32 C++ Payload & Firmware"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
}
