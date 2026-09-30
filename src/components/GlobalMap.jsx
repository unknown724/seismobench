import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Maximize2, 
  Zap, 
  Info, 
  ArrowUpRight, 
  Activity,
  Compass,
  Sliders,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { INITIAL_SEISMIC_FEED, getMagnitudePalette } from '../data/seismicFeed';

export function GlobalMap({
  selectedEventId,
  onSelectEvent,
  onLoadIntoShakeTable
}) {
  const [minMagnitude, setMinMagnitude] = useState(4.0);
  const [maxDepthKm, setMaxDepthKm] = useState(100);
  const [showTectonicFaults, setShowTectonicFaults] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Filter earthquakes according to HUD sliders
  const filteredEvents = useMemo(() => {
    return INITIAL_SEISMIC_FEED.filter(
      (ev) => ev.magnitude >= minMagnitude && ev.depthKm <= maxDepthKm
    );
  }, [minMagnitude, maxDepthKm]);

  const activeEvent = useMemo(() => {
    return INITIAL_SEISMIC_FEED.find((ev) => ev.id === selectedEventId) || INITIAL_SEISMIC_FEED[0];
  }, [selectedEventId]);

  // Equirectangular projection mapping [lat, lng] to SVG viewbox [0 0 1000 500]
  const projectCoords = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden glass-panel border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col select-none">
      
      {/* Top Map HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Title badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#161B22]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-md text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
          <span className="text-neutral-900 dark:text-white font-medium">Global Seismicity & Epicenters</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            {filteredEvents.length} Active Events
          </span>
        </div>

        {/* Legend pills */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-[#161B22]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-md text-[11px] font-medium font-tabular">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
            <span className="text-neutral-600 dark:text-neutral-300">M&lt;5.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
            <span className="text-neutral-600 dark:text-neutral-300">M5-6.5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" />
            <span className="text-neutral-600 dark:text-neutral-300">M6.5-7.5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2]" />
            <span className="text-neutral-600 dark:text-neutral-300">M7.5+</span>
          </div>
        </div>

      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="relative flex-1 w-full bg-[#E5E9F0] dark:bg-[#0D1117] transition-colors duration-300 overflow-hidden flex items-center justify-center">
        
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full object-cover"
        >
          <defs>
            {/* Ocean background pattern */}
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(10, 132, 255, 0.04)" />
              <stop offset="100%" stopColor="rgba(0, 113, 227, 0.08)" />
            </linearGradient>

            {/* Pulsing ripple filters */}
            <radialGradient id="rippleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ocean Base */}
          <rect width="1000" height="500" fill="url(#oceanGrad)" />

          {/* Grid lines (Latitude / Longitude 30 deg steps) */}
          <g stroke="rgba(128,128,128,0.12)" strokeWidth="0.75" strokeDasharray="3,3">
            {[100, 200, 300, 400].map(y => (
              <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} />
            ))}
            {[166, 333, 500, 666, 833].map(x => (
              <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" />
            ))}
          </g>

          {/* Continents Simplified Vector Paths */}
          <g fill="rgba(150, 160, 175, 0.28)" dark:fill="rgba(40, 48, 60, 0.6)" stroke="rgba(100, 115, 135, 0.25)" strokeWidth="1" className="transition-colors">
            {/* North America */}
            <path d="M 120,60 Q 200,50 280,80 Q 290,140 240,190 Q 200,230 160,190 Q 110,130 120,60 Z" />
            {/* South America */}
            <path d="M 230,230 Q 300,240 320,310 Q 290,420 250,470 Q 220,380 230,230 Z" />
            {/* Eurasia */}
            <path d="M 450,70 Q 650,50 820,90 Q 860,160 760,200 Q 640,180 540,160 Q 480,120 450,70 Z" />
            {/* Africa */}
            <path d="M 460,180 Q 560,180 580,260 Q 560,370 500,410 Q 440,320 460,180 Z" />
            {/* Australia */}
            <path d="M 760,320 Q 860,310 880,380 Q 820,440 760,400 Q 730,350 760,320 Z" />
            {/* Japan Arc */}
            <path d="M 830,135 Q 855,160 845,190 Q 835,175 830,135 Z" fill="rgba(150, 160, 175, 0.5)" />
          </g>

          {/* Major Tectonic Plate Boundary Fault Lines */}
          {showTectonicFaults && (
            <g stroke="#FF9F0A" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.45">
              {/* Pacific Ring of Fire */}
              <path d="M 160,100 Q 130,200 190,300 Q 250,420 260,470" fill="none" />
              <path d="M 840,90 Q 850,200 870,300 Q 880,400 930,480" fill="none" />
              {/* Mid-Atlantic Ridge */}
              <path d="M 370,40 Q 390,200 370,340 Q 380,450 400,500" fill="none" />
              {/* Alpine-Himalayan Belt */}
              <path d="M 440,170 Q 580,185 720,200 Q 800,240 850,280" fill="none" />
            </g>
          )}

          {/* Earthquake Epicenter Ripple Rings */}
          {filteredEvents.map((ev) => {
            const { x, y } = projectCoords(ev.coordinates[0], ev.coordinates[1]);
            const palette = getMagnitudePalette(ev.magnitude);
            const isSelected = selectedEventId === ev.id;
            const isHovered = hoveredEvent?.id === ev.id;
            const radius = Math.max(6, (ev.magnitude - 3.5) * 4);

            return (
              <g 
                key={ev.id} 
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectEvent(ev.id)}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Concentric expanding ripple rings */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius * 2.2}
                  fill="none"
                  stroke={palette.color}
                  strokeWidth="1.5"
                  opacity="0.4"
                  className="animate-epicenter-ripple"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />

                <circle
                  cx={x}
                  cy={y}
                  r={radius * 1.5}
                  fill="none"
                  stroke={palette.color}
                  strokeWidth="1"
                  opacity="0.6"
                />

                {/* Core Epicenter Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? radius * 1.1 : radius}
                  fill={palette.color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  className="transition-all"
                  filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))"
                />

                {/* Magnitude Label on Marker */}
                <text
                  x={x}
                  y={y + 3.5}
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="-apple-system, sans-serif"
                  textAnchor="middle"
                >
                  {ev.magnitude.toFixed(1)}
                </text>
              </g>
            );
          })}

        </svg>

        {/* Hovered Tooltip Card */}
        {hoveredEvent && (
          <div 
            className="absolute z-30 pointer-events-none px-3 py-2 rounded-xl bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-xl text-xs flex flex-col gap-1 transition-all"
            style={{
              left: `${Math.min(85, Math.max(15, (projectCoords(hoveredEvent.coordinates[0], hoveredEvent.coordinates[1]).x / 1000) * 100))}%`,
              top: `${Math.min(75, Math.max(15, (projectCoords(hoveredEvent.coordinates[0], hoveredEvent.coordinates[1]).y / 500) * 100))}%`,
              transform: 'translate(-50%, -120%)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-tabular ${getMagnitudePalette(hoveredEvent.magnitude).badgeClass}`}>
                M {hoveredEvent.magnitude.toFixed(1)}
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {hoveredEvent.location}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-tabular">
              <span>Depth: {hoveredEvent.depthKm} km</span>
              <span>PGA: {hoveredEvent.pga} g</span>
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom HUD Dock: Filters & Selected Quake Detail */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Floating Magnitude & Depth Control Pill */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#161B22]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-xl text-xs">
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Min M:</span>
            <span className="font-bold text-neutral-900 dark:text-white font-tabular">{minMagnitude.toFixed(1)}</span>
            <input
              type="range"
              min="3.0"
              max="8.0"
              step="0.5"
              value={minMagnitude}
              onChange={(e) => setMinMagnitude(parseFloat(e.target.value))}
              className="w-20 accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Max Depth:</span>
            <span className="font-bold text-neutral-900 dark:text-white font-tabular">{maxDepthKm} km</span>
            <input
              type="range"
              min="20"
              max="200"
              step="20"
              value={maxDepthKm}
              onChange={(e) => setMaxDepthKm(parseInt(e.target.value))}
              className="w-20 accent-[#0071E3] dark:accent-[#0A84FF] h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />

          <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-300 select-none">
            <input
              type="checkbox"
              checked={showTectonicFaults}
              onChange={(e) => setShowTectonicFaults(e.target.checked)}
              className="accent-[#0071E3] dark:accent-[#0A84FF] rounded"
            />
            <span>Fault Lines</span>
          </label>

        </div>

        {/* Selected Event Action Card */}
        {activeEvent && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/90 dark:bg-[#1C2128]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-tabular ${getMagnitudePalette(activeEvent.magnitude).badgeClass}`}>
              M{activeEvent.magnitude.toFixed(1)}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                {activeEvent.title}
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-tabular">
                {activeEvent.depthKm} km • PGA {activeEvent.pga}g • {activeEvent.station}
              </p>
            </div>

            <button
              onClick={() => onLoadIntoShakeTable(activeEvent.associatedRecordId)}
              className="btn-press flex items-center gap-1 px-3 py-1.5 bg-[#0071E3] dark:bg-[#0A84FF] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:opacity-95 transition-all ml-2"
              title="Load this earthquake into the shake table simulator"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Load on Bench</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
