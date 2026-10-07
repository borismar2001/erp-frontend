import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="mb-2 md:mb-0">
            <span className="font-semibold text-blue-600">ERP_SYSTEM</span> v1.0.2
          </div>
          
          <div className="text-center md:text-right">
            © {currentYear} Todos los derechos reservados. 
            <span className="hidden md:inline mx-2">|</span>
            <span className="text-slate-400">Desarrollado para Gestión de Base de Datos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;