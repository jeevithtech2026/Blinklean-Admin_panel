import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, density, setDensity } = useTheme();
  
  const panelRef = useRef(null);

  // Close settings panel when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer"
        title="UI Adjustments"
      >
        <Settings className="h-4.5 w-4.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl z-50 space-y-5 animate-fade-in">
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Theme Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-850 dark:text-violet-400'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">UI Density</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compact</span>
                </div>
                <input
                  type="radio"
                  name="density"
                  value="compact"
                  checked={density === 'compact'}
                  onChange={() => setDensity('compact')}
                  className="h-3.5 w-3.5 text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Comfortable</span>
                </div>
                <input
                  type="radio"
                  name="density"
                  value="comfortable"
                  checked={density === 'comfortable'}
                  onChange={() => setDensity('comfortable')}
                  className="h-3.5 w-3.5 text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
