import React, { useState, useEffect } from 'react';
import { Key, Trash2, Copy, Check, Plus, ExternalLink, Code, X, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';
import axiosInstance from '../api/axiosInstance';

const initialApiKeys = [
  { id: '1', name: 'Production Logistics Integration', maskedKey: 'sk_live_••••8a2b', created: '2026-03-12', lastUsed: '5 mins ago' },
  { id: '2', name: 'Partner Payout Sync Service', maskedKey: 'sk_live_••••f41a', created: '2026-04-18', lastUsed: '2 hours ago' },
];

const WebhookSettings = () => {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [webhookLogs, setWebhookLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [newKeyNameInput, setNewKeyNameInput] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Webhook Registration State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [secretHeader, setSecretHeader] = useState('');
  const [selectedEvents, setSelectedEvents] = useState({
    'booking.created': false,
    'booking.completed': false,
    'partner.status_changed': false,
    'scrap.limit_exceeded': false
  });

  // Modal State for Viewing Log Payload
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchWebhooks = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/v1/data/webhooks');
        if (isMounted) {
          const allData = res.data?.data || [];
          
          // Split into API keys and Webhook configs based on type
          const fetchedKeys = allData.filter(d => d.type === 'apiKey');
          const fetchedWebhooks = allData.filter(d => d.type === 'webhook' || !d.type);

          setApiKeys(fetchedKeys);
          setWebhookLogs(fetchedWebhooks);
          setIsOffline(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchWebhooks();
    return () => { isMounted = false; };
  }, []);

  const handleCopyKey = (id, keyVal) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedKeyId(id);
    triggerGlobalNotification('API Key copied to clipboard.', 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyNameInput.trim()) {
      triggerGlobalNotification('Please enter a name for the API key.', 'warning');
      return;
    }

    try {
      const newKeyData = {
        type: 'apiKey',
        name: newKeyNameInput,
        maskedKey: `sk_live_••••${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never'
      };

      const res = await axiosInstance.post('/api/v1/data/webhooks', newKeyData);
      
      setApiKeys((prev) => [res.data.data, ...prev]);
      setNewKeyNameInput('');
      triggerGlobalNotification(`API Key "${newKeyData.name}" created successfully in database.`, 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to create key: ${err.message}`, 'error');
    }
  };

  const handleDeleteApiKey = async (id) => {
    try {
      await axiosInstance.delete(`/api/v1/data/webhooks/${id}`);
      setApiKeys((prev) => prev.filter(k => k.id !== id && k.webhookId !== id));
      triggerGlobalNotification('API Key successfully revoked from database.', 'success');
    } catch (err) {
      triggerGlobalNotification(`Failed to revoke key: ${err.message}`, 'error');
    }
  };

  const handleRegisterWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl) {
      triggerGlobalNotification('Webhook endpoint URL is required.', 'warning');
      return;
    }
    const events = Object.keys(selectedEvents).filter(k => selectedEvents[k]);
    if (events.length === 0) {
      triggerGlobalNotification('Choose at least one event trigger.', 'warning');
      return;
    }

    try {
      const newWebhookData = {
        type: 'webhook',
        url: webhookUrl,
        event: events.join(', '),
        status: 200,
        headers: secretHeader ? { Authorization: secretHeader } : {}
      };

      const res = await axiosInstance.post('/api/v1/data/webhooks', newWebhookData);
      
      setWebhookLogs((prev) => [res.data.data, ...prev]);
      triggerGlobalNotification(`Webhook endpoint registered for events: ${events.join(', ')}`, 'success');
      setWebhookUrl('');
      setSecretHeader('');
    } catch (err) {
      triggerGlobalNotification(`Failed to register webhook: ${err.message}`, 'error');
    }
  };

  const toggleEventCheckbox = (evt) => {
    setSelectedEvents((prev) => ({ ...prev, [evt]: !prev[evt] }));
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Webhooks & Developer APIs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate secure API keys for automated integrations and register outbound webhooks.</p>
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

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Developer API Key Management Grid */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Developer Access Keys</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Manage client keys authorized to access BlinkLean administrative gateway endpoints.</p>
          </div>
          <form onSubmit={handleCreateApiKey} className="flex gap-2">
            <input
              type="text"
              placeholder="Descriptive key name..."
              value={newKeyNameInput}
              onChange={(e) => setNewKeyNameInput(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-300 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Key</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Key Name</th>
                <th className="px-4 py-3">Token Mask</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {apiKeys.length > 0 ? apiKeys.map((k) => (
                <tr key={k.id || k.webhookId} className="hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{k.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{k.maskedKey}</span>
                      <button 
                        onClick={() => handleCopyKey(k.id || k.webhookId, k.maskedKey)} 
                        className="text-slate-400 hover:text-violet-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedKeyId === (k.id || k.webhookId) ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-medium">{k.created}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-medium">{k.lastUsed}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDeleteApiKey(k.id || k.webhookId)}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs font-medium">No API keys configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Register Webhook Configurator */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Register Webhook Endpoint</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Add an external server destination to receive real-time push notifications of system events.</p>
          </div>

          <form onSubmit={handleRegisterWebhook} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payload URL</label>
              <input
                type="url"
                required
                placeholder="https://api.yourdomain.com/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Secret / Authorization Header (Optional)</label>
              <input
                type="password"
                placeholder="Bearer token or custom secret..."
                value={secretHeader}
                onChange={(e) => setSecretHeader(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trigger Events</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(selectedEvents).map((evt) => (
                  <label key={evt} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${selectedEvents[evt] ? 'border-violet-500 bg-violet-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-violet-400'}`}>
                      {selectedEvents[evt] && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedEvents[evt]} onChange={() => toggleEventCheckbox(evt)} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">{evt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <Code className="h-4 w-4" />
                Register Endpoint
              </button>
            </div>
          </form>
        </div>

        {/* Webhook Delivery Logs */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-[480px]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Deliveries</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Live feed of outbound webhook dispatch attempts.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loading ? (
               <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-slate-300" /></div>
            ) : webhookLogs.length > 0 ? webhookLogs.map((log) => (
              <div 
                key={log.webhookId || Math.random()} 
                onClick={() => setSelectedLog(log)}
                className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3 cursor-pointer hover:border-violet-200 dark:hover:border-violet-900/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${log.status >= 200 && log.status < 300 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{log.webhookId || 'WH-UNKNOWN'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.event || 'Unknown Event'}</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[180px]" title={log.url || log.endpointUrl}>{log.url || log.endpointUrl || 'No Endpoint URL Configured'}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                    log.status >= 200 && log.status < 300 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' 
                      : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40'
                  }`}>
                    {log.status || 200}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">No webhook delivery logs found in DynamoDB.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookSettings;
