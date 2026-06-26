import React, { useState, useEffect } from 'react';
import { Calendar, Scale, TrendingUp, Award, Loader2, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import ScrapVolumeChart from '../components/charts/ScrapVolumeChart';
import ExportButton from '../components/ExportButton';
import axiosInstance from '../api/axiosInstance';

const Analytics = () => {
  const rawDataFallback = [
    { date: '2026-06-11', weight: 145 },
    { date: '2026-06-12', weight: 180 },
    { date: '2026-06-13', weight: 90 },
    { date: '2026-06-14', weight: 65 },
    { date: '2026-06-15', weight: 210 },
    { date: '2026-06-16', weight: 195 },
    { date: '2026-06-17', weight: 160 },
    { date: '2026-06-18', weight: 250 },
    { date: '2026-06-19', weight: 230 },
    { date: '2026-06-20', weight: 110 },
    { date: '2026-06-21', weight: 85 },
    { date: '2026-06-22', weight: 290 },
    { date: '2026-06-23', weight: 275 },
    { date: '2026-06-24', weight: 310 },
  ];

  const [startDate, setStartDate] = useState('2026-06-11');
  const [endDate, setEndDate] = useState('2026-06-24');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    average: 0,
    peak: 0,
    peakDate: '',
  });

  useEffect(() => {
    let isMounted = true;
    console.log(`[Analytics] Fetching scrap data range: ${startDate} to ${endDate}`);

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        // GET request to /api/v1/admin/analytics/scraps with query bounds
        const response = await axiosInstance.get('/api/v1/admin/analytics/scraps', {
          params: { startDate, endDate },
        });

        if (isMounted && response.data) {
          console.log('[Analytics] Retrieved dynamic scrap data:', response.data);
          setFilteredData(response.data);
          calculateMetrics(response.data);
        }
      } catch (error) {
        console.warn(`[Analytics API Error] /api/v1/admin/analytics/scraps failed. Reverting to local mock filtering.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Gateway Connection Failure: ${error.message || 'Offline'}. Displaying mock analytics fallback telemetry.`);
          
          // Fallback mock calculations based on filtered local data
          const localFiltered = rawDataFallback.filter(
            (item) => item.date >= startDate && item.date <= endDate
          );
          setFilteredData(localFiltered);
          calculateMetrics(localFiltered);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const calculateMetrics = (dataArray) => {
      if (dataArray && dataArray.length > 0) {
        const total = dataArray.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
        const average = Math.round(total / dataArray.length);
        const maxVal = Math.max(...dataArray.map((d) => Number(d.weight) || 0));
        const peakDay = dataArray.find((d) => (Number(d.weight) || 0) === maxVal);

        setMetrics({
          total,
          average,
          peak: maxVal,
          peakDate: peakDay ? peakDay.date : '',
        });
      } else {
        setMetrics({ total: 0, average: 0, peak: 0, peakDate: '' });
      }
    };

    fetchAnalyticsData();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const handleReset = () => {
    setStartDate('2026-06-11');
    setEndDate('2026-06-24');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Logistics & Scrap Analytics</h1>
          <p className="text-sm text-slate-500">Monitor environmental metrics, daily scrap collection volumes, and carrier yields.</p>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 border border-amber-100/50 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline Database Active</span>
            </div>
          )}
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
          <ExportButton type="scraps" getData={() => filteredData} />
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-700">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Date Filter Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Date Range Filter</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-xl">
          <div className="space-y-1.5">
            <label htmlFor="startDate" className="text-xs font-bold text-slate-500">Start Date</label>
            <input 
              id="startDate"
              type="date"
              min="2026-06-11"
              max="2026-06-24"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endDate" className="text-xs font-bold text-slate-500">End Date</label>
            <input 
              id="endDate"
              type="date"
              min="2026-06-11"
              max="2026-06-24"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart View */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Scrap Volume Trends</h3>
            <p className="text-xs text-slate-400">Total scrap weight collected per day over the selected date range</p>
          </div>

          <div className="flex-1 flex items-center justify-center mt-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500">Fetching Chronological Data...</span>
              </div>
            ) : (
              <ScrapVolumeChart data={filteredData} />
            )}
          </div>
        </div>

        {/* Sidebar Statistics Widget */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-5">Yield Summary</h3>
            
            <div className="space-y-5">
              {/* Total Scraps collected */}
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <span className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-600">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Scraps Collected</span>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {loading ? (
                      <span className="inline-block h-5 w-20 rounded bg-slate-200 animate-pulse"></span>
                    ) : (
                      `${metrics.total.toLocaleString()} kg`
                    )}
                  </h4>
                </div>
              </div>

              {/* Average Daily Yield */}
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <span className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Average Daily Scrap Yield</span>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {loading ? (
                      <span className="inline-block h-5 w-20 rounded bg-slate-200 animate-pulse"></span>
                    ) : (
                      `${metrics.average.toLocaleString()} kg`
                    )}
                  </h4>
                </div>
              </div>

              {/* Peak yield day */}
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <span className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-600">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Peak Production Day</span>
                  <h4 className="text-base font-bold text-slate-800 mt-0.5">
                    {loading ? (
                      <span className="inline-block h-4 w-32 rounded bg-slate-200 animate-pulse"></span>
                    ) : metrics.peak > 0 ? (
                      `${metrics.peak} kg (${new Date(metrics.peakDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })})`
                    ) : (
                      'N/A'
                    )}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 text-xs text-emerald-800 leading-normal font-medium">
              Daily scrap weight aggregates the logistical yield of cleaning agents and carriers recycling materials on active duty.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
