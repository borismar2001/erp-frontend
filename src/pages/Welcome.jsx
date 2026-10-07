import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const Welcome = () => {
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Ajusta 'sub' o 'alias' según los claims de tu JWT
        setUserName(decoded.sub || decoded.alias || 'Administrador');
      } catch (e) {
        console.error("Error al decodificar token");
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl border border-gray-100">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4">
          ¡Bienvenido al Sistema ERP, {userName}!
        </h1>
        
        <p className="text-gray-600 text-lg mb-8">
          Has ingresado correctamente al sistema de gestión. Desde aquí podrás administrar usuarios, 
          generar reportes y supervisar el procesamiento de datos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
            <h3 className="font-bold text-blue-700">Gestión de Usuarios</h3>
            <p className="text-sm text-gray-500">Administra cuentas y permisos</p>
          </div>
          <div className="p-4 border rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
            <h3 className="font-bold text-blue-700">Base de Datos</h3>
            <p className="text-sm text-gray-500">Estado de servicios y procesos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;