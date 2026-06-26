import React, { useState, useEffect } from 'react';
import { Ticket, RefreshCw, AlertTriangle, WifiOff, Tag, Plus, X, Megaphone, Send, Calendar, Clock, Trash2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import CouponsTable from '../components/CouponsTable';
import { triggerGlobalNotification } from '../context/NotificationContext';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    couponId: '',
    discountPercentage: '',
    validUntil: '',
    isActive: true,
    maxUsageLimit: '',
    usagePerUser: '',
    validServices: []
  });

  const [availableServices, setAvailableServices] = useState([]);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedCouponForBroadcast, setSelectedCouponForBroadcast] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState({ title: '', body: '' });
  const [broadcasting, setBroadcasting] = useState(false);

  // Scheduled Campaigns State
  const [activeTab, setActiveTab] = useState('coupons');
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', body: '', date: '', time: '' });
  const [scheduling, setScheduling] = useState(false);

  // Derived Metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive).length;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const [couponsRes, servicesRes] = await Promise.all([
          axiosInstance.get('/api/v1/data/coupons'),
          axiosInstance.get('/api/v1/data/services').catch(() => ({ data: { data: [] } }))
        ]);

        if (isMounted) {
          if (couponsRes.data) {
            console.log('[Coupons] Successfully retrieved coupons from DynamoDB:', couponsRes.data);
            setCoupons(couponsRes.data.data || []);
          }
          if (servicesRes.data) {
            setAvailableServices(servicesRes.data.data || []);
          }
        }
      } catch (error) {
        console.warn(`[Coupons API Error] failed to fetch data.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.couponId || !newCoupon.discountPercentage) {
      triggerGlobalNotification('Please fill in coupon code and discount %', 'warning');
      return;
    }

    try {
      const payload = {
        ...newCoupon,
        couponId: newCoupon.couponId.toUpperCase().trim(),
        discountPercentage: Number(newCoupon.discountPercentage),
        maxUsageLimit: newCoupon.maxUsageLimit ? Number(newCoupon.maxUsageLimit) : undefined,
        usagePerUser: newCoupon.usagePerUser ? Number(newCoupon.usagePerUser) : undefined,
        validServices: newCoupon.validServices && newCoupon.validServices.length > 0 ? newCoupon.validServices : []
      };

      const res = await axiosInstance.post('/api/v1/data/coupons', payload);
      setCoupons((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setNewCoupon({ couponId: '', discountPercentage: '', validUntil: '', isActive: true, maxUsageLimit: '', usagePerUser: '', validServices: [] });
      triggerGlobalNotification(`Coupon ${payload.couponId} created successfully.`, 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to create coupon: ${err.message}`, 'error');
    }
  };

  const handleServiceToggle = (serviceId) => {
    setNewCoupon(prev => {
      const current = prev.validServices || [];
      if (current.includes(serviceId)) {
        return { ...prev, validServices: current.filter(id => id !== serviceId) };
      } else {
        return { ...prev, validServices: [...current, serviceId] };
      }
    });
  };

  const handleOpenBroadcastModal = (coupon) => {
    setSelectedCouponForBroadcast(coupon);
    setBroadcastMessage({
      title: `🎉 Special Offer: Use Code ${coupon.couponId}`,
      body: `Get a special ${coupon.discountPercentage}% discount on your next BlinKlean service! Enter code ${coupon.couponId} at checkout. Valid until ${coupon.validUntil || 'further notice'}. 🏠✨`
    });
    setShowBroadcastModal(true);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.title || !broadcastMessage.body) {
      triggerGlobalNotification('Please fill in both title and message body', 'warning');
      return;
    }

    try {
      setBroadcasting(true);
      const res = await axiosInstance.post('/api/v1/data/notifications/broadcast', {
        title: broadcastMessage.title,
        body: broadcastMessage.body
      });
      setShowBroadcastModal(false);
      triggerGlobalNotification(`Broadcast successful! Sent to ${res.data.sent || 0} users.`, 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to broadcast: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await axiosInstance.get('/api/v1/data/notifications/scheduled');
      setCampaigns(res.data.data || []);
    } catch (err) {
      console.error('[Coupons] Failed to fetch scheduled campaigns:', err);
      triggerGlobalNotification('Failed to load scheduled campaigns', 'error');
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    }
  }, [activeTab]);

  const handleScheduleCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.body || !newCampaign.date || !newCampaign.time) {
      triggerGlobalNotification('Please fill in all campaign fields', 'warning');
      return;
    }

    try {
      setScheduling(true);
      // Combine date and time to ISO string in UTC
      const localDateTime = new Date(`${newCampaign.date}T${newCampaign.time}`);
      const sendAt = localDateTime.toISOString();

      const payload = {
        title: newCampaign.title,
        body: newCampaign.body,
        sendAt
      };

      const res = await axiosInstance.post('/api/v1/data/notifications/scheduled', payload);
      setCampaigns((prev) => [res.data.data, ...prev]);
      setShowScheduleModal(false);
      setNewCampaign({ title: '', body: '', date: '', time: '' });
      triggerGlobalNotification('Campaign scheduled successfully.', 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to schedule campaign: ${err.message}`, 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this scheduled campaign?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/api/v1/data/notifications/scheduled/${campaignId}`);
      setCampaigns((prev) => prev.filter((c) => c.notificationId !== campaignId));
      triggerGlobalNotification('Campaign cancelled successfully.', 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to cancel campaign: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Discount & Promos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage promotional codes and special offers.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline</span>
            </div>
          )}
          {activeTab === 'coupons' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </button>
          ) : (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Schedule Campaign
            </button>
          )}
          <button
            onClick={() => activeTab === 'coupons' ? window.location.reload() : fetchCampaigns()}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading || campaignsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-slate-850">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'coupons'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Discount Coupons
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'campaigns'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Scheduled Campaigns
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Promo Code</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. SUMMER26" 
                  value={newCoupon.couponId} 
                  onChange={(e) => setNewCoupon({...newCoupon, couponId: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount %</label>
                <input 
                  type="number" 
                  required
                  min="1" max="100"
                  placeholder="e.g. 15" 
                  value={newCoupon.discountPercentage} 
                  onChange={(e) => setNewCoupon({...newCoupon, discountPercentage: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valid Until</label>
                <input 
                  type="date" 
                  value={newCoupon.validUntil} 
                  onChange={(e) => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 outline-none focus:border-orange-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Total Usage</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Unlimited" 
                    value={newCoupon.maxUsageLimit} 
                    onChange={(e) => setNewCoupon({...newCoupon, maxUsageLimit: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Usage Per User</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Unlimited" 
                    value={newCoupon.usagePerUser} 
                    onChange={(e) => setNewCoupon({...newCoupon, usagePerUser: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Applicable Services (Empty = All Services)</label>
                <div className="max-h-32 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  {availableServices.length > 0 ? availableServices.map(service => (
                    <label key={service.serviceId || service.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(newCoupon.validServices || []).includes(service.serviceId || service.id)}
                        onChange={() => handleServiceToggle(service.serviceId || service.id)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{service.category || service.name || 'Unknown Service'}</span>
                    </label>
                  )) : (
                    <span className="text-xs text-slate-500 px-2 py-1">No services found</span>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 text-sm font-bold text-white shadow-md transition-all">
                  Generate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {activeTab === 'coupons' ? (
        <>
          {/* Aggregate Metrics Row */}
          <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
              <span className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 p-3 text-orange-600 dark:text-orange-400">
                <Tag className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Coupons</span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {loading ? <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span> : totalCoupons}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
              <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 text-emerald-600 dark:text-emerald-400">
                <Ticket className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Promo Codes</span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {loading ? <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span> : activeCoupons}
                </h4>
              </div>
            </div>
          </div>

          {/* Main Table View */}
          {loading ? (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-semibold">Loading coupons from AWS DynamoDB...</p>
            </div>
          ) : (
            <CouponsTable coupons={coupons} onBroadcast={handleOpenBroadcastModal} />
          )}
        </>
      ) : (
        /* Scheduled Campaigns View */
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {campaignsLoading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-semibold">Loading scheduled campaigns...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none text-xs">
                    <th className="px-6 py-4">Title / Message</th>
                    <th className="px-6 py-4">Scheduled Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                      <tr key={camp.notificationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="px-6 py-4 max-w-md">
                          <div className="font-semibold text-slate-900 dark:text-white">{camp.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{camp.body}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(camp.sendAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {camp.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-amber-900/40 px-2.5 py-1 text-xs font-bold">
                              ⏳ Pending
                            </span>
                          ) : camp.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 text-xs font-bold">
                              ✅ Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 px-2.5 py-1 text-xs font-bold">
                              ❌ Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {camp.status === 'pending' && (
                            <button
                              onClick={() => handleCancelCampaign(camp.notificationId)}
                              title="Cancel & Delete scheduled notification"
                              className="text-rose-600 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <Calendar className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No scheduled campaigns found</h4>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                            You have not scheduled any custom push notification campaigns yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Offer Modal */}
      {showBroadcastModal && selectedCouponForBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Megaphone className="h-5 w-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast Coupon</h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Coupon Info</span>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Code: <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedCouponForBroadcast.couponId}</span></span>
                <span>Discount: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedCouponForBroadcast.discountPercentage}%</span></span>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notification Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="Notification Header" 
                  value={broadcastMessage.title} 
                  onChange={(e) => setBroadcastMessage({...broadcastMessage, title: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="Write message to send..." 
                  value={broadcastMessage.body} 
                  onChange={(e) => setBroadcastMessage({...broadcastMessage, body: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500 resize-none" 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={broadcasting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-orange-650 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
                >
                  <Send className={`h-4 w-4 ${broadcasting ? 'animate-bounce' : ''}`} />
                  <span>{broadcasting ? 'Broadcasting Now...' : 'Send Push Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Campaign Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Megaphone className="h-5 w-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Push Notification</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notification Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 🌧️ Monsoon deep clean offer!" 
                  value={newCampaign.title} 
                  onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="e.g. Stay cozy while we handle the mud and dust. Book deep cleaning today and get 15% off!" 
                  value={newCampaign.body} 
                  onChange={(e) => setNewCampaign({...newCampaign, body: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500 resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Send Date</label>
                  <input 
                    type="date" 
                    required
                    value={newCampaign.date} 
                    onChange={(e) => setNewCampaign({...newCampaign, date: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500 text-slate-600 dark:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Send Time (Local)</label>
                  <input 
                    type="time" 
                    required
                    value={newCampaign.time} 
                    onChange={(e) => setNewCampaign({...newCampaign, time: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-orange-500 text-slate-600 dark:text-slate-400" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={scheduling}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-orange-650 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{scheduling ? 'Scheduling...' : 'Schedule Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
