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
  Radio,
  MapPin,
  BarChart3,
  Sliders,
  Search,
  Moon,
  Sun,
  Usb,
  Compass
} from 'lucide-react';

export function Header({
  activeView = 'bench', // 'feed' | 'map' | 'bench' | 'analytics'
  onChangeView,
  theme = 'dark',
  onToggleTheme,
  onOpenSearch,
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

  const viewOptions = [
    { id: 'feed', label: 'Live Feed', icon: Radio },
    { id: 'map', label: 'Global Map', icon: MapPin },
    { id: 'bench', label: 'Seismogram / Bench', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 py-2.5 backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Branding & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071E3] to-[#64D2FF] dark:from-[#0A84FF] dark:to-[#30B0C7] flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold ring-1 ring-white/30">
            <Activity className="w-5 h-5 text-white" strokeWidth={2} />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                SeismoBench
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                ESP32-S3
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-tabular flex items-center gap-1.5">
              <span>Precision Shake Table</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{stepsPerMm} steps/mm</span>
            </p>
          </div>
        </div>

        {/* Center: Apple-Grade Segmented Control */}
        <nav className="flex items-center p-1 rounded-xl bg-neutral-200/60 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] backdrop-blur-md shadow-inner">
          {viewOptions.map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onChangeView(v.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-tight transition-all duration-200 ${
                  isActive
                    ? 'text-neutral-900 dark:text-white bg-white dark:bg-[#1C2128] shadow-sm shadow-black/10 dark:shadow-black/40 ring-1 ring-black/[0.04] dark:ring-white/[0.1]'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'opacity-70'}`} strokeWidth={1.8} />
                <span className="hidden md:inline">{v.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Controls & Utilities */}
        <div className="flex items-center gap-2">
          
          {/* Spotlight Search Pill */}
          <button
            onClick={onOpenSearch}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-200/50 dark:bg-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.09] border border-black/[0.06] dark:border-white/[0.08] text-xs text-neutral-500 dark:text-neutral-400 transition-colors"
            title="Search earthquakes or hardware settings (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="font-sans">Search quakes...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shadow-sm border border-neutral-300 dark:border-neutral-700">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-neutral-200/50 dark:bg-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.09] border border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Connection Status Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border font-tabular transition-all ${
            connectionState === 'DISCONNECTED'
              ? 'bg-neutral-200/60 dark:bg-neutral-800/50 border-neutral-300 dark:border-neutral-700/60 text-neutral-500 dark:text-neutral-400'
              : isSimulated
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              connectionState === 'DISCONNECTED' ? 'bg-neutral-400' :
              isSimulated ? 'bg-purple-500 animate-pulse' :
              'bg-emerald-500 animate-pulse'
            }`} />
            <span>
              {connectionState === 'DISCONNECTED' && 'Offline'}
              {connectionState !== 'DISCONNECTED' && (isSimulated ? 'Simulator' : 'ESP32 Online')}
            </span>
          </div>

          {/* Hardware Quick Actions */}
          {!isConnected ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onConnectPhysical}
                className="btn-press flex items-center gap-1 px-2.5 py-1.5 bg-[#0071E3] dark:bg-[#0A84FF] hover:opacity-95 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                title="Connect physical ESP32-S3 via USB-C"
              >
                <Usb className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect</span>
              </button>
              <button
                onClick={onStartSimulation}
                className="btn-press flex items-center gap-1 px-2.5 py-1.5 bg-neutral-200/80 dark:bg-white/[0.08] hover:bg-neutral-300/80 dark:hover:bg-white/[0.12] text-neutral-800 dark:text-neutral-200 border border-black/[0.06] dark:border-white/[0.08] rounded-lg text-xs font-semibold transition-all"
                title="Run hardware loopback simulator"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">Simulate</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onDisconnect}
              className="btn-press px-2.5 py-1.5 bg-neutral-200/80 dark:bg-white/[0.08] hover:bg-rose-500/10 text-neutral-700 dark:text-neutral-300 hover:text-rose-500 border border-black/[0.06] dark:border-white/[0.08] rounded-lg text-xs font-semibold transition-all"
            >
              Disconnect
            </button>
          )}

          {/* Load Buffer & Shake Buttons */}
          <button
            onClick={onExecuteShake}
            disabled={!isConnected || isRunning || isBuffering}
            className="btn-press flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Execute Shake Sequence"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Shake</span>
          </button>

          <button
            onClick={onEmergencyStop}
            className="btn-press flex items-center gap-1 px-2 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Emergency Stop (E-STOP)"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          {/* Terminal & Code modals */}
          <button
            onClick={onOpenTerminal}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/[0.06] transition-colors"
            title="Serial Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPayloadModal}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/[0.06] transition-colors"
            title="ESP32 C++ Code & Trajectory Payload"
          >
            <Code className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
