import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const KpiCard = ({ title, value, trend, isPositive, icon: Icon, loading }) => {
  const { density } = useTheme();
  
  const isCompact = density === 'compact';
  const paddingClass = isCompact ? 'p-4' : 'p-6';
  const marginClass = isCompact ? 'mt-2' : 'mt-4';
  const titleSizeClass = isCompact ? 'text-xs' : 'text-sm';
  const valueSizeClass = isCompact ? 'text-xl' : 'text-2xl';
  const iconPaddingClass = isCompact ? 'p-1.5' : 'p-2.5';
  const iconSizeClass = isCompact ? 'h-4.5 w-4.5' : 'h-5 w-5';

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${paddingClass} shadow-sm animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <div className={`${marginClass} flex items-baseline justify-between`}>
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${paddingClass} shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className={`font-medium text-slate-500 dark:text-slate-400 ${titleSizeClass}`}>{title}</span>
        {Icon && (
          <span className={`rounded-xl border ${iconPaddingClass} ${
            isPositive 
              ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
              : 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30'
          }`}>
            <Icon className={iconSizeClass} />
          </span>
        )}
      </div>
      <div className={`${marginClass} flex items-baseline justify-between`}>
        <span className={`font-bold text-slate-900 dark:text-white ${valueSizeClass}`}>{value}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-xs font-semibold ${
            isPositive 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455'
          }`}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
