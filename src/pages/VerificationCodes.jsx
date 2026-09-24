import React, { useState, useEffect, useCallback } from 'react';
import { 
  Key, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Home, 
  Car, 
  Recycle, 
  Trash2, 
  RefreshCw, 
  Timer, 
  Sparkles 
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';

const VerificationCodes = () => {
  const { density } = useTheme();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingCode, setDeletingCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Category Selection
  const [selectedCategory, setSelectedCategory] = useState('House Cleaning');
  
  const categories = [
    { id: 'House Cleaning', label: 'House Cleaning', icon: Home, color: 'text-blue-500' },
    { id: 'Vehicle Cleaning', label: 'Vehicle Cleaning', icon: Car, color: 'text-violet-500' },
    { id: 'Scrap and Recycling', label: 'Scrap and Recycling (Manager Only)', icon: Recycle, color: 'text-emerald-500' }
  ];

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await axiosInstance.get('/api/v1/data/verification-codes');
      if (response.data?.data) {
        // Filter out any locally expired (older than 30 mins) or used codes
        const now = Date.now();
        const validCodes = response.data.data.filter(item => {
          if (item.status === 'used') return false;
          const createdTime = new Date(item.createdAt).getTime();
          const expiryTime = item.expiresAt ? new Date(item.expiresAt).getTime() : createdTime + 30 * 60 * 1000;
          return expiryTime > now;
        });

        // Sort by createdAt descending
        setCodes(validCodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.warn(`[VerificationCodes] Failed to fetch.`, error.message);
      setErrorMsg(`Failed to connect to backend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
    // Auto-refresh codes every 60 seconds to prune expired ones
    const interval = setInterval(() => {
      fetchCodes();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchCodes]);

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      setErrorMsg('');
      setSuccessMsg('');
      const response = await axiosInstance.post('/api/v1/data/verification-codes', {
        category: selectedCategory
      });
      
      if (response.data?.data) {
        setCodes(prev => [response.data.data, ...prev]);
        setSuccessMsg(`New code ${response.data.data.code} generated! Valid for 30 minutes.`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (error) {
      setErrorMsg(`Failed to generate code: ${error.response?.data?.error || error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCode = async (code) => {
    if (!window.confirm(`Are you sure you want to permanently delete code ${code}?`)) return;

    try {
      setDeletingCode(code);
      await axiosInstance.delete(`/api/v1/data/verification-codes/${code}`);
      setCodes(prev => prev.filter(c => c.code !== code));
      setSuccessMsg(`Code ${code} deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(`Failed to delete code: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeletingCode(null);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Format remaining time in minutes
  const getRemainingTimeText = (codeItem) => {
    const now = Date.now();
    const createdTime = new Date(codeItem.createdAt).getTime();
    const expiryTime = codeItem.expiresAt ? new Date(codeItem.expiresAt).getTime() : createdTime + 30 * 60 * 1000;
    const diffMins = Math.max(0, Math.ceil((expiryTime - now) / (60 * 1000)));

    if (diffMins <= 0) return 'Expired';
    if (diffMins === 1) return '< 1 min left';
    return `${diffMins} mins left`;
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-xs' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-3' : 'px-6 py-4';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Partner Verification Codes</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/40">
              <Timer className="h-3 w-3" /> 30-Min Auto Expiry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate secure one-time registration codes for new partners. Codes are automatically deleted once used, and auto-delete after 30 minutes.
          </p>
        </div>

        <button
          onClick={fetchCodes}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Security Rule Information Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 text-xs text-violet-900 dark:text-violet-200 shadow-sm">
        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold block text-sm">Automated Security & Self-Purge Policy</span>
          <p className="mt-0.5 text-violet-700 dark:text-violet-300 font-medium">
            • <strong>Single-Use Only:</strong> Each code is immediately deleted from the database as soon as a partner registers with it.<br />
            • <strong>30-Minute Expiry:</strong> Unused codes automatically expire and get deleted after 30 minutes.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Notice</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Generator Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generate Single-Use Partner Code</h3>
          <span className="text-xs font-semibold text-slate-400">Step 1: Select Service Category</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Category Selector */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center cursor-pointer
                    ${isSelected 
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500' 
                      : 'border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700'}
                  `}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-violet-800 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 dark:shadow-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            Generate 30-Min Code
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Active Verification Codes</h3>
            <p className="text-xs text-slate-400">Only currently valid unconsumed codes are shown</p>
          </div>
          <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800">
            Active: {codes.length}
          </span>
        </div>
        
        {loading && codes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-violet-500" />
            <p className="text-sm font-semibold">Loading active verification codes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none text-[11px]">
                  <th className={thPadding}>Verification Code</th>
                  <th className={thPadding}>Category</th>
                  <th className={thPadding}>Remaining Validity</th>
                  <th className={thPadding}>Created On</th>
                  <th className={`${thPadding} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {codes.length > 0 ? (
                  codes.map((codeItem) => (
                    <tr key={codeItem.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      {/* Code + Copy */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-lg font-black tracking-widest text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {codeItem.code}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(codeItem.code)}
                            className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === codeItem.code ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                          {codeItem.category === 'Scrap and Recycling' ? <Recycle className="h-4 w-4 text-emerald-500" /> :
                           codeItem.category === 'House Cleaning' ? <Home className="h-4 w-4 text-blue-500" /> :
                           <Car className="h-4 w-4 text-violet-500" />}
                          <span>{codeItem.category}</span>
                        </div>
                      </td>

                      {/* Remaining Validity / Expiry countdown */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                            <Clock className="h-3.5 w-3.5" /> {getRemainingTimeText(codeItem)}
                          </span>
                        </div>
                      </td>

                      {/* Created On */}
                      <td className={tdPadding}>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {new Date(codeItem.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(codeItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions (Delete button) */}
                      <td className={`${tdPadding} text-right`}>
                        <button
                          onClick={() => handleDeleteCode(codeItem.code)}
                          disabled={deletingCode === codeItem.code}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Code Immediately"
                        >
                          {deletingCode === codeItem.code ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      <Key className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p className="font-semibold text-sm">No active verification codes</p>
                      <p className="text-xs text-slate-400 mt-1">Codes are automatically removed after 30 minutes or once used for registration.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationCodes;
