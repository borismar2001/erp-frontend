import React from 'react';
import { Calendar } from 'lucide-react';

const FormDatePicker = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  disabled = false,
  placeholder = "dd/mm/aaaa"
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Calendar size={12} className="text-indigo-600" />
          {label} {required && "*"}
        </label>
      )}
      <div className="relative">
        <input 
          type="date" 
          required={required}
          disabled={disabled}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400 transition-all text-xs cursor-pointer"
        />
      </div>
    </div>
  );
};

export default FormDatePicker;