import React, { useState, useEffect } from 'react';
import * as sucursalService from '../api/sucursalService';
import { getEmpresas } from '../api/empresaService'; // Reutilizamos el catálogo de empresas
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit, Trash2, Building, CheckCircle2, XCircle } from 'lucide-react';

const SucursalList = () => {
  const [sucursales, setSucursales] = useState([]);
  const [catEmpresas, setCatEmpresas] = useState([]); // Catálogo de empresas para el select
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON
  const [currentSucursal, setCurrentSucursal] = useState({
    id: null,
    nombre: '',
    estado: 'ACTIVO',
    idEmpresa: null
  });

  useEffect(() => {
    fetchSucursales();
    fetchCatalogoEmpresas();
  }, []);

  const fetchSucursales = async () => {
    try {
      const res = await sucursalService.getSucursales();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setSucursales(dataArr);
    } catch (err) {
      toast.error("Error al cargar las sucursales");
      setSucursales([]);
    }
  };

  const fetchCatalogoEmpresas = async () => {
    try {
      const res = await getEmpresas();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      // Opcional: Filtrar para mostrar solo empresas activas en el formulario
      setCatEmpresas(dataArr.filter(e => e.estado === 'ACTIVO'));
    } catch (err) {
      console.error("Error al cargar empresas para el catálogo:", err);
    }
  };

  // Helper para pintar el nombre de la empresa en la tabla usando el idEmpresa
  const obtenerNombreEmpresa = (idEmpresa) => {
    const emp = catEmpresas.find(e => e.id === idEmpresa);
    return emp ? emp.razonSocial : `ID Empresa: ${idEmpresa}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentSucursal.idEmpresa || currentSucursal.idEmpresa === 0) {
      toast.error("Debe seleccionar una Empresa corporativa corporativa");
      return;
    }

    const loadId = toast.loading("Guardandocursal...");
    try {
      if (isEditing) {
        await sucursalService.updateSucursal(currentSucursal.id, currentSucursal);
        toast.success("Sucursal actualizada correctamente", { id: loadId });
      } else {
        await sucursalService.createSucursal(currentSucursal);
        toast.success("Sucursal registrada con éxito", { id: loadId });
      }
      setIsModalOpen(false);
      fetchSucursales();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error en el servidor", { id: loadId });
    }
  };

  const openModal = (sucursalObj = null) => {
    if (sucursalObj) {
      setIsEditing(true);
      setCurrentSucursal({
        id: sucursalObj.id,
        nombre: sucursalObj.nombre || '',
        estado: sucursalObj.estado || 'ACTIVO',
        idEmpresa: sucursalObj.idEmpresa || 0
      });
    } else {
      setIsEditing(false);
      setCurrentSucursal({ id: null, nombre: '', estado: 'ACTIVO', idEmpresa: catEmpresas[0]?.id || null });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-indigo-600" /> Control de Sucursales
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Administración de puntos de venta y agencias físicas ligadas a corporaciones.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Nueva Sucursal
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Punto / Sucursal</th>
              <th className="px-6 py-4 text-left">Empresa Corporativa</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {Array.isArray(sucursales) && sucursales.map(suc => (
              <tr key={suc.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 uppercase tracking-wide">
                  {suc.nombre}
                </td>
                <td className="px-6 py-4 font-medium text-slate-500 flex items-center gap-2">
                  <Building size={14} className="text-slate-400" />
                  {obtenerNombreEmpresa(suc.idEmpresa)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    suc.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {suc.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {suc.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(suc)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {sucursales.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron sucursales registradas.
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Sucursal' : 'Configurar Nueva Sucursal'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* SELECT EMPRESA RELACIONADA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Empresa de Adscripción</label>
                <select 
                  required
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-white font-semibold text-slate-700 focus:border-indigo-500"
                  value={currentSucursal.idEmpresa || ''} 
                  onChange={e => setCurrentSucursal({...currentSucursal, idEmpresa: Number(e.target.value)})}
                >
                  <option value="">-- Seleccione la Entidad Legal --</option>
                  {catEmpresas.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.razonSocial} (NIT: {emp.nit})
                    </option>
                  ))}
                </select>
              </div>

              {/* NOMBRE SUCURSAL */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Sucursal / Agencia</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: SUCURSAL CENTRAL - ZONA NORTE"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 uppercase font-semibold"
                  value={currentSucursal.nombre || ''} 
                  onChange={e => setCurrentSucursal({...currentSucursal, nombre: e.target.value.toUpperCase()})} 
                />
              </div>

              {/* ESTADO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de Operación</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium"
                  value={currentSucursal.estado || 'ACTIVO'} 
                  onChange={e => setCurrentSucursal({...currentSucursal, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Permite facturación y asignaciones)</option>
                  <option value="INACTIVO">INACTIVO (Bloqueada temporalmente)</option>
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
                {isEditing ? 'Actualizar Cambios' : 'Dar de Alta'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default SucursalList;