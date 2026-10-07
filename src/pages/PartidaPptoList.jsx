import React, { useState, useEffect } from 'react';
import * as partidaPptoService from '../api/partidaPptoService';
import toast from 'react-hot-toast';
import { Target, Plus, Edit, Trash2, CheckCircle2, XCircle, Search } from 'lucide-react';

const PartidaPptoList = () => {
  const [partidas, setPartidas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Filtro de búsqueda reactiva

  // Estructura exacta solicitada por tu JSON
  const [currentPartida, setCurrentPartida] = useState({
    id: null,
    codigo: '',
    nombre: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchPartidasPpto();
  }, []);

  const fetchPartidasPpto = async () => {
    try {
      const res = await partidaPptoService.getPartidasPpto();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      
      // Ordenamos las partidas de forma alfanumérica por su código presupuestario
      const dataOrdenada = dataArr.sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
      setPartidas(dataOrdenada);
    } catch (err) {
      toast.error("Error al cargar el clasificador de partidas presupuestarias");
      setPartidas([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentPartida.codigo.trim()) {
      toast.error("El código de la partida presupuestaria es obligatorio");
      return;
    }
    if (!currentPartida.nombre.trim()) {
      toast.error("La denominación de la partida es requerida");
      return;
    }

    const loadId = toast.loading("Registrando partida en el clasificador general...");
    try {
      if (isEditing) {
        await partidaPptoService.updatePartidaPpto(currentPartida.id, currentPartida);
        toast.success("Partida presupuestaria modificada con éxito", { id: loadId });
      } else {
        await partidaPptoService.createPartidaPpto(currentPartida);
        toast.success("Partida integrada correctamente al presupuesto", { id: loadId });
      }
      setIsModalOpen(false);
      fetchPartidasPpto();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error en los servidores contables", { id: loadId });
    }
  };

  const openModal = (partidaObj = null) => {
    if (partidaObj) {
      setIsEditing(true);
      setCurrentPartida({
        id: partidaObj.id,
        codigo: partidaObj.codigo || '',
        nombre: partidaObj.nombre || '',
        estado: partidaObj.estado || 'ACTIVO'
      });
    } else {
      setIsEditing(false);
      setCurrentPartida({ 
        id: null, // Requerido para la persistencia limpia en Spring Boot
        codigo: '',
        nombre: '', 
        estado: 'ACTIVO' 
      });
    }
    setIsModalOpen(true);
  };

  // Filtrado reactivo en tiempo real
  const partidasFiltradas = partidas.filter(p => 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-1">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-600" /> Clasificador de Partidas Presupuestarias
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Estructura de control por objeto del gasto e ingresos para la formulación presupuestaria.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Crear Partida
        </button>
      </div>

      {/* Barra de Búsqueda Rápida */}
      <div className="mb-4 max-w-md bg-white border border-slate-100 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-indigo-500 transition-colors">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por código o descripción de la partida..."
          className="w-full text-xs outline-none bg-transparent text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla Corporativa */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left w-48">Código Partida</th>
              <th className="px-6 py-4 text-left">Denominación del Objeto del Gasto</th>
              <th className="px-6 py-4 text-left">Estado Presupuestario</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {partidasFiltradas.map(partida => (
              <tr key={partida.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs tracking-wider">
                  {partida.codigo}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 uppercase tracking-wide">
                  {partida.nombre}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    partida.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {partida.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {partida.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(partida)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar Parámetros"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar Partida"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {partidasFiltradas.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron partidas presupuestarias que coincidan con la búsqueda.
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
                <Target size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Partida Presupuestaria' : 'Configurar Nueva Partida'}
              </h3>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* CÓDIGO DE PARTIDA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Código de la Partida</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: 11700 o 2110"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500 bg-transparent text-slate-800"
                  value={currentPartida.codigo || ''} 
                  onChange={e => {
                    // Filtrar para permitir números, letras o guiones según los requerimientos de tu código
                    const valClean = e.target.value.replace(/[^0-9A-Za-z-]/g, '');
                    setCurrentPartida({...currentPartida, codigo: valClean});
                  }} 
                />
              </div>

              {/* DESCRIPCIÓN / NOMBRE */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Denominación de la Partida (Objeto)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: SUELDOS Y SALARIOS TRASLADADOS"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold text-slate-800"
                  value={currentPartida.nombre || ''} 
                  onChange={e => setCurrentPartida({...currentPartida, nombre: e.target.value.toUpperCase()})} 
                />
              </div>

              {/* ESTADO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado Presupuestario</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium text-slate-700"
                  value={currentPartida.estado || 'ACTIVO'} 
                  onChange={e => setCurrentPartida({...currentPartida, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Vigente para ejecución física-financiera)</option>
                  <option value="INACTIVO">INACTIVO (Bloquear asignaciones preventivas)</option>
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
                {isEditing ? 'Guardar Cambios' : 'Dar de Alta'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default PartidaPptoList;