import React, { useState, useEffect } from 'react';
import * as centroCostoService from '../api/centroCostoService';
import toast from 'react-hot-toast';
import { PieChart, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const CentroCostoList = () => {
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON (ID inicializado en null)
  const [currentCC, setCurrentCC] = useState({
    id: null,
    nombre: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchCentrosCosto();
  }, []);

  const fetchCentrosCosto = async () => {
    try {
      const res = await centroCostoService.getCentrosCosto();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setCentrosCosto(dataArr);
    } catch (err) {
      toast.error("Error al cargar el catálogo de centros de costo");
      setCentrosCosto([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentCC.nombre.trim()) {
      toast.error("El nombre del centro de costo es requerido");
      return;
    }

    const loadId = toast.loading("Procesando estructura de costos...");
    try {
      if (isEditing) {
        await centroCostoService.updateCentroCosto(currentCC.id, currentCC);
        toast.success("Centro de costo actualizado correctamente", { id: loadId });
      } else {
        await centroCostoService.createCentroCosto(currentCC);
        toast.success("Centro de costo registrado con éxito", { id: loadId });
      }
      setIsModalOpen(false);
      fetchCentrosCosto();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error operativo en el servidor", { id: loadId });
    }
  };

  const openModal = (ccObj = null) => {
    if (ccObj) {
      setIsEditing(true);
      setCurrentCC({
        id: ccObj.id,
        nombre: ccObj.nombre || '',
        estado: ccObj.estado || 'ACTIVO'
      });
    } else {
      setIsEditing(false);
      setCurrentCC({ 
        id: null, // Mantiene la estructura nativa solicitada para la inserción
        nombre: '', 
        estado: 'ACTIVO' 
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado del Módulo */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="text-indigo-600" /> Centros de Costo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Definición de unidades de imputación contable para la distribución de gastos y presupuestos.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Crear Centro de Costo
        </button>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Código / ID</th>
              <th className="px-6 py-4 text-left">Denominación del Centro de Costo</th>
              <th className="px-6 py-4 text-left">Estado Contable</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(centrosCosto) && centrosCosto.map(cc => (
              <tr key={cc.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  #{cc.id ? String(cc.id).padStart(3, '0') : 'N/A'}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 uppercase tracking-wide">
                  {cc.nombre}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    cc.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cc.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {cc.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(cc)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {centrosCosto.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron centros de costo definidos en el sistema.
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
            {/* Header Modal */}
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PieChart size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Centro de Costo' : 'Nuevo Centro de Costo'}
              </h3>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Unidad / Área</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: DEPARTAMENTO DE MARKETING"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold text-slate-800"
                  value={currentCC.nombre || ''} 
                  onChange={e => setCurrentCC({...currentCC, nombre: e.target.value.toUpperCase()})} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de Imputación</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium text-slate-700"
                  value={currentCC.estado || 'ACTIVO'} 
                  onChange={e => setCurrentCC({...currentCC, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Permite asignación de egresos)</option>
                  <option value="INACTIVO">INACTIVO (Bloqueado para prorrateos)</option>
                </select>
              </div>
            </div>

            {/* Footer Acciones */}
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
                {isEditing ? 'Guardar Cambios' : 'Registrar Área'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default CentroCostoList;