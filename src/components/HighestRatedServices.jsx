import React from 'react';
import { Star } from 'lucide-react';

const HighestRatedServices = ({ loading }) => {
  const services = [
    { name: 'Deep Cleaning', category: 'Home Services', rating: 4.9, completions: 824 },
    { name: 'Express Clean', category: 'Home Services', rating: 4.8, completions: 1202 },
    { name: 'Eco Sanitation', category: 'Specialized', rating: 4.7, completions: 452 },
    { name: 'Carpet Wash', category: 'Specialized', rating: 4.6, completions: 312 },
    { name: 'Sofa & Upholstery', category: 'Specialized', rating: 4.5, completions: 189 },
  ];

  // Helper to render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
        <span className="font-semibold text-slate-800">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200"></div>
          <div className="h-3 w-60 rounded bg-slate-100"></div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-10 w-full rounded bg-slate-50"></div>
          <div className="h-10 w-full rounded bg-slate-50"></div>
          <div className="h-10 w-full rounded bg-slate-50"></div>
          <div className="h-10 w-full rounded bg-slate-50"></div>
          <div className="h-10 w-full rounded bg-slate-50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col h-full justify-between">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Highest Rated Services</h2>
        <p className="text-xs text-slate-400">Top performing customer offerings by rating and popularity</p>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Service Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Average Rating</th>
              <th className="px-6 py-4">Total Completions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {services.map((service, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{service.name}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-lg bg-violet-50 text-violet-700 px-2.5 py-0.5 text-xs font-medium border border-violet-100">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4">{renderStars(service.rating)}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{service.completions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HighestRatedServices;
