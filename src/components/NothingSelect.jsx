import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function NothingSelect({
  value,
  onChange,
  options = [], // [{ value: 'elcentro', label: '1940 El Centro...' }, ...]
  className = '',
  placeholder = 'SELECT OPTION'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || { label: placeholder, value };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 font-space text-xs hover:border-[#D71921] transition-all text-left shadow-sm focus:outline-none"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0" />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#D71921]' : ''}`} 
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#161618] shadow-2xl p-1 max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-space rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-white/[0.08] text-[#D71921] font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0" />}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#D71921] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
