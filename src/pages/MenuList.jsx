import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as LucideIcons from 'lucide-react';
import * as menuService from '../api/menuService';

const MenuList = () => {
  const [menus, setMenus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [flatMenus, setFlatMenus] = useState([]); // Para el selector de padres

  // Catálogo de iconos sugeridos para el sistema
const iconOptions = [
  // --- Navegación y General ---
  { name: 'Inicio / Home', icon: 'Home' },
  { name: 'Menú Hamburguesa', icon: 'Menu' },
  { name: 'Panel de Control', icon: 'LayoutDashboard' },
  { name: 'Carpeta', icon: 'Folder' },
  { name: 'Buscador', icon: 'Search' },

  // --- Seguridad y Usuarios ---
  { name: 'Usuarios', icon: 'Users' },
  { name: 'Usuario Individual', icon: 'User' },
  { name: 'Seguridad / Candado', icon: 'Lock' },
  { name: 'Llave / Acceso', icon: 'Key' },
  { name: 'Escudo / Protección', icon: 'ShieldCheck' },
  { name: 'Huella Digital', icon: 'Fingerprint' },

  // --- Administración y Finanzas ---
  { name: 'Configuración', icon: 'Settings' },
  { name: 'Base de Datos', icon: 'Database' },
  { name: 'Calculadora', icon: 'Calculator' },
  { name: 'Bancos / Finanzas', icon: 'Landmark' },
  { name: 'Moneda / Pagos', icon: 'Coins' },
  { name: 'Carrito / Compras', icon: 'ShoppingCart' },

  // --- Documentos y Reportes ---
  { name: 'Reporte / Archivo', icon: 'FileText' },
  { name: 'Gráficos / Estadísticas', icon: 'BarChart3' },
  { name: 'Impresora', icon: 'Printer' },
  { name: 'Portapapeles', icon: 'ClipboardList' },
  { name: 'Calendario / Agenda', icon: 'Calendar' },

  // --- Comunicación y Otros ---
  { name: 'Campana / Notificaciones', icon: 'Bell' },
  { name: 'Correo / Email', icon: 'Mail' },
  { name: 'Herramientas', icon: 'Wrench' },
  { name: 'Mapa / Ubicación', icon: 'MapPin' },
  { name: 'Reloj / Historial', icon: 'Clock' }
];
// Ordenar alfabéticamente antes de mapear
const sortedIcons = [...iconOptions].sort((a, b) => a.name.localeCompare(b.name));

  // Función auxiliar para renderizar el icono dinámicamente
  const IconRenderer = ({ iconName, size = 18, className = "" }) => {
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? <IconComponent size={size} className={className} /> : <LucideIcons.HelpCircle size={size} />;
  };

  const [currentMenu, setCurrentMenu] = useState({
    id: null,
    descripcion: '',
    url: '',
    icono: '',
    tipo: 'MENU',
    estado: 'ACTIVO',
    padreId: null,
    padre: null
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await menuService.getMenus();
      //api.get('/api/menu');
      // Esperamos el árbol jerárquico del backend
      setMenus(res.data);
      // Creamos una lista plana para poder elegir el "Padre" en el formulario
      flattenMenus(res.data);
    } catch (err) {
      toast.error("Error al cargar la estructura de menús");
    }
  };

const flattenMenus = (data) => {
  const flat = [];
  const seenIds = new Set(); // Para rastrear duplicados

  const recurse = (items) => {
    if (!items || !Array.isArray(items)) return;

    items.forEach(item => {
      // Solo agregamos si no lo hemos visto antes
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        flat.push({ 
          id: item.id, 
          descripcion: item.descripcion 
        });
      }
      
      // Si tiene hijos, bajamos un nivel
      if (item.hijos && item.hijos.length > 0) {
        recurse(item.hijos);
      }
    });
  };

  recurse(data);
  setFlatMenus(flat);
};

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentMenu,
      padre: currentMenu.padreId ? { id: currentMenu.padreId } : null
    };

    try {
      if (isEditing) await menuService.updateMenu(currentMenu.id, payload); 
      //api.put(`/api/menu/${currentMenu.id}`, payload);
      else await menuService.createMenu(payload);
      //api.post('/api/menu', payload);      
      toast.success("Menú actualizado");
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      toast.error("Error en la persistencia");
    }
  };
const handleDelete = async (id, descripcion) => {
  // 1. Confirmación de seguridad
  const confirmacion = window.confirm(
    `¿Estás seguro de eliminar el menú "${descripcion}"? \n\nNota: Si tiene submenús, la operación podría fallar por integridad referencial.`
  );

  if (!confirmacion) return;

  const loadId = toast.loading("Eliminando registro...");
  try {
    // 2. Llamada al endpoint DELETE
    await menuService.deleteMenu(id); 
    //api.delete(`/api/menu/${id}`);
    
    toast.success("Menú eliminado correctamente", { id: loadId });
    
    // 3. Refrescar el árbol para mostrar la estructura actualizada
    fetchMenus();
  } catch (err) {
    console.error("Error al eliminar:", err);
    
    // Manejo de error específico (Ej: Violación de FK)
    const errorMsg = err.response?.status === 409 
      ? "No se puede eliminar: Este menú tiene submenús asociados."
      : "Error al intentar eliminar el menú.";
      
    toast.error(errorMsg, { id: loadId });
  }
};
  const openModal = (menu = null) => {
    console.log("Abrir modal para menú:", menu);
    if (menu) {
      setIsEditing(true);
      setCurrentMenu({ ...menu, padreId: menu.padreId || '' });
    } else {
      setIsEditing(false);
      setCurrentMenu({ descripcion: '', url: '', icono: '', tipo: 'MENU', estado: 'ACTIVO', padreId: '' });
    }
    setIsModalOpen(true);
  };


  
  // --- RENDERIZADO RECURSIVO DEL ÁRBOL ---
const renderTree = (items) => {
    return (
      <ul className="ml-6 border-l border-gray-200">
        {items.map((item) => (
          <li key={item.id} className="mt-2">
            <div className="flex items-center p-2 hover:bg-slate-50 rounded-r-lg border-b border-transparent hover:border-blue-200 transition-all">
              {/* Renderizamos el icono que viene de la DB */}
              <div className="mr-3 text-indigo-600">
                <IconRenderer iconName={item.icono} />
              </div>
              <div className="flex-1">
                <span className="font-medium text-slate-700">{item.descripcion}</span>
                <span className="ml-3 text-xs font-mono text-gray-400">{item.url}</span>
              </div>
              <div className="space-x-2">
              <button 
                onClick={() => openModal(item)} 
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Editar"
              >
                <LucideIcons.Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(item.id, item.descripcion)} 
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Eliminar"
              >
                <LucideIcons.Trash2 size={16} />
              </button>
              </div>
            </div>
            {item.hijos && item.hijos.length > 0 && renderTree(item.hijos)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Estructura de Menús</h2>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">
          + Nuevo Ítem
        </button>
      </div>


      <div className="max-w-4xl mx-auto">
        {menus.length > 0 ? renderTree(menus) : <p className="text-center text-gray-400">No hay menús configurados</p>}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 p-4 text-white font-bold">
              {isEditing ? 'Editar Menú' : 'Crear Nuevo Menú'}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <input type="text" className="w-full border-b p-2 outline-none focus:border-indigo-500" required
                  value={currentMenu.descripcion} onChange={e => setCurrentMenu({...currentMenu, descripcion: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">URL</label>
                  <input type="text" className="w-full border-b p-2 outline-none focus:border-indigo-500"
                    value={currentMenu.url} onChange={e => setCurrentMenu({...currentMenu, url: e.target.value})} />
                </div>
              </div>
              <div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Seleccionar Icono</label>
                <div className="flex items-center mt-1 gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg text-indigo-600 border">
                    <IconRenderer iconName={currentMenu.icono} size={24} />
                  </div>
<select 
  className="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
  value={currentMenu.icono}
  onChange={e => setCurrentMenu({...currentMenu, icono: e.target.value})}
>
  <option value="">-- Sin Icono --</option>
  {sortedIcons.map(opt => (
    <option key={opt.icon} value={opt.icon}>
      {opt.name}
    </option>
  ))}
</select>
                </div>
              </div>                
                <label className="text-xs font-bold text-gray-500 uppercase">Menú Padre (Jerarquía) - {currentMenu.padreId}</label>
                
                <select className="w-full border-b p-2 bg-transparent"
                  value={currentMenu.padreId} onChange={e => setCurrentMenu({...currentMenu, padreId: e.target.value})}>
                  <option value="">-- Ninguno (Raíz) --</option>
                  {flatMenus.filter(m => m.id !== currentMenu.id).map(m => (
                    <option key={m.id} value={m.id}>{m.descripcion}</option>
                  ))}
                </select>

                
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 font-bold px-4">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MenuList;