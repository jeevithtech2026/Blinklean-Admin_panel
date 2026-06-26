import React from 'react';
import { Activity } from 'lucide-react';

const SystemHealthBanner = () => {
  // Static status metrics checking the operational capability of administrative services
  const nodes = [
    { name: 'Gateway API', ok: true, ping: '14ms' },
    { name: 'Partner Node', ok: true, ping: '28ms' }
  ];

  return (
    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
      <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1 text-slate-400 font-bold uppercase tracking-wider text-[9px] shrink-0">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <span>Systems Health</span>
      </div>

      <div className="flex items-center gap-4 overflow-hidden">
        {nodes.map((node) => (
          <div key={node.name} className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${node.ok ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${node.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {node.name}: <span className={node.ok ? 'text-slate-800 font-bold' : 'text-rose-700 font-bold'}>{node.ok ? 'Operational' : 'Failed'}</span>
              <span className="text-slate-400 font-mono text-[9px] ml-1">({node.ping})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealthBanner;
