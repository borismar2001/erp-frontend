import React, { useState, useEffect } from 'react';
import * as roleService from '../api/rolService';
import { getPerfiles } from '../api/perfilService'; // Para el catálogo de perfiles
import toast from 'react-hot-toast';
import { Shield, Plus, Edit, Trash2, CheckSquare, Square, FolderLock } from 'lucide-react';

const RoleList = () => {
  const [roles, setRoles] = useState([]); // Inicializado estrictamente como array
  const [catPerfiles, setCatPerfiles] = useState([]); // Catálogo para la matriz derecha
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estructura exacta solicitada por tu JSON
  const [currentRol, setCurrentRol] = useState({
    id: 0,
    rol: '',
    descripcion: '',
    estado: 'ACTIVO',
    perfiles: []
  });

  useEffect(() => {
    fetchRoles();
    fetchCatalogoPerfiles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await roleService.getRoles();
      // Blindaje contra respuestas nulas o paginadas del backend
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setRoles(dataArr);
    } catch (err) {
      toast.error("Error al cargar el listado de roles");
      setRoles([]);
    }
  };

  const fetchCatalogoPerfiles = async () => {
    try {
      const res = await getPerfiles();
      const perfilesArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setCatPerfiles(perfilesArr);
    } catch (err) {
      console.error("Error al cargar catálogo de perfiles:", err);
    }
  };

  // Lógica para alternar la selección de perfiles (ManyToMany)
  const handlePerfilToggle = (perfilObj) => {
    const perfilesActuales = currentRol.perfiles || [];
    const existe = perfilesActuales.some(p => p.id === perfilObj.id);

    let nuevosPerfiles = [];
    if (existe) {
      nuevosPerfiles = perfilesActuales.filter(p => p.id !== perfilObj.id);
    } else {
      // Mapeamos el perfil respetando la estructura JSON exacta requerida
      nuevosPerfiles = [
        ...perfilesActuales,
        {
          id: perfilObj.id,
          codigo: perfilObj.codigo || null,
          perfil: perfilObj.perfil || perfilObj.nombre, // Fallback por si tu servicio usa 'nombre'
          descripcion: perfilObj.descripcion || '',
          estado: perfilObj.estado || 'ACTIVO',
          menus: null
        }
      ];
    }

    setCurrentRol({ ...currentRol, perfiles: nuevosPerfiles });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Guardando cambios...");

    try {
      if (isEditing) {
        await roleService.updateRol(currentRol.id, currentRol);
        toast.success("Rol actualizado con éxito", { id: loadId });
      } else {
        await roleService.createRol(currentRol);
        toast.success("Rol creado con éxito", { id: loadId });
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al procesar la operación", { id: loadId });
    }
  };

  const openModal = (rolObj = null) => {
    if (rolObj) {
      setIsEditing(true);
      setCurrentRol({
        ...rolObj,
        perfiles: rolObj.perfiles || [] // Resguardo para evitar que sea null
      });
    } else {
      setIsEditing(false);
      setCurrentRol({ id: 0, rol: '', descripcion: '', estado: 'ACTIVO', perfiles: [] });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-indigo-600" /> Roles del Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Definición de roles funcionales globales y mapeo jerárquico de perfiles.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Crear Rol
        </button>
      </div>

      {/* Tabla Blindada contra Errores de Tipo */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Identificador del Rol</th>
              <th className="px-6 py-4 text-left">Descripción Funcional</th>
              <th className="px-6 py-4 text-center">Perfiles Vinculados</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {Array.isArray(roles) && roles.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-xs text-slate-700">
                  <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{r.rol}</span>
                </td>
                <td className="px-6 py-4 text-slate-500">{r.descripcion}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {(r.perfiles || []).map(p => (
                      <span key={p.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {p.perfil || p.nombre}
                      </span>
                    ))}
                    {(r.perfiles || []).length === 0 && (
                      <span className="text-xs text-slate-400 italic">Sin asignación</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${r.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(r)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[70vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Columna Izquierda: Atributos del Rol */}
            <div className="p-8 flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                  {isEditing ? 'Modificar Parámetros de Rol' : 'Registrar Nuevo Rol Global'}
                </h3>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Rol</label>
                  <input 
                    type="text" 
                    placeholder="EJ: SYSTEM_ADMIN" 
                    required 
                    className="w-full border rounded-lg p-2.5 mt-1 outline-none focus:border-indigo-500 uppercase font-mono text-sm"
                    value={currentRol.rol || ''} 
                    onChange={e => setCurrentRol({...currentRol, rol: e.target.value.toUpperCase()})} 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                  <textarea 
                    placeholder="Escriba el alcance o propósito de este rol corporativo..." 
                    rows={3} 
                    className="w-full border rounded-lg p-2.5 mt-1 outline-none focus:border-indigo-500 text-sm resize-none"
                    value={currentRol.descripcion || ''} 
                    onChange={e => setCurrentRol({...currentRol, descripcion: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Estado Operativo</label>
                  <select 
                    className="w-full border rounded-lg p-2.5 mt-1 outline-none bg-transparent text-sm font-medium"
                    value={currentRol.estado || 'ACTIVO'} 
                    onChange={e => setCurrentRol({...currentRol, estado: e.target.value})}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t mt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-100">
                  Guardar Rol
                </button>
              </div>
            </div>

            {/* Columna Derecha: Matriz Multiselección de Perfiles */}
            <div className="bg-slate-50 p-8 w-full md:w-80 border-l border-slate-200 flex flex-col h-full">
              <div className="mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Asociación de Perfiles
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Selecciona los perfiles que se integrarán a este rol funcional.</p>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {catPerfiles.map(perfilItem => {
                  const estaMarcado = (currentRol.perfiles || []).some(p => p.id === perfilItem.id);
                  
                  return (
                    <div 
                      key={perfilItem.id}
                      onClick={() => handlePerfilToggle(perfilItem)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                        estaMarcado 
                          ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm' 
                          : 'bg-transparent border-transparent hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderLock size={16} className={estaMarcado ? "text-indigo-500" : "text-slate-400"} />
                        <span className="text-xs font-bold">
                          {perfilItem.perfil || perfilItem.nombre}
                        </span>
                      </div>
                      {estaMarcado ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} className="text-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default RoleList;