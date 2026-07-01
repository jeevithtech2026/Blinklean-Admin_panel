import React, { useState, useEffect } from 'react';
import { Key, Plus, ShieldCheck, Clock, Copy, CheckCircle2, AlertTriangle, Loader2, Home, Car, Recycle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';

const VerificationCodes = () => {
  const { density } = useTheme();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Category Selection
  const [selectedCategory, setSelectedCategory] = useState('House Cleaning');
  
  const categories = [
    { id: 'House Cleaning', label: 'House Cleaning', icon: Home, color: 'text-blue-500' },
    { id: 'Vehicle Cleaning', label: 'Vehicle Cleaning', icon: Car, color: 'text-violet-500' },
    { id: 'Scrap and Recycling', label: 'Scrap and Recycling (Manager Only)', icon: Recycle, color: 'text-emerald-500' }
  ];

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await axiosInstance.get('/api/v1/data/verification-codes');
      if (response.data?.data) {
        // Sort by createdAt descending
        setCodes(response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.warn(`[VerificationCodes] Failed to fetch.`, error.message);
      setErrorMsg(`Failed to connect to backend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      setErrorMsg('');
      const response = await axiosInstance.post('/api/v1/data/verification-codes', {
        category: selectedCategory
      });
      
      if (response.data?.data) {
        setCodes([response.data.data, ...codes]);
      }
    } catch (error) {
      setErrorMsg(`Failed to generate code: ${error.response?.data?.error || error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-3' : 'px-6 py-4';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Partner Verification Codes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate and manage secure registration codes for new partners.</p>
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Error</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Generator Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Generate New Code</h3>
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
                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center
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
            className="flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 dark:shadow-none transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            Generate Code
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Active & Historical Codes</h3>
          <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">Total: {codes.length}</span>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-violet-500" />
            <p className="text-sm font-semibold">Loading verification codes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <th className={thPadding}>Verification Code</th>
                  <th className={thPadding}>Category</th>
                  <th className={thPadding}>Status</th>
                  <th className={thPadding}>Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {codes.length > 0 ? (
                  codes.map((codeItem) => (
                    <tr key={codeItem.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-lg font-black tracking-widest text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {codeItem.code}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(codeItem.code)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-md transition-colors border border-slate-200 dark:border-slate-700"
                            title="Copy Code"
                          >
                            {copiedCode === codeItem.code ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                      <td className={tdPadding}>
                        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                          {codeItem.category === 'Scrap and Recycling' ? <Recycle className="h-4 w-4 text-emerald-500" /> :
                           codeItem.category === 'House Cleaning' ? <Home className="h-4 w-4 text-blue-500" /> :
                           <Car className="h-4 w-4 text-violet-500" />}
                          {codeItem.category}
                        </div>
                      </td>
                      <td className={tdPadding}>
                        {codeItem.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5" /> Used
                          </span>
                        )}
                      </td>
                      <td className={tdPadding}>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date(codeItem.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(codeItem.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <Key className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p>No verification codes generated yet.</p>
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
