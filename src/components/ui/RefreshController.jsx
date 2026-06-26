import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

const RefreshController = ({ onRefresh, loading, frequency, setFrequency }) => {
  const [timeLeft, setTimeLeft] = useState(frequency);
  const timerRef = useRef(null);

  const options = [
    { label: 'Auto Sync: Off', value: 0 },
    { label: 'Every 30s', value: 30 },
    { label: 'Every 2m', value: 120 },
    { label: 'Every 5m', value: 300 },
  ];

  // Set up second-by-second countdown for the UI ring indicator
  useEffect(() => {
    setTimeLeft(frequency);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (frequency > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return frequency; // Reset countdown, Parent interval handles the fetch trigger
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [frequency]);

  // SVG Circular progress bar measurements
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = frequency > 0 
    ? circumference - (timeLeft / frequency) * circumference 
    : circumference;

  const handleManualRefresh = () => {
    onRefresh();
    if (frequency > 0) {
      setTimeLeft(frequency); // Reset countdown on manual click
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
      {/* Dropdown selection list */}
      <select
        value={frequency}
        onChange={(e) => setFrequency(Number(e.target.value))}
        className="bg-transparent text-xs font-semibold text-slate-600 outline-none px-2 cursor-pointer border-r border-slate-200 py-1"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sync actions panel */}
      <div className="flex items-center gap-2 pr-1">
        {frequency > 0 && (
          <div className="relative flex h-6 w-6 items-center justify-center">
            {/* SVG circular countdown progress indicator ring */}
            <svg className="h-5 w-5 transform -rotate-90">
              <circle
                cx="10"
                cy="10"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="2"
                fill="transparent"
              />
              <circle
                cx="10"
                cy="10"
                r={radius}
                className="stroke-violet-600 transition-all duration-1000 ease-linear"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="absolute text-[8px] font-extrabold text-slate-500">
              {timeLeft}
            </span>
          </div>
        )}

        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          title="Synchronize Data Now"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default RefreshController;
