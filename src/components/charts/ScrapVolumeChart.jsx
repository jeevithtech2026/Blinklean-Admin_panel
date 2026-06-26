import React, { useState } from 'react';

const ScrapVolumeChart = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No scrap data available for the selected range.
      </div>
    );
  }

  // Chart layout parameters
  const svgWidth = 600;
  const svgHeight = 280;
  const chartWidth = 520;
  const chartHeight = 220;
  const paddingLeft = 55;
  const paddingTop = 20;
  const paddingBottom = 40;

  // Calculate scales
  const maxWeight = Math.max(...data.map(d => d.weight), 10);
  const yMax = Math.ceil((maxWeight * 1.1) / 10) * 10;

  const getCoordinates = (index, weight) => {
    const spacing = chartWidth / data.length;
    const barWidth = Math.min(32, spacing * 0.65);
    const x = paddingLeft + index * spacing + (spacing - barWidth) / 2;
    const height = (weight / yMax) * chartHeight;
    const y = paddingTop + chartHeight - height;
    return { x, y, barWidth, height };
  };

  // Generate grid values (4 intervals)
  const gridLines = Array.from({ length: 5 }).map((_, i) => {
    const value = (yMax / 4) * i;
    const y = paddingTop + chartHeight - (value / yMax) * chartHeight;
    return { value, y };
  });

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <svg 
        className="w-full h-full" 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Emerald gradient for normal bar state */}
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          {/* Brighter gradient for hovered bar */}
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines and Y-axis labels */}
        {gridLines.map((line, idx) => (
          <g key={idx} className="opacity-40">
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={paddingLeft + chartWidth} 
              y2={line.y} 
              stroke="#e2e8f0" 
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text 
              x={paddingLeft - 10} 
              y={line.y + 4} 
              textAnchor="end" 
              className="text-[10px] font-bold fill-slate-400"
            >
              {Math.round(line.value)} kg
            </text>
          </g>
        ))}

        {/* X-Axis base line */}
        <line 
          x1={paddingLeft} 
          y1={paddingTop + chartHeight} 
          x2={paddingLeft + chartWidth} 
          y2={paddingTop + chartHeight} 
          stroke="#cbd5e1" 
          strokeWidth="1"
        />

        {/* X-axis labels (render dates, potentially skipping some on large datasets) */}
        {data.map((d, i) => {
          const spacing = chartWidth / data.length;
          const x = paddingLeft + i * spacing + spacing / 2;
          const displayLabel = data.length > 10 ? (i % 2 === 0) : true;
          
          if (!displayLabel) return null;

          // Format Date to short string e.g. "Jun 24"
          const dateObj = new Date(d.date);
          const formattedLabel = isNaN(dateObj.getTime()) 
            ? d.date 
            : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

          return (
            <text 
              key={i} 
              x={x} 
              y={paddingTop + chartHeight + 20} 
              textAnchor="middle" 
              className="text-[9px] font-bold fill-slate-400 uppercase tracking-wider"
            >
              {formattedLabel}
            </text>
          );
        })}

        {/* Render Bars */}
        {data.map((d, i) => {
          const { x, y, barWidth, height } = getCoordinates(i, d.weight);
          const isHovered = hoveredBar && hoveredBar.index === i;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, height)}
              rx="4"
              fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={(e) => {
                const rect = e.target.getBoundingClientRect();
                const parentRect = e.target.parentElement.parentElement.getBoundingClientRect();
                setHoveredBar({
                  date: d.date,
                  weight: d.weight,
                  index: i,
                  x: rect.left - parentRect.left + rect.width / 2,
                  y: rect.top - parentRect.top,
                });
              }}
              onMouseLeave={() => setHoveredBar(null)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredBar && (
        <div 
          className="absolute bg-slate-900/95 backdrop-blur-xs text-white text-xs rounded-xl p-3 shadow-lg pointer-events-none transition-all duration-150 border border-slate-800 z-20 flex flex-col items-center justify-center min-w-[80px]"
          style={{
            left: `${hoveredBar.x + 18}px`,
            top: `${hoveredBar.y - 30}px`,
          }}
        >
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {new Date(hoveredBar.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </span>
          <span className="font-extrabold text-sm text-emerald-400 mt-0.5">
            {hoveredBar.weight} kg
          </span>
        </div>
      )}
    </div>
  );
};

export default ScrapVolumeChart;
