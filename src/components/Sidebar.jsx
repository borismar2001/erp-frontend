import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMenuByUsuario } from '../api/menuService';
import * as Icons from 'lucide-react';

const Sidebar = ({ usuarioSesion }) => {
  const [menus, setMenus] = useState([]);
  const [openSubmenus, setOpenSubmenus] = useState({}); // Controla qué menús están desplegados
  const location = useLocation(); // Para saber qué ruta está activa y darle estilos

  useEffect(() => {
    const fetchMenus = async () => {
      if (usuarioSesion && usuarioSesion.id) {
        try {
          const res = await getMenuByUsuario(usuarioSesion.id);
          setMenus(res.data);
          
          // Opcional: Expandir automáticamente el menú del sub-item activo al cargar la página
          inicializarMenusAbiertos(res.data);
        } catch (err) {
          console.error("Error al cargar menús en Sidebar:", err);
        }
      }
    };
    fetchMenus();
  }, [usuarioSesion.id]);

  const inicializarMenusAbiertos = (listaMenus) => {
    const estadoInicial = {};
    listaMenus.forEach(item => {
      if (item.hijos && item.hijos.length > 0) {
        // Si la ruta actual coincide con la de algún hijo, dejamos el padre abierto
        const tieneHijoActivo = item.hijos.some(hijo => location.pathname === hijo.url);
        if (tieneHijoActivo) {
          estadoInicial[item.id] = true;
        }
      }
    });
    setOpenSubmenus(estadoInicial);
  };

  // Alternar el despliegue del submenú
  const toggleSubmenu = (id) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <nav className="w-64 bg-slate-900 h-screen text-white p-4 flex flex-col border-r border-slate-800 shadow-xl">
      {/* Encabezado del ERP */}
      <div className="mb-8 px-2 py-1 border-b border-slate-800 pb-4">
        <h1 className="font-black text-xl tracking-wider text-indigo-400 flex items-center gap-2">
          <Icons.Layers size={22} /> ERP SYSTEM
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          Panel de Control
        </p>
      </div>

      {/* Lista de Menús Dinámicos */}
      <ul className="space-y-1.5 flex-grow overflow-y-auto pr-1 select-none custom-scrollbar">
        {menus.map((item) => {
          // Intentar resolver el icono de Lucide dinámicamente, si no existe usa 'Circle'
          const IconComponent = Icons[item.icono] || Icons.Circle;
          const tieneHijos = item.hijos && item.hijos.length > 0;
          const estaAbierto = openSubmenus[item.id];
          const esRutaActiva = location.pathname === item.url;

          return (
            <li key={item.id} className="w-full">
              {tieneHijos ? (
                /* CASO 1: Es un Menú Padre con submenús (No navega, solo despliega) */
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-sm font-semibold group ${
                      estaAbierto 
                        ? 'bg-slate-800/60 text-white' 
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={18} className={estaAbierto ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} />
                      <span>{item.descripcion}</span>
                    </div>
                    {estaAbierto ? (
                      <Icons.ChevronDown size={16} className="text-indigo-400" />
                    ) : (
                      <Icons.ChevronRight size={16} className="text-slate-500" />
                    )}
                  </button>

                  {/* Renderizado de los Menús Hijos */}
                  {estaAbierto && (
                    <ul className="mt-1 ml-4 pl-3 border-l-2 border-slate-800 space-y-1 transition-all">
                      {item.hijos.map((hijo) => {
                        const HijoIcon = Icons[hijo.icono] || Icons.Dot;
                        const hijoActivo = location.pathname === hijo.url;

                        return (
                          <li key={hijo.id}>
                            <Link
                              to={hijo.url}
                              className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium transition-all ${
                                hijoActivo
                                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              }`}
                            >
                              <HijoIcon size={14} className={hijoActivo ? "text-white" : "text-slate-500"} />
                              <span>{hijo.descripcion}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                /* CASO 2: Es un Menú simple sin hijos (Navega directamente) */
                <Link
                  to={item.url}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all group ${
                    esRutaActiva
                      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/40'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <IconComponent size={18} className={esRutaActiva ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                  <span>{item.descripcion}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;