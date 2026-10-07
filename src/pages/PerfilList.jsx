import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as menuService from '../api/menuService';
import * as perfilService from '../api/perfilService';
import { Shield, Plus, Edit, Trash2, CheckSquare, Square, Folder, FileText } from 'lucide-react';

const PerfilList = () => {
  const [perfiles, setPerfiles] = useState([]);
  const [catMenuTree, setCatMenuTree] = useState([]); // Catálogo en árbol del backend
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado inicial siguiendo tu estructura JSON
  const [currentPerfil, setCurrentPerfil] = useState({
id: 0,
    codigo: '',
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO',
    menus: [] // Array de objetos menú asignados
  });

  useEffect(() => {
    fetchPerfiles();
    fetchCatalogoMenus();
  }, []);

  const fetchPerfiles = async () => {
    try {
      const res = await perfilService.getPerfiles();
      setPerfiles(res.data);
    } catch (err) {
      toast.error("Error al obtener perfiles");
    }
  };
const fetchCatalogoMenus = async () => {
    try {
      // Nota: Asumiendo un endpoint que traiga el árbol completo de menús del sistema.
      // Si usas el mismo de usuario, pásale el ID de un admin o ajusta a tu endpoint general /api/menus
      const res = await menuService.getMenus(); 
      setCatMenuTree(res.data);
    } catch (err) {
      toast.error("Error al cargar el catálogo de menús");
    }
  };
// Lógica para alternar la selección de un menú
  const handleMenuToggle = (menuItem) => {
    const menusActuales = currentPerfil.menus || [];
    const existe = menusActuales.some(m => m.id === menuItem.id);

    let nuevosMenus = [];

    if (existe) {
      // Eliminar el menú seleccionado
      nuevosMenus = menusActuales.filter(m => m.id !== menuItem.id);
      
      // Regla de Negocio: Si desmarcas un PADRE, desmarca automáticamente todos sus HIJOS
      if (menuItem.hijos && menuItem.hijos.length > 0) {
        const hijosIds = menuItem.hijos.map(h => h.id);
        nuevosMenus = nuevosMenus.filter(m => !hijosIds.includes(m.id));
      }
    } else {
      // Agregar el menú seleccionado con su estructura básica requerida
      const menuFormateado = {
        id: menuItem.id,
        url: menuItem.url,
        icono: menuItem.icono,
        tipo: menuItem.tipo,
        descripcion: menuItem.descripcion,
        padreId: menuItem.padreId || 0,
        estado: menuItem.estado || 'ACTIVO'
      };
      
      nuevosMenus = [...menusActuales, menuFormateado];

      // Regla de Negocio: Si marcas un HIJO, asegúrate de marcar su PADRE si no está marcado
      if (menuItem.padreId && menuItem.padreId !== 0) {
        const padreYaMarcado = nuevosMenus.some(m => m.id === menuItem.padreId);
        if (!padreYaMarcado) {
          // Buscamos el objeto padre en nuestro árbol de catálogo
          const padreOriginal = catMenuTree.find(p => p.id === menuItem.padreId);
          if (padreOriginal) {
            nuevosMenus.push({
              id: padreOriginal.id,
              url: padreOriginal.url,
              icono: padreOriginal.icono,
              tipo: padreOriginal.tipo,
              descripcion: padreOriginal.descripcion,
              padreId: 0,
              estado: 'ACTIVO'
            });
          }
        }
      }
    }

    setCurrentPerfil({ ...currentPerfil, menus: nuevosMenus });
  };  
  const handleSave = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Guardando...");
    try {
      if (isEditing) {
        await perfilService.updatePerfil(currentPerfil.id, currentPerfil); 
        //api.put(`/api/perfil/${currentPerfil.id}`, currentPerfil);
      } else {        
        await perfilService.createPerfil(currentPerfil); 
        //api.post('/api/perfil', currentPerfil);
      }
      toast.success("Perfil guardado con éxito", { id: loadId });
      setIsModalOpen(false);
      fetchPerfiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error en la operación", { id: loadId });
    }
  };

  const openModal = (perfil = null) => {
    if (perfil) {
      setIsEditing(true);
      setCurrentPerfil(perfil);
    } else {
      setIsEditing(false);
      setCurrentPerfil({ codigo: '', perfil: '', descripcion: '', estado: 'ACTIVO' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-lg text-white">
        <h2 className="text-xl font-bold">Gestión de Perfiles</h2>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-bold transition-colors"
        >
          + Nuevo Perfil
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-4 text-center">Menús Autorizados</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {perfiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-blue-600">{p.codigo}</td>
                <td className="px-6 py-4 text-sm font-semibold">{p.perfil}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.descripcion}</td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-xs border border-indigo-100">
                    {p.menus?.length || 0} Accesos
                  </span>
                </td>


                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${p.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">
              {isEditing ? 'Actualizar Perfil' : 'Nuevo Perfil'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500">Código</label>
                <input 
                  type="text" 
                  className="w-full border rounded-md p-2 mt-1" 
                  required
                  value={currentPerfil.codigo}
                  onChange={(e) => setCurrentPerfil({...currentPerfil, codigo: e.target.value})}
                  placeholder="Ej: CONT"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500">Nombre del Perfil</label>
                <input 
                  type="text" 
                  className="w-full border rounded-md p-2 mt-1" 
                  required
                  value={currentPerfil.perfil}
                  onChange={(e) => setCurrentPerfil({...currentPerfil, perfil: e.target.value})}
                  placeholder="Ej: Contabilidad"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500">Descripción</label>
                <textarea 
                  className="w-full border rounded-md p-2 mt-1" 
                  value={currentPerfil.descripcion}
                  onChange={(e) => setCurrentPerfil({...currentPerfil, descripcion: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500">Estado</label>
                <select 
                  className="w-full border rounded-md p-2 mt-1"
                  value={currentPerfil.estado}
                  onChange={(e) => setCurrentPerfil({...currentPerfil, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

{/* Contenedor con Scroll para el árbol de menús */}
              <div className="flex-grow overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {catMenuTree.map(padre => {
                  const padreMarcado = (currentPerfil.menus || []).some(m => m.id === padre.id);
                  
      return (
        <div 
          key={padre.id} 
          onClick={() => handleMenuToggle(padre)}
          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
            padreMarcado 
              ? 'bg-white border-indigo-200 shadow-sm text-indigo-700' 
              : 'bg-transparent border-transparent hover:bg-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <Folder size={18} className={padreMarcado ? "text-indigo-500" : "text-slate-400"} />
            <span className={`text-xs font-bold tracking-wide ${padreMarcado ? 'text-indigo-600' : 'text-slate-600'}`}>
              {padre.descripcion}
            </span>
          </div>
          
          {padreMarcado ? (
            <CheckSquare size={18} className="text-indigo-600" />
          ) : (
            <Square size={18} className="text-slate-300" />
          )}
        </div>
      );
                })}
              </div>







            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold"
              >
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerfilList;