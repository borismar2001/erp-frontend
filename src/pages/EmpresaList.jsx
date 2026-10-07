import React, { useState, useEffect } from 'react';
import * as empresaService from '../api/empresaService';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const EmpresaList = () => {
  const [empresas, setEmpresas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON con fallbacks seguros
  const [currentEmpresa, setCurrentEmpresa] = useState({
    id: null,
    nit: '',
    razonSocial: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const res = await empresaService.getEmpresas();
      // Blindaje contra respuestas paginadas u objetos vacíos
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setEmpresas(dataArr);
    } catch (err) {
      toast.error("Error al cargar el listado de empresas");
      setEmpresas([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validaciones preventivas en el Frontend
    if (!currentEmpresa.nit.trim()) {
      toast.error("El campo NIT es obligatorio");
      return;
    }
    if (!currentEmpresa.razonSocial.trim()) {
      toast.error("La Razón Social es obligatoria");
      return;
    }

    const loadId = toast.loading("Procesando solicitud...");
    try {
      if (isEditing) {
        await empresaService.updateEmpresa(currentEmpresa.id, currentEmpresa);
        toast.success("Empresa actualizada correctamente", { id: loadId });
      } else {
        await empresaService.createEmpresa(currentEmpresa);
        toast.success("Empresa registrada con éxito", { id: loadId });
      }
      setIsModalOpen(false);
      fetchEmpresas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error operativo en el servidor", { id: loadId });
    }
  };

  const openModal = (empresaObj = null) => {
    if (empresaObj) {
      setIsEditing(true);
      setCurrentEmpresa({
        id: empresaObj.id,
        nit: empresaObj.nit || '',
        razonSocial: empresaObj.razonSocial || '',
        estado: empresaObj.estado || 'ACTIVO'
      });
    } else {
      setIsEditing(false);
      setCurrentEmpresa({ id: null, nit: '', razonSocial: '', estado: 'ACTIVO' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado del Módulo */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> Unidades de Negocio (Empresas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de entidades legales fiscales autorizadas en el ecosistema ERP.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Registrar Empresa
        </button>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">NIT / Identificación Fiscal</th>
              <th className="px-6 py-4 text-left">Razón Social o Denominación</th>
              <th className="px-6 py-4 text-left">Estado Operativo</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(empresas) && empresas.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-xs">
                  <span className="bg-slate-100 px-2.5 py-1 rounded border text-slate-700">{emp.nit}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 uppercase tracking-wide">
                  {emp.razonSocial}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    emp.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {emp.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {emp.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(emp)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron empresas registradas en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Centralizado Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSave} 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header Modal */}
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Entidad Legal' : 'Nueva Entidad Comercial'}
              </h3>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Número de NIT</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: 1020304023"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500 bg-transparent"
                  value={currentEmpresa.nit || ''} 
                  onChange={e => {
                    // Sanitización: Permite solo números y guiones si aplica
                    const valClean = e.target.value.replace(/[^0-9-]/g, '');
                    setCurrentEmpresa({...currentEmpresa, nit: valClean});
                  }} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Razón Social</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: CORPORACION ALFA S.A."
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold"
                  value={currentEmpresa.razonSocial || ''} 
                  onChange={e => setCurrentEmpresa({...currentEmpresa, razonSocial: e.target.value.toUpperCase()})} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado Institucional</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium"
                  value={currentEmpresa.estado || 'ACTIVO'} 
                  onChange={e => setCurrentUser({...currentEmpresa, estado: e.target.value})}
                  onChange={e => setCurrentEmpresa({...currentEmpresa, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Habilitada para operaciones)</option>
                  <option value="INACTIVO">INACTIVO (Bloquear transacciones)</option>
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
                {isEditing ? 'Actualizar Ficha' : 'Guardar Empresa'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default EmpresaList;