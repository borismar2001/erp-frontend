import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { getUserByAlias } from '../api/menuService'; // Asegúrate de tener este import

const MainLayout = () => {
  // Estado central del usuario en sesión
  const [usuarioSesion, setUsuarioSesion] = useState({
    id: null,
    alias: 'Cargando...',
    persona: { nombres: '', primerApellido: '' },
    roles: []
  });

  // Estado opcional por si quieres mostrar un spinner de carga global inicial
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inicializarSesion = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No se encontró ningún token en el almacenamiento.");
        // Datos mock de contingencia por si no hay login previo
        setUsuarioSesion({
          id: 3,
          alias: 'boris.cuevas',
          email: 'boris@erp.com',
          persona: { nombres: 'Boris', primerApellido: 'Cuevas' },
          roles: [
            { id: 1, rol: 'ADMIN', descripcion: 'Administrador Global' }
          ]
        });
        setLoading(false);
        return;
      }

      let decodedUser = null;

      // 1. PASO: Decodificar el Token
      try {
        decodedUser = jwtDecode(token);
        //console.log("JWT decodificado en MainLayout:", decodedUser);
      } catch (error) {
        console.error("Error al decodificar el JWT:", error);
        setLoading(false);
        return;
      }

      // 2. PASO: Obtener el usuario completo desde el Backend
      try {
        // Obtenemos el alias desde la propiedad estándar 'sub' o tu claim 'alias'
        const alias = decodedUser.sub || decodedUser.alias;
        
        //console.log(`Buscando datos en API para el alias: ${alias}`);
        const res = await getUserByAlias(alias);
        
        // Seteamos el estado central con la respuesta real de la base de datos
        setUsuarioSesion(res.data);
        //console.log("Datos del usuario cargados exitosamente en MainLayout:", res.data);

      } catch (err) {
        console.error("Error en la petición getUserByAlias de MainLayout:", err);
        // Si falla el backend, puedes mantener una estructura mínima para que no rompa la UI
        setUsuarioSesion({
          id: 3,
          alias: decodedUser.sub || 'Usuario',
          persona: { nombres: 'Usuario', primerApellido: 'ERP' },
          roles: []
        });
      } finally {
        setLoading(false);
      }
    };

    inicializarSesion();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      
      {/* PASO 4: Pasamos el 'usuarioSesion' completo (o solo su ID) al Sidebar.
        El Sidebar detectará internamente cuando 'usuarioSesion.id' deje de ser null 
        para gatillar de manera automática la petición a /api/usuario/{id}/menus
      */}
      <Sidebar usuarioSesion={usuarioSesion} />

      {/* Columna Derecha */}
      <div className="flex flex-col flex-grow h-full overflow-y-auto">
        
        {/* PASO 5: Pasamos el usuario al Navbar para pintar el Alias y Roles */}
        <Navbar usuarioSesion={usuarioSesion} />
        
        {/* Cuerpo principal del ERP */}
        <main className="flex-grow max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-180px)]">
            {loading ? (
              <div className="flex justify-center items-center h-48 text-slate-500 font-medium">
                Cargando entorno de trabajo...
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;