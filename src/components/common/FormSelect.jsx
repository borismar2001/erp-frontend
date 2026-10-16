import React from 'react';

const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  required = false, 
  placeholder = "-- Seleccione --", 
  disabled = false, 
  icon: Icon 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
          {Icon && <Icon size={12} className="text-indigo-600" />}
          {label} {required && "*"}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full border border-slate-200 rounded-xl p-3 font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none disabled:bg-slate-100 disabled:text-slate-400 transition-all cursor-pointer text-xs"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const optId = opt.id !== undefined ? opt.id : opt.value;
            const optLabel = opt.nombre || opt.label || opt.descripcion;
            const extraInfo = opt.empresa?.razonSocial ? ` (${opt.empresa.razonSocial})` : '';
            
            return (
              <option key={optId} value={optId}>
                {optLabel}{extraInfo}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default FormSelect;