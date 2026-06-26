import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import useLiveEvents from '../../hooks/useLiveEvents';

const LiveActivityItem = ({ event }) => {
  const [relativeTime, setRelativeTime] = useState('Just now');

  useEffect(() => {
    const computeTime = () => {
      const diffMs = Date.now() - new Date(event.timestamp).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 5) {
        setRelativeTime('Just now');
      } else if (diffSecs < 60) {
        setRelativeTime(`${diffSecs}s ago`);
      } else {
        setRelativeTime(`${diffMins}m ago`);
      }
    };

    computeTime();
    const interval = setInterval(computeTime, 1000);
    return () => clearInterval(interval);
  }, [event.timestamp]);

  const badgeColors = {
    NEW_USER: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40',
    BOOKING_COMPLETE: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40',
    SCRAP_PICKUP: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/40',
    PARTNER_REGISTER: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/40',
    PAYOUT_SENT: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40',
    AUTH_ALERT: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40',
  };

  const badgeStyle = badgeColors[event.badge] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-805';

  return (
    <div className="flex flex-col p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-xs hover:shadow-sm animate-slide-in">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${badgeStyle}`}>
          {event.badge}
        </span>
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {relativeTime}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">
        {event.message}
      </p>
    </div>
  );
};

const LiveActivityStream = () => {
  const events = useLiveEvents(20);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-850 mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activity Stream</h2>
          <p className="text-xs text-slate-400 dark:text-slate-550">Real-time trace log of system operation telemetry events</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 shadow-xs">
          <Activity className="h-4.5 w-4.5 animate-pulse" />
        </div>
      </div>

      {/* Scrolling Stream List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[380px] scrollbar-thin">
        {events.length > 0 ? (
          events.map((event) => (
            <LiveActivityItem key={event.id} event={event} />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
            <Activity className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-450">Awaiting stream...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityStream;
