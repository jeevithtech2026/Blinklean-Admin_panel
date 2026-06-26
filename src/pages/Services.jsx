import React, { useState, useEffect } from 'react';
import { Briefcase, RefreshCw, AlertTriangle, WifiOff, ListPlus, Tag, Star } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import ServicesTable from '../components/ServicesTable';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Derived Metrics
  const totalServices = services.length;
  const pricedServices = services.filter(s => s.price).length;
  const averagePrice = pricedServices > 0 
    ? (services.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0) / pricedServices).toFixed(2)
    : 0;

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const response = await axiosInstance.get('/api/v1/data/services');

        if (isMounted && response.data) {
          console.log('[Services] Successfully retrieved services from DynamoDB:', response.data);
          setServices(response.data.data || []);
        }
      } catch (error) {
        console.warn(`[Services API Error] /api/v1/data/services failed.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchServices();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Service Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your active service offerings and pricing tiers.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline</span>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Aggregate Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Catalog Items */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-3 text-violet-600 dark:text-violet-400">
            <ListPlus className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Available Services</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${totalServices} Active`
              )}
            </h4>
          </div>
        </div>

        {/* Priced Services */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 text-emerald-600 dark:text-emerald-400">
            <Tag className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Standard Pricing</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${pricedServices} Items`
              )}
            </h4>
          </div>
        </div>

        {/* Average Price */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-3 text-amber-600 dark:text-amber-500">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Average Price</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(averagePrice)
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-violet-500" />
          <p className="text-sm font-semibold">Loading real-time services from AWS DynamoDB...</p>
        </div>
      ) : (
        <ServicesTable services={services} />
      )}
    </div>
  );
};

export default Services;
