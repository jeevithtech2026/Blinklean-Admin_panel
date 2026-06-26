import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, Briefcase, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ServicesTable = ({ services }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, services.length]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;
    return services.filter((s) =>
      (s.category || '').toLowerCase().includes(query) ||
      (s.serviceId || '').toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  const sortedServices = useMemo(() => {
    if (!sortField || !sortDirection) return filteredServices;
    return [...filteredServices].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'price') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredServices, sortField, sortDirection]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedServices.slice(start, start + rowsPerPage);
  }, [sortedServices, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedServices.length / rowsPerPage));

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
          placeholder="Search services by category or ID..."
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
                <th className={thPadding} onClick={() => handleSort('serviceId')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Service ID {renderSortIndicator('serviceId')}</div>
                </th>
                <th className={thPadding} onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Category {renderSortIndicator('category')}</div>
                </th>
                <th className={thPadding} onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Base Price {renderSortIndicator('price')}</div>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedServices.length > 0 ? (
                paginatedServices.map((service) => (
                  <tr key={service.serviceId || Math.random()} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    {/* Service ID */}
                    <td className={tdPadding}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 text-cyan-600 dark:text-cyan-400 ${avatarSize}`}>
                          <Tag className="h-4 w-4" />
                        </div>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{service.serviceId || 'N/A'}</span>
                      </div>
                    </td>
                    {/* Category */}
                    <td className={tdPadding}>
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">{service.category || 'Unnamed Service'}</div>
                    </td>
                    {/* Price */}
                    <td className={tdPadding}>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {service.price ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(service.price) : 'Price Variable'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No services match your current search criteria.
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
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedServices.length} services)</span>
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
    </div>
  );
};

export default ServicesTable;
