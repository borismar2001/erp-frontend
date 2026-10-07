import React, { useState, useEffect } from 'react';
import * as auxiliarService from '../api/auxiliarService';
import toast from 'react-hot-toast';
import { Layers, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const AuxiliarList = () => {
  const [auxiliares, setAuxiliares] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON
  const [currentAuxiliar, setCurrentAuxiliar] = useState({
    id: null,
    nombre: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchAuxiliares();
  }, []);

  const fetchAuxiliares = async () => {
    try {
      const res = await auxiliarService.getAuxiliares();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setAuxiliares(dataArr);
    } catch (err) {
      toast.error("Error al cargar el catálogo de auxiliares");
      setAuxiliares([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentAuxiliar.nombre.trim()) {
      toast.error("El nombre del auxiliar es obligatorio");
      return;
    }

    const loadId = toast.loading("Procesando registro contable...");
    try {
      if (isEditing) {
        await auxiliarService.updateAuxiliar(currentAuxiliar.id, currentAuxiliar);
        toast.success("Auxiliar actualizado correctamente", { id: loadId });
      } else {
        await auxiliarService.createAuxiliar(currentAuxiliar);
        toast.success("Auxiliar registrado con éxito", { id: loadId });
      }
      setIsModalOpen(false);
      fetchAuxiliares();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error operativo en el servidor", { id: loadId });
    }
  };

  const openModal = (auxiliarObj = null) => {
    if (auxiliarObj) {
      setIsEditing(true);
      setCurrentAuxiliar({
        id: auxiliarObj.id,
        nombre: auxiliarObj.nombre || '',
        estado: auxiliarObj.estado || 'ACTIVO'
      });
    } else {
      setIsEditing(false);
      setCurrentAuxiliar({ id: null, nombre: '', estado: 'ACTIVO' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado del Módulo */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-600" /> Auxiliares de Comprobantes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Subcuentas de asignación analítica para el desglose detallado en asientos contables.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Crear Auxiliar
        </button>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Código / ID</th>
              <th className="px-6 py-4 text-left">Denominación del Auxiliar</th>
              <th className="px-6 py-4 text-left">Estado Contable</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(auxiliares) && auxiliares.map(aux => (
              <tr key={aux.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  #{String(aux.id).padStart(4, '0')}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 uppercase tracking-wide">
                  {aux.nombre}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    aux.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {aux.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {aux.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(aux)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Deshabilitar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {auxiliares.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron auxiliares definidos en el plan contable.
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
                <Layers size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Auxiliar' : 'Nuevo Registro Auxiliar'}
              </h3>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre / Descripción del Auxiliar</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: CUENTAS POR COBRAR - CLIENTES LOCALES"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold text-slate-800"
                  value={currentAuxiliar.nombre || ''} 
                  onChange={e => setCurrentAuxiliar({...currentAuxiliar, nombre: e.target.value.toUpperCase()})} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de Asignación</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium text-slate-700"
                  value={currentAuxiliar.estado || 'ACTIVO'} 
                  onChange={e => setCurrentAuxiliar({...currentAuxiliar, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Disponible en comprobantes)</option>
                  <option value="INACTIVO">INACTIVO (Bloquear uso en asientos)</option>
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
                {isEditing ? 'Guardar Cambios' : 'Habilitar Auxiliar'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default AuxiliarList;