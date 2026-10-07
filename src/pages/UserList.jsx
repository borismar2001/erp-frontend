import React, { useState, useEffect } from 'react';
import * as usuarioService from '../api/usuarioService';
import { getRoles } from '../api/rolService';
import { getPersonas } from '../api/personaService'; // 1. Asegúrate de tener este servicio
import toast from 'react-hot-toast';
import { Users, Plus, Edit, Trash2, Shield, UserPlus, Eye, EyeOff, UserCheck } from 'lucide-react';

const UserList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [catRoles, setCatRoles] = useState([]);
  const [catPersonas, setCatPersonas] = useState([]); // Catálogo de personas del sistema
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estructura exacta solicitada por tu JSON
  const [currentUser, setCurrentUser] = useState({
    id: null,
    alias: '',
    estado: 'ACTIVO',
    correoElectronico: '',
    password: '',
    persona: {
      id: null,
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      nombreCompleto: '',
      estado: 'ACTIVO'
    },
    roles: []
  });

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
    fetchPersonas();
  }, []);

  const fetchUsuarios = async () => {
    try { const res = await usuarioService.getUsuarios(); setUsuarios(res.data); } 
    catch (err) { toast.error("Error al cargar la lista de usuarios"); }
  };

  const fetchRoles = async () => {
    try { const res = await getRoles(); setCatRoles(res.data); } catch (err) {}
  };

  const fetchPersonas = async () => {
    try { 
      const res = await getPersonas(); 
      setCatPersonas(res.data); 
    } catch (err) { 
      console.error("Error al cargar catálogo de personas:", err); 
    }
  };

// Función para normalizar texto (Quita acentos y caracteres especiales)
const limpiarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .trim()
    .normalize("NFD") // Separa los acentos de las letras (ej: "ó" se convierte en "o" + "´")
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos aislados
    .toLowerCase()
    .replace(/ñ/g, 'n') // Reemplaza la eñe por n
    .replace(/[^a-z0-9]/g, ''); // Elimina absolutamente todo lo que no sea una letra o número
};

const generarAlias = (nombres, apellido) => {
  if (!nombres || !apellido) return '';
  
  // Extraemos estrictamente el primer nombre
  const primerNombreRaw = nombres.trim().split(' ')[0];
  
  // Limpiamos de forma rigurosa ambas cadenas
  const primerNombreLimpio = limpiarTexto(primerNombreRaw);
  const apellidoLimpio = limpiarTexto(apellido);

  if (!primerNombreLimpio || !apellidoLimpio) return '';

  // Retorna el patrón exacto: nombre.apellido completamente limpio
  return `${primerNombreLimpio}.${apellidoLimpio}`;
};

  // 2. NUEVO CAPTURADOR: Al seleccionar una persona de la lista
  const handlePersonaSelect = (personaId) => {
    const idNum = Number(personaId);
    
    // Buscamos el objeto completo de la persona en nuestro catálogo local
    const personaSeleccionada = catPersonas.find(p => p.id === idNum);

    if (personaSeleccionada) {
      // Calculamos el alias inmediatamente con los datos reales de esa persona
      const nuevoAlias = generarAlias(personaSeleccionada.nombres, personaSeleccionada.primerApellido);
      
      setCurrentUser({
        ...currentUser,
        alias: nuevoAlias,
        persona: personaSeleccionada // Inyectamos el objeto persona completo al payload JSON
      });
    } else {
      // Si se deselecciona o se escoge la opción vacía, limpiamos la sección
      setCurrentUser({
        ...currentUser,
        alias: '',
        persona: { id: 0, nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: '', numeroDocumento: '', nombreCompleto: '', estado: 'ACTIVO' }
      });
    }
  };

  // Alternar selección de Roles (Múltiple Checkbox)
  const handleRoleToggle = (rolObj) => {
    const rolesActuales = currentUser.roles || [];
    const existe = rolesActuales.some(r => r.id === rolObj.id);
    const nuevosRoles = existe ? rolesActuales.filter(r => r.id !== rolObj.id) : [...rolesActuales, rolObj];
    setCurrentUser({ ...currentUser, roles: nuevosRoles });
  };

const handleSave = async (e) => {
  e.preventDefault();

  // 1. Validación de Persona
  if (!currentUser.persona.id) {
    toast.error("Debe asociar una persona obligatoriamente");
    return;
  }

  // 2. VALIDACIÓN RIGUROSA DE CORREO ELECTRÓNICO
  // Regex estándar para validación de emails
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(currentUser.correoElectronico)) {
    toast.error("El formato del correo electrónico no es válido (Ej: usuario@empresa.com)");
    return;
  }

  // 3. Validación de Roles
  if (currentUser.roles.length === 0) {
    toast.error("Debe asignar al menos un rol al usuario");
    return;
  }

  // Si pasa todas las validaciones del Frontend, procede con el envío
  const loadId = toast.loading("Guardando registro...");
  try {
    if (isEditing) { 
      await usuarioService.updateUsuario(currentUser.id, currentUser);
      //userService.updateUser(currentUser.id, currentUser);
      toast.success("Usuario actualizado correctamente", { id: loadId });
    } else {
      await usuarioService.createUsuario(currentUser); 
      //userService.createUser(currentUser);
      toast.success("Usuario registrado con éxito", { id: loadId });
    }
    setIsModalOpen(false);
    fetchUsuarios();
  } catch (err) {
    toast.error(err.response?.data?.message || "Error en el servidor", { id: loadId });
  }
};

  const openModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser({ ...user, password: '' });
    } else {
      setIsEditing(false);
      setCurrentUser({
        id: 0, alias: '', estado: 'ACTIVO', correoElectronico: '', password: '',
        persona: { id: 0, nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: '', numeroDocumento: '', nombreCompleto: '', estado: 'ACTIVO' },
        roles: []
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> Control de Acceso y Usuarios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Asociación de credenciales a perfiles de personas pre-registradas.</p>
        </div>
        <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100">
          <UserPlus size={16} /> Registrar Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Funcionario (Persona)</th>
              <th className="px-6 py-4 text-left">Alias de Red</th>
              <th className="px-6 py-4 text-left">Correo Electrónico</th>
              <th className="px-6 py-4 text-left">Roles Asignados</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{u.persona?.nombreCompleto || 'SIN NOMBRE'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{u.persona?.tipoDocumento}: {u.persona?.numeroDocumento}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                    {u.alias}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{u.correoElectronico}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {u.roles?.map(r => (
                      <span key={r.id} className="text-[10px] font-extrabold bg-slate-100 text-slate-600 border px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Shield size={10} className="text-slate-400" /> {r.rol}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${u.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(u)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Edit size={16} /></button>
                  <button className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? 'Actualizar Cuenta de Usuario' : 'Apertura de Cuenta Institucional'}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* SECCIÓN IZQUIERDA Y CENTRAL */}
              <div className="md:col-span-2 space-y-5">
                
                {/* 3. SELECT PARA ASOCIAR PERSONA */}
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b pb-1 mb-3">1. Selección de Funcionario (Persona)</h4>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Buscar Persona en el Sistema</label>
                  <select 
                    required
                    disabled={isEditing} // No permitimos cambiar la persona una vez creado el usuario (Regla de integridad)
                    className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-white disabled:opacity-60 font-medium"
                    value={currentUser.persona?.id || ''} 
                    onChange={e => handlePersonaSelect(e.target.value)}
                  >
                    <option value="">-- Seleccione una persona registrada --</option>
                    {catPersonas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombreCompleto} ({p.tipoDocumento}: {p.numeroDocumento})
                      </option>
                    ))}
                  </select>
                </div>

                {/* FICHA RESUMEN DE LA PERSONA SELECCIONADA */}
                {currentUser.persona?.id > 0 && (
                  <div className="bg-slate-50 border rounded-xl p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                      <UserCheck size={24} />
                    </div>
                    <div className="text-xs grid grid-cols-2 gap-x-8 gap-y-1.5 flex-grow">
                      <div><span className="text-slate-400 font-medium">Nombres:</span> <strong className="text-slate-700">{currentUser.persona.nombres}</strong></div>
                      <div><span className="text-slate-400 font-medium">Documento:</span> <strong className="text-slate-700">{currentUser.persona.tipoDocumento} - {currentUser.persona.numeroDocumento}</strong></div>
                      <div><span className="text-slate-400 font-medium">Apellidos:</span> <strong className="text-slate-700">{currentUser.persona.primerApellido} {currentUser.persona.segundoApellido}</strong></div>
                      <div><span className="text-slate-400 font-medium">Estado:</span> <strong className="text-green-600 font-bold">{currentUser.persona.estado}</strong></div>
                    </div>
                  </div>
                )}

                {/* PARÁMETROS DE LA CUENTA */}
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b pb-1 pt-2">2. Parámetros de la Cuenta</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Alias de Red (Auto-Generado)</label>
                    <input type="text" readOnly placeholder="Esperando selección..." className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold bg-slate-100 text-indigo-600 outline-none border-dashed"
                      value={currentUser.alias || ''} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Correo Electrónico</label>
                    <input type="email" required placeholder="correo@institucion.com" className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500"
                      value={currentUser.correoElectronico || ''} onChange={e => setCurrentUser({...currentUser, correoElectronico: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Contraseña</label>
                    <div className="relative mt-1">
                      <input type={showPassword ? "text" : "password"} placeholder={isEditing ? "•••••••• (Vacío para mantener)" : "Contraseña"} required={!isEditing} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 pr-10"
                        value={currentUser.password || ''} onChange={e => setCurrentUser({...currentUser, password: e.target.value})} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Estado de Cuenta</label>
                    <select className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent"
                      value={currentUser.estado} onChange={e => setCurrentUser({...currentUser, estado: e.target.value})}>
                      <option value="ACTIVO">ACTIVO (Permite el login)</option>
                      <option value="INACTIVO">INACTIVO (Acceso denegado)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ROLES (DERECHA) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-1.5 flex items-center gap-1.5 mb-3">
                  <Shield size={14} className="text-slate-400" /> 3. Roles de Sistema
                </h4>
                <div className="space-y-2 flex-grow overflow-y-auto max-h-[35vh] md:max-h-[none]">
                  {catRoles.map(rolItem => {
                    const estaMarcado = currentUser.roles.some(r => r.id === rolItem.id);
                    return (
                      <label key={rolItem.id} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                        estaMarcado ? 'bg-white border-indigo-200 text-indigo-800 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-200/60 text-slate-600'
                      }`}>
                        <input type="checkbox" className="mt-1 accent-indigo-600" checked={estaMarcado} onChange={() => handleRoleToggle(rolItem)} />
                        <div className="text-xs">
                          <div className="font-bold">{rolItem.rol}</div>
                          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{rolItem.descripcion}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all">
                Cerrar
              </button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100">
                {isEditing ? 'Modificar Ficha' : 'Habilitar Acceso'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default UserList;