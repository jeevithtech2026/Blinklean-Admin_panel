import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BankDetailsModal from './BankDetailsModal';

const PartnerTable = ({ partners }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, partners.length]);

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100"><CheckCircle className="h-3 w-3" />Active</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-100"><Clock className="h-3 w-3" />Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-100"><XCircle className="h-3 w-3" />{status || 'Unknown'}</span>;
    }
  };

  // KYC badge helper
  const getKycBadge = (kycStatus) => {
    switch (kycStatus) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-violet-50 text-violet-700 border-violet-100"><CheckCircle className="h-3 w-3" />Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-100"><Clock className="h-3 w-3" />Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-100"><XCircle className="h-3 w-3" />{kycStatus || 'N/A'}</span>;
    }
  };

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query) ||
      (p.city || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  const sortedPartners = useMemo(() => {
    if (!sortField || !sortDirection) return filteredPartners;
    return [...filteredPartners].sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredPartners, sortField, sortDirection]);

  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPartners.slice(start, start + rowsPerPage);
  }, [sortedPartners, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedPartners.length / rowsPerPage));

  const handleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortField(null); setSortDirection(null); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
    return sortDirection === 'asc' ? <span className="text-violet-600">▲</span> : <span className="text-violet-600">▼</span>;
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';
  const avatarSize = isCompact ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
        <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, ID, city or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding}>Partner</th>
                <th className={thPadding} onClick={() => handleSort('city')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">City {renderSortIndicator('city')}</div>
                </th>
                <th className={thPadding}>Skills</th>
                <th className={thPadding} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Status {renderSortIndicator('status')}</div>
                </th>
                <th className={thPadding}>KYC</th>
                <th className={thPadding}>Joined</th>
                <th className={`${thPadding} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedPartners.length > 0 ? (
                paginatedPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    {/* Partner Name & ID */}
                    <td className={tdPadding}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 font-bold text-violet-700 dark:text-violet-400 ${avatarSize}`}>
                          {(partner.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">{partner.name || '—'}</div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{partner.email || partner.id?.slice(0, 16) + '...'}</div>
                        </div>
                      </div>
                    </td>
                    {/* City */}
                    <td className={`${tdPadding} font-semibold text-slate-600 dark:text-slate-350`}>
                      {partner.city || '—'}
                    </td>
                    {/* Skills */}
                    <td className={tdPadding}>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(partner.skills || []).slice(0, 2).map((skill) => (
                          <span key={skill} className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {skill}
                          </span>
                        ))}
                        {(partner.skills || []).length > 2 && (
                          <span className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            +{partner.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className={tdPadding}>{getStatusBadge(partner.status)}</td>
                    {/* KYC Status */}
                    <td className={tdPadding}>{getKycBadge(partner.kycStatus)}</td>
                    {/* Joined Date */}
                    <td className={`${tdPadding} text-slate-500 dark:text-slate-400 font-medium`}>
                      {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    {/* Actions */}
                    <td className={`${tdPadding} text-right`}>
                      <button 
                        onClick={() => {
                          setSelectedPartner(partner);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Bank
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No partners match your current search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-850/20 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-350 outline-none cursor-pointer border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg"
            >
              {[5, 10, 25].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedPartners.length} partners)</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BankDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={selectedPartner}
        onUpdate={(id, newBankDetails) => {
          if (selectedPartner && selectedPartner.id === id) {
            selectedPartner.bankDetails = newBankDetails;
          }
        }}
      />
    </div>
  );
};

export default PartnerTable;

