import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Activity, 
  MapPin, 
  Radio, 
  BarChart3, 
  Play, 
  Square, 
  Home, 
  Terminal, 
  FileCode, 
  UploadCloud, 
  Cpu, 
  X,
  ArrowRight
} from 'lucide-react';
import { INITIAL_SEISMIC_FEED } from '../data/seismicFeed';

export function CommandPaletteModal({
  isOpen,
  onClose,
  onChangeView,
  onSelectEarthquake,
  onExecuteShake,
  onEmergencyStop,
  onHomeTable,
  onOpenTerminal,
  onOpenPayloadModal,
  onUploadBuffer
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command items
  const allItems = [
    // Navigation
    {
      id: 'nav-feed',
      category: 'Views & Modes',
      title: 'Switch to Live Feed',
      subtitle: 'View real-time global telemetry cards and earthquake database',
      icon: Radio,
      action: () => { onChangeView('feed'); onClose(); }
    },
    {
      id: 'nav-map',
      category: 'Views & Modes',
      title: 'Switch to Global Seismic Map',
      subtitle: 'Interactive world map with pulsating epicenter ripples',
      icon: MapPin,
      action: () => { onChangeView('map'); onClose(); }
    },
    {
      id: 'nav-bench',
      category: 'Views & Modes',
      title: 'Switch to Seismogram & Shake Bench',
      subtitle: 'Main hardware visualizer, live waveforms, and dual-stepper parameters',
      icon: Activity,
      action: () => { onChangeView('bench'); onClose(); }
    },
    {
      id: 'nav-analytics',
      category: 'Views & Modes',
      title: 'Switch to Analytics & Response Spectrum',
      subtitle: 'PGA, Arias intensity, D5-95, and 5% damped elastic Sa spectra',
      icon: BarChart3,
      action: () => { onChangeView('analytics'); onClose(); }
    },

    // Hardware Actions
    {
      id: 'hw-shake',
      category: 'Hardware Operations',
      title: 'Execute Shake Table Test',
      subtitle: 'Upload trajectory and stream real-time motion pulses',
      icon: Play,
      action: () => { onExecuteShake(); onClose(); }
    },
    {
      id: 'hw-stop',
      category: 'Hardware Operations',
      title: 'EMERGENCY STOP (E-STOP)',
      subtitle: 'Immediately disable stepper motor drivers and halt motion',
      icon: Square,
      action: () => { onEmergencyStop(); onClose(); }
    },
    {
      id: 'hw-home',
      category: 'Hardware Operations',
      title: 'Home Carriage',
      subtitle: 'Seek optical limit endstop and zero carriage displacement coordinates',
      icon: Home,
      action: () => { onHomeTable(); onClose(); }
    },
    {
      id: 'hw-buf',
      category: 'Hardware Operations',
      title: 'Upload Trajectory Buffer',
      subtitle: 'Upload displacement profile to ESP32-S3 internal ring buffer',
      icon: UploadCloud,
      action: () => { onUploadBuffer(); onClose(); }
    },
    {
      id: 'hw-term',
      category: 'Hardware Operations',
      title: 'Open Web Serial Terminal',
      subtitle: 'Send direct hex/ASCII packets and monitor hardware responses',
      icon: Terminal,
      action: () => { onOpenTerminal(); onClose(); }
    },
    {
      id: 'hw-payload',
      category: 'Hardware Operations',
      title: 'Export ESP32 C++ Payload & Firmware',
      subtitle: 'Generate flashable C++ trajectory header array for offline bench use',
      icon: FileCode,
      action: () => { onOpenPayloadModal(); onClose(); }
    },

    // Preloaded Waveforms
    ...INITIAL_SEISMIC_FEED.map(evt => ({
      id: `eq-${evt.id}`,
      category: 'Earthquake Records',
      title: evt.title,
      subtitle: `${evt.location} • PGA: ${evt.pga.toFixed(3)}g`,
      icon: Activity,
      action: () => {
        onSelectEarthquake(evt.associatedRecordId);
        onChangeView('bench');
        onClose();
      }
    }))
  ];

  const filteredItems = allItems.filter(item => {
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || 
           item.subtitle.toLowerCase().includes(q) || 
           item.category.toLowerCase().includes(q);
  });

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-3xl overflow-hidden backdrop-blur-3xl bg-white/90 dark:bg-[#161B22]/95 border border-black/10 dark:border-white/10 shadow-2xl flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search earthquakes..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-white/[0.06] text-neutral-500 border border-neutral-300 dark:border-white/[0.08]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-black/[0.02] dark:divide-white/[0.02]">
          {filteredItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 text-neutral-900 dark:text-white ring-1 ring-blue-500/30' 
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                      : 'bg-neutral-200/60 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-tight truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 border border-neutral-200 dark:border-white/[0.04]">
                    {item.category}
                  </span>
                  {isSelected && (
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500 font-sans">
              No matching commands or seismic records found.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-neutral-100/60 dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵</kbd></span>
        </div>
      </div>
    </div>
  );
}
