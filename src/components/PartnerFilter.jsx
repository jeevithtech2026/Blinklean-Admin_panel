import React from 'react';
import { Filter } from 'lucide-react';

const PartnerFilter = ({ selectedCategory, onChange }) => {
  const categories = [
    { value: 'All', label: 'All Categories' },
    { value: 'Electronic Scrap', label: 'Electronic Scrap' },
    { value: 'Metal Extraction', label: 'Metal Extraction' },
    { value: 'Hazardous Waste', label: 'Hazardous Waste' },
    { value: 'Appliance Recycling', label: 'Appliance Recycling' },
  ];

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm md:w-80">
      <Filter className="h-4.5 w-4.5 text-slate-400 shrink-0" />
      <div className="flex-1">
        <label htmlFor="categoryFilter" className="sr-only">Filter by Service Category</label>
        <select
          id="categoryFilter"
          value={selectedCategory}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value} className="font-semibold text-slate-700">
              {cat.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PartnerFilter;
