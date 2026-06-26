import React, { useState, useEffect } from 'react';
import { Users, Coins, CheckSquare, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import PartnerFilter from '../components/PartnerFilter';
import PartnerTable from '../components/PartnerTable';
import ExportButton from '../components/ExportButton';
import axiosInstance from '../api/axiosInstance';

const Partners = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fallbackPartners = [
    { id: 'P-101', name: 'Marcus Vance', category: 'Electronic Scrap', completedCount: 12, rating: 4.9, highestRatedService: 'Mainboard Shredding', earnings: 320.00 },
    { id: 'P-102', name: 'Aisha Rahman', category: 'Metal Extraction', completedCount: 15, rating: 4.8, highestRatedService: 'Copper Recovery', earnings: 450.00 },
    { id: 'P-103', name: 'John Sterling', category: 'Hazardous Waste', completedCount: 8, rating: 4.7, highestRatedService: 'Chemical Neutralization', earnings: 280.00 },
    { id: 'P-104', name: 'Sarah Conner', category: 'Electronic Scrap', completedCount: 6, rating: 4.5, highestRatedService: 'Lithium Extraction', earnings: 190.00 },
    { id: 'P-105', name: 'Carlos Mendez', category: 'Appliance Recycling', completedCount: 18, rating: 4.9, highestRatedService: 'Refrigerator Degassing', earnings: 520.00 },
    { id: 'P-106', name: 'Zoe Winters', category: 'Metal Extraction', completedCount: 14, rating: 4.6, highestRatedService: 'Gold Smelting', earnings: 380.00 },
    { id: 'P-107', name: 'Kevin Hart', category: 'Hazardous Waste', completedCount: 5, rating: 4.4, highestRatedService: 'Lead Battery Disposal', earnings: 180.00 },
    { id: 'P-108', name: 'Elena Rostova', category: 'Appliance Recycling', completedCount: 11, rating: 4.7, highestRatedService: 'HVAC Recovery', earnings: 310.00 },
    { id: 'P-109', name: 'Amanda Ross', category: 'Electronic Scrap', completedCount: 9, rating: 4.8, highestRatedService: 'Display Panel Shredding', earnings: 260.00 },
    { id: 'P-110', name: 'David Miller', category: 'Metal Extraction', completedCount: 10, rating: 4.5, highestRatedService: 'Aluminum Sorting', earnings: 290.00 },
  ];

  // Dynamic calculations based on active partner state
  const activeCount = partners.filter(p => p.status === 'active').length;
  const pendingCount = partners.filter(p => p.status === 'pending').length;
  const approvedKyc = partners.filter(p => p.kycStatus === 'approved').length;

  useEffect(() => {
    let isMounted = true;
    console.log(`[Partners] Fetching performance data for category: ${selectedCategory}`);

    const fetchPartnersPerformance = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        // Fetch real partner data from DynamoDB via our backend
        const response = await axiosInstance.get('/api/v1/data/partners');

        if (isMounted && response.data?.data) {
          console.log('[Partners] Successfully retrieved partners from DynamoDB:', response.data);
          setPartners(response.data.data);
        }
      } catch (error) {
        console.warn(`[Partners API Error] /api/v1/admin/partners/performance failed. Reverting to local mock filtering.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Gateway Connection Failure: ${error.message || 'Offline'}. Displaying mock partner fallback registry.`);
          
          // Local filter fallback logic
          const localFiltered = fallbackPartners.filter(
            p => selectedCategory === 'All' ? true : p.category === selectedCategory
          );
          setPartners(localFiltered);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPartnersPerformance();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Management</h1>
          <p className="text-sm text-slate-500">Monitor active recycling partners, their daily service completions, and local earnings.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 border border-amber-100/50 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline Database Active</span>
            </div>
          )}
          <PartnerFilter selectedCategory={selectedCategory} onChange={setSelectedCategory} />
          <ExportButton type="partners" getData={() => partners} />
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

      {/* Aggregate Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Active Partners */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-violet-600">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Partners</span>
            <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                `${activeCount} Active`
              )}
            </h4>
          </div>
        </div>

        {/* KYC Approved */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-violet-600">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">KYC Approved</span>
            <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                `${approvedKyc} Verified`
              )}
            </h4>
          </div>
        </div>

        {/* Pending Onboarding */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-amber-600">
            <Coins className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pending Review</span>
            <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-24 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                `${pendingCount} Pending`
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Partner Performance Registry Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
          <span className="text-xs font-semibold text-slate-500">Querying Partner Registry...</span>
        </div>
      ) : (
        <PartnerTable partners={partners} />
      )}
    </div>
  );
};

export default Partners;
