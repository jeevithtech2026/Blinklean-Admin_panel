import React from 'react';
import { Layers, Home, Car } from 'lucide-react';

const BookingFilter = ({ selectedCategory, onChange }) => {
  const categories = [
    { id: 'All', label: 'All Bookings', icon: Layers },
    { id: 'House Cleaning', label: 'House Cleaning', icon: Home },
    { id: 'Vehicle Cleaning', label: 'Vehicle Cleaning', icon: Car },
  ];

  return (
    <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const Icon = cat.icon;
        
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
              ${isSelected 
                ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-sm shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 border border-transparent'
              }
            `}
          >
            <Icon className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-70'}`} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};

export default BookingFilter;
