import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  MapPin, 
  Activity, 
  Gauge, 
  Clock, 
  Waves, 
  ArrowUpRight, 
  ChevronRight,
  ShieldCheck,
  Compass,
  Layers
} from 'lucide-react';
import { INITIAL_SEISMIC_FEED, getMagnitudePalette } from '../data/seismicFeed';

export function LiveFeedView({ onSelectAndRun }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'minor' | 'moderate' | 'severe' | 'great'
  const [selectedRegion, setSelectedRegion] = useState('all');

  const filteredEvents = useMemo(() => {
    return INITIAL_SEISMIC_FEED.filter(evt => {
      const matchesSearch = 
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.fault.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.station.toLowerCase().includes(searchQuery.toLowerCase());
      
      const palette = getMagnitudePalette(evt.magnitude);
      const matchesCat = selectedCategory === 'all' || palette.category.toLowerCase() === selectedCategory;
      const matchesRegion = selectedRegion === 'all' || evt.region.toLowerCase().includes(selectedRegion.toLowerCase());

      return matchesSearch && matchesCat && matchesRegion;
    });
  }, [searchQuery, selectedCategory, selectedRegion]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Top Hero / Filter Bar */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/75 border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              Global Seismic Telemetry Feed
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">•</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono font-medium">USGS / JMA / IRIS Calibrated</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Real-Time & Benchmark Waveforms
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Select calibrated ground motion records from global stations to stream directly to the dual-stepper shake table simulator or ESP32-S3 hardware.
          </p>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station, fault, region..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-neutral-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-sans"
            />
          </div>

          {/* Magnitude Category Selector */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-200/50 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs">
            {['all', 'minor', 'moderate', 'severe', 'great'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all font-medium ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-[#1C2128] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.1]'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Seismic Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((evt) => {
          const palette = getMagnitudePalette(evt.magnitude);

          return (
            <div
              key={evt.id}
              className="group relative flex flex-col justify-between rounded-3xl p-5 backdrop-blur-2xl bg-white/70 dark:bg-[#161B22]/70 border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.12] dark:hover:border-white/[0.16]"
            >
              <div>
                {/* Header: Magnitude Tag & Time */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="px-3 py-1 rounded-2xl text-xs font-bold font-tabular tracking-tight border flex items-center gap-1.5 shadow-sm"
                      style={{ 
                        backgroundColor: palette.bgGlass,
                        borderColor: palette.border,
                        color: palette.color
                      }}
                    >
                      <span>M {evt.magnitude.toFixed(1)}</span>
                      <span className="text-[10px] opacity-75 uppercase font-mono tracking-wider">
                        {palette.category}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {evt.timeAgo}
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.06]">
                    {evt.status}
                  </span>
                </div>

                {/* Event Title & Location */}
                <h3 className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {evt.title}
                </h3>
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </p>

                {/* Summary / Physical Mechanism */}
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 line-clamp-2 leading-relaxed">
                  {evt.summary}
                </p>

                {/* Telemetry Micro-Badges */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-center">
                  <div className="p-2 rounded-xl bg-neutral-100/60 dark:bg-white/[0.03]">
                    <div className="text-[10px] uppercase font-mono text-neutral-400">PGA (Peak)</div>
                    <div className="text-xs font-bold font-tabular text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {evt.pga.toFixed(3)}g
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-100/60 dark:bg-white/[0.03]">
                    <div className="text-[10px] uppercase font-mono text-neutral-400">PGV</div>
                    <div className="text-xs font-bold font-tabular text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {evt.pgv.toFixed(1)} cm/s
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-100/60 dark:bg-white/[0.03]">
                    <div className="text-[10px] uppercase font-mono text-neutral-400">Depth</div>
                    <div className="text-xs font-bold font-tabular text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {evt.depthKm} km
                    </div>
                  </div>
                </div>

                {/* Fault & Station Info */}
                <div className="mt-3 flex flex-col gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <Compass className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">{evt.fault}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Activity className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">{evt.station}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Load & Simulate */}
              <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  onClick={() => onSelectAndRun(evt.associatedRecordId)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-[#0071E3] to-[#0091FF] dark:from-[#0A84FF] dark:to-[#0071E3] hover:brightness-110 active:scale-[0.98] shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Simulate on Shake Table</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="py-16 text-center text-neutral-400 dark:text-neutral-500">
          <p className="text-base font-semibold">No seismic records match your search criteria</p>
          <p className="text-xs mt-1">Try searching for "California", "Kobe", "Subduction", or resetting the magnitude filter.</p>
        </div>
      )}

    </div>
  );
}
