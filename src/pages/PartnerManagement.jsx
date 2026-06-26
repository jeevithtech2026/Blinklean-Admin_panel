import React, { useState } from 'react';
import { Search, UserCheck, UserX, Star, Filter } from 'lucide-react';

const PartnerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [partners, setPartners] = useState([
    { id: 'P-101', name: 'Marcus Vance', service: 'Deep Cleaning', rating: 4.8, status: 'Active', joins: 'May 12, 2025', orders: 124 },
    { id: 'P-102', name: 'Aisha Rahman', service: 'Express Clean', rating: 4.9, status: 'Active', joins: 'Jun 02, 2025', orders: 98 },
    { id: 'P-103', name: 'John Sterling', service: 'Eco Sanitation', rating: 4.5, status: 'Active', joins: 'Jan 20, 2025', orders: 204 },
    { id: 'P-104', name: 'Sarah Conner', service: 'Deep Cleaning', rating: 3.2, status: 'Suspended', joins: 'Feb 15, 2025', orders: 42 },
    { id: 'P-105', name: 'Carlos Mendez', service: 'Carpet Wash', rating: 5.0, status: 'Pending', joins: 'Jun 22, 2026', orders: 0 },
    { id: 'P-106', name: 'Zoe Winters', service: 'Express Clean', rating: 4.7, status: 'Pending', joins: 'Jun 23, 2026', orders: 0 }
  ]);

  const handleStatusChange = (id, newStatus) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' ? true : p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Registry</h1>
          <p className="text-sm text-slate-500">Approve onboarding applications, monitor ratings, and change access rights.</p>
        </div>
        <button className="rounded-xl bg-violet-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-all hover:scale-[1.01]">
          Add New Partner
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by ID, name, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-violet-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none hover:border-slate-300"
          >
            <option value="All">All Partners</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending Screening</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPartners.length > 0 ? (
          filteredPartners.map((partner) => (
            <div key={partner.id} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-slate-200/50">
              <div>
                {/* Identity header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-lg font-bold text-violet-600 border border-violet-100">
                      {partner.name.split(' ').map(n => n[0]).join('')}
                      {partner.status === 'Active' && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{partner.name}</h3>
                      <span className="text-xs font-mono text-slate-400">{partner.id}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    partner.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    partner.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {partner.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Specialization</span>
                    <span className="font-semibold text-slate-700">{partner.service}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Fulfillments</span>
                    <span className="font-semibold text-slate-700">{partner.orders}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Avg Rating</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                      {partner.rating}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Joined</span>
                    <span className="font-semibold text-slate-700">{partner.joins}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex items-center justify-end gap-2">
                {partner.status === 'Suspended' ? (
                  <button 
                    onClick={() => handleStatusChange(partner.id, 'Active')}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Re-Activate
                  </button>
                ) : partner.status === 'Pending' ? (
                  <>
                    <button 
                      onClick={() => handleStatusChange(partner.id, 'Active')}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-sm cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStatusChange(partner.id, 'Suspended')}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleStatusChange(partner.id, 'Suspended')}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">No partners match the selected filter/search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerManagement;
