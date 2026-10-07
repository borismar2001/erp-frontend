import React, { useState, useEffect } from 'react';
import * as tipoCambioService from '../api/tipoCambioService';
import toast from 'react-hot-toast';
import { RefreshCw, Plus, Edit, Trash2, Calendar, Coins, CheckCircle2, XCircle } from 'lucide-react';

const TipoCambioList = () => {
  const [tiposCambio, setTiposCambio] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Obtener fecha actual local en formato exacto YYYY-MM-DD
  const getFechaActualISO = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  };

  // Estructura exacta solicitada por tu JSON
  const [currentTC, setCurrentTC] = useState({
    id: null,
    fecha: getFechaActualISO(),
    monedaOrigen: '',
    monedaDestino: '',
    valor: 0,
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchTiposCambio();
  }, []);

  const fetchTiposCambio = async () => {
    try {
      const res = await tipoCambioService.getTiposCambio();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setTiposCambio(dataArr);
    } catch (err) {
      toast.error("Error al cargar el historial de tasas de cambio");
      setTiposCambio([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentTC.monedaOrigen || !currentTC.monedaDestino) {
      toast.error("Ambas divisas son requeridas");
      return;
    }
    if (currentTC.monedaOrigen === currentTC.monedaDestino) {
      toast.error("La moneda de origen y destino no pueden ser iguales");
      return;
    }
    if (currentTC.valor <= 0) {
      toast.error("El valor de conversión debe ser un número mayor a cero");
      return;
    }

    const loadId = toast.loading("Actualizando pizarra de cotizaciones...");
    try {
      if (isEditing) {
        await tipoCambioService.updateTipoCambio(currentTC.id, currentTC);
        toast.success("Tipo de cambio actualizado con éxito", { id: loadId });
      } else {
        await tipoCambioService.createTipoCambio(currentTC);
        toast.success("Nueva cotización registrada correctamente", { id: loadId });
      }
      setIsModalOpen(false);
      fetchTiposCambio();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error en el servidor central", { id: loadId });
    }
  };

  const openModal = (tcObj = null) => {
    if (tcObj) {
      setIsEditing(true);
      setCurrentTC({
        id: tcObj.id,
        fecha: tcObj.fecha || getFechaActualISO(),
        monedaOrigen: tcObj.monedaOrigen || '',
        monedaDestino: tcObj.monedaDestino || '',
        valor: tcObj.valor || 0,
        estado: tcObj.estado || 'ACTIVO'
      });
    } else {
      setIsEditing(false);
      setCurrentTC({
        id: null,
        fecha: getFechaActualISO(),
        monedaOrigen: 'BOB', // Valor base sugerido
        monedaDestino: 'USD',
        valor: '',
        estado: 'ACTIVO'
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="text-indigo-600 animate-spin-slow" /> Mesa de Divisas (Tipo de Cambio)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Control diario de equivalencias cambiaras multimoneda para transacciones del ERP.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Registrar Cotización
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Fecha Registro</th>
              <th className="px-6 py-4 text-left">Par de Divisas</th>
              <th className="px-6 py-4 text-left">Valor de Conversión</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(tiposCambio) && tiposCambio.map(tc => (
              <tr key={tc.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-600 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {tc.fecha}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 tracking-wide">
                    <span className="bg-slate-100 px-2 py-0.5 border rounded text-xs">{tc.monedaOrigen}</span>
                    <span className="text-slate-400 font-medium">➔</span>
                    <span className="bg-indigo-50 px-2 py-0.5 border border-indigo-100 text-indigo-700 text-xs">{tc.monedaDestino}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-black text-slate-900 text-base">
                  {Number(tc.valor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    tc.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tc.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {tc.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(tc)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {tiposCambio.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No hay cotizaciones vigentes cargadas para este ciclo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSave} 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Coins size={18} className="text-indigo-600" />
                {isEditing ? 'Ajustar Par de Cotización' : 'Ingresar Tipo de Cambio'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* FECHA CONTROLADA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha de Vigencia</label>
                <input 
                  type="date" 
                  required 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500"
                  value={currentTC.fecha || ''} 
                  onChange={e => setCurrentTC({...currentTC, fecha: e.target.value})} 
                />
              </div>

              {/* MONEDAS ORIGEN / DESTINO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Moneda Origen</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={3}
                    placeholder="Ej: BOB"
                    className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 uppercase font-mono font-bold text-center"
                    value={currentTC.monedaOrigen || ''} 
                    onChange={e => setCurrentTC({...currentTC, monedaOrigen: e.target.value.toUpperCase().replace(/[^A-Z]/g, '')})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Moneda Destino</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={3}
                    placeholder="Ej: USD"
                    className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 uppercase font-mono font-bold text-center"
                    value={currentTC.monedaDestino || ''} 
                    onChange={e => setCurrentTC({...currentTC, monedaDestino: e.target.value.toUpperCase().replace(/[^A-Z]/g, '')})} 
                  />
                </div>
              </div>

              {/* VALOR DE CONVERSIÓN */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Valor Cambiario (Tasa)</label>
                <input 
                  type="number" 
                  required 
                  step="0.0001"
                  min="0.0001"
                  placeholder="Ej: 6.96"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500"
                  value={currentTC.valor || ''} 
                  onChange={e => setCurrentTC({...currentTC, valor: parseFloat(e.target.value) || 0})} 
                />
              </div>

              {/* ESTADO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de la Pizarra</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium"
                  value={currentTC.estado || 'ACTIVO'} 
                  onChange={e => setCurrentTC({...currentTC, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Cotización preferente vigente)</option>
                  <option value="INACTIVO">INACTIVO (Histórico / Deprecado)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 bg-white border text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-100"
              >
                {isEditing ? 'Modificar Tasa' : 'Publicar Cotización'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default TipoCambioList;