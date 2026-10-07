import React, { useState, useEffect } from 'react';
import * as ejercicioService from '../api/ejercicioService';
import { getSucursales } from '../api/sucursalService'; // Catálogo de sucursales
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Edit, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react';

const EjercicioList = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [catSucursales, setCatSucursales] = useState([]); // Catálogo para el dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON
  const [currentEjercicio, setCurrentEjercicio] = useState({
    id: null,
    nombre: '',
    gestion: new Date().getFullYear(), // Inicializa con el año actual por comodidad
    estado: 'ACTIVO',
    idSucursal: null
  });

  useEffect(() => {
    fetchEjercicios();
    fetchCatalogoSucursales();
  }, []);

  const fetchEjercicios = async () => {
    try {
      const res = await ejercicioService.getEjercicios();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setEjercicios(dataArr);
    } catch (err) {
      toast.error("Error al cargar los ejercicios fiscales");
      setEjercicios([]);
    }
  };

  const fetchCatalogoSucursales = async () => {
    try {
      const res = await getSucursales();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setCatSucursales(dataArr.filter(s => s.estado === 'ACTIVO'));
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
    }
  };

  // Helper para traducir el idSucursal al nombre legible en la tabla
  const obtenerNombreSucursal = (idSucursal) => {
    const suc = catSucursales.find(s => s.id === idSucursal);
    return suc ? suc.nombre : `ID Sucursal: ${idSucursal}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentEjercicio.idSucursal || currentEjercicio.idSucursal === 0) {
      toast.error("Debe asociar el ejercicio a una Sucursal obligatoriamente");
      return;
    }
    if (!currentEjercicio.gestion || currentEjercicio.gestion === 0) {
      toast.error("El año de la gestión es requerido");
      return;
    }

    const loadId = toast.loading("Guardando periodo fiscal...");
    try {
      if (isEditing) {
        await ejercicioService.updateEjercicio(currentEjercicio.id, currentEjercicio);
        toast.success("Ejercicio administrativo modificado", { id: loadId });
      } else {
        await ejercicioService.createEjercicio(currentEjercicio);
        toast.success("Ejercicio dado de alta correctamente", { id: loadId });
      }
      setIsModalOpen(false);
      fetchEjercicios();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al procesar la solicitud", { id: loadId });
    }
  };

  const openModal = (ejercicioObj = null) => {
    if (ejercicioObj) {
      setIsEditing(true);
      setCurrentEjercicio({
        id: ejercicioObj.id,
        nombre: ejercicioObj.nombre || '',
        gestion: ejercicioObj.gestion || 0,
        estado: ejercicioObj.estado || 'ACTIVO',
        idSucursal: ejercicioObj.idSucursal || 0
      });
    } else {
      setIsEditing(false);
      setCurrentEjercicio({
        id: null,
        nombre: '',
        gestion: new Date().getFullYear(),
        estado: 'ACTIVO',
        idSucursal: catSucursales[0]?.id || null
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
            <CalendarDays className="text-indigo-600" /> Ejercicios (Gestiones Administrativas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Apertura y control de periodos anuales contables por sucursal física.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Aperturar Ejercicio
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Periodo / Ejercicio</th>
              <th className="px-6 py-4 text-left">Gestión Anual</th>
              <th className="px-6 py-4 text-left">Sucursal Operativa</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(ejercicios) && ejercicios.map(ej => (
              <tr key={ej.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 uppercase tracking-wide">
                  {ej.nombre}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                  {ej.gestion}
                </td>
                <td className="px-6 py-4 font-medium text-slate-500 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  {obtenerNombreSucursal(ej.idSucursal)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    ej.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {ej.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {ej.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(ej)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Cerrar Gestión"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {ejercicios.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron gestiones administrativas configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSave} 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays size={18} className="text-indigo-600" />
                {isEditing ? 'Configurar Parámetros del Ejercicio' : 'Apertura de Periodo Fiscal'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* SELECT SUCURSAL ASOCIADA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sucursal Reguladora</label>
                <select 
                  required
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-white font-semibold text-slate-700 focus:border-indigo-500"
                  value={currentEjercicio.idSucursal || ''} 
                  onChange={e => setCurrentEjercicio({...currentEjercicio, idSucursal: Number(e.target.value)})}
                >
                  <option value="">-- Seleccione Sucursal Destino --</option>
                  {catSucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* GESTIÓN NUMÉRICA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Año de la Gestión (Numérico)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={4}
                  placeholder="Ej: 2026"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500"
                  value={currentEjercicio.gestion || ''} 
                  onChange={e => {
                    // Sanitización: Solo números
                    const valClean = e.target.value.replace(/[^0-9]/g, '');
                    setCurrentEjercicio({...currentEjercicio, gestion: Number(valClean)});
                  }} 
                />
              </div>

              {/* NOMBRE DEL EJERCICIO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Identificador / Nombre del Ejercicio</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: EJERCICIO FISCAL ANUAL 2026"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 uppercase font-semibold"
                  value={currentEjercicio.nombre || ''} 
                  onChange={e => setCurrentEjercicio({...currentEjercicio, nombre: e.target.value.toUpperCase()})} 
                />
              </div>

              {/* ESTADO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado del Ciclo</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium"
                  value={currentEjercicio.estado || 'ACTIVO'} 
                  onChange={e => setCurrentEjercicio({...currentEjercicio, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Periodo abierto para transacciones)</option>
                  <option value="INACTIVO">INACTIVO / CERRADO (Bloqueo contable histórico)</option>
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
                {isEditing ? 'Modificar Registro' : 'Habilitar Gestión'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default EjercicioList;