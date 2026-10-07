import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, LogOut, ChevronDown } from 'lucide-react';
import { logout } from '../api/authService';
import { jwtDecode } from 'jwt-decode';

const Navbar = ({ usuarioSesion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  }, []);

  const handleLogout = () => {
      logout();
      toast.success('Sesión cerrada. ¡Vuelve pronto!');
      navigate('/login');
};

  return (
    <div className="relative inline-block text-left">
      {/* Botón con el Nombre del Usuario */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-lg transition-all"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
          {usuarioSesion.alias?.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-slate-700">{usuarioSesion.persona?.nombres}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border z-20 overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Perfil de Usuario</p>
              <h4 className="font-bold text-slate-800 text-lg">{usuarioSesion.persona?.nombres} {usuarioSesion.persona?.primerApellido}</h4>
              <p className="text-sm text-slate-500">{usuarioSesion.correoElectronico || 'Sin correo'}</p>
            </div>

            <div className="p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Roles y Atribuciones</p>
              <div className="flex flex-wrap gap-2">
                {usuarioSesion.roles?.map(role => (
                  <span key={role.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold border border-indigo-100">
                    <Shield size={12} />
                    {role.rol}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t p-2">
              <button className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold"
              onClick={handleLogout} >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;