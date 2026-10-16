import React from 'react';

const StatusBadge = ({ estado }) => {
  const configs = {
    ACTIVO: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'ACTIVO'
    },
    ELABORADO: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
      label: 'ELABORADO'
    },
    INACTIVO: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'INACTIVO'
    },
    ELIMINADO: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'ELIMINADO'
    }
  };

  const current = configs[estado] || {
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    label: estado || 'Desconocido'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] tracking-wider border shadow-sm ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${current.dot}`}></span>
      {current.label}
    </span>
  );
};

export default StatusBadge;