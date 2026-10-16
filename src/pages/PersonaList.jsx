import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as personaService from '../api/personaService';
import { getSucursales } from '../api/sucursalService';
import * as personaSucursalService from '../api/personaSucursalService';
import StatusBadge from '../components/common/StatusBadge';
import TipoDocumentoSelect from '../components/common/TipoDocumentoSelect';
import SucursalSelect from '../components/common/SucursalSelect';
import FormDatePicker from '../components/common/FormDatePicker';
import { 
  Users, Plus, Edit, Trash2, Power, 
  CheckCircle2, User, X, Building2, History
} from 'lucide-react';

const PersonaList = () => {
  const [personas, setPersonas] = useState([]);
  const [sucursalesActivasMap, setSucursalesActivasMap] = useState({});
  const [catSucursales, setCatSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSucursalModalOpen, setIsSucursalModalOpen] = useState(false);

  // Historial / Gestión de Sucursales por Persona
  const [historialSucursales, setHistorialSucursales] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  // Formulario Persona
  const [currentPersona, setCurrentPersona] = useState({
    id: null, nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: 'CI', numeroDocumento: '', estado: 'ACTIVO', txIdUsuario: 1
  });

  // Formulario Nueva Asignación
  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    idSucursal: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: ''
  });

  useEffect(() => { 
    const inicializar = async () => {
      setLoading(true);
      const sucursales = await fetchCatalogos();
      await fetchPersonas(sucursales);
      setLoading(false);
    };
    inicializar();
  }, []);

  const fetchCatalogos = async () => {
    try {
      const resSuc = await getSucursales().catch(() => ({ data: [] }));
      const listSuc = Array.isArray(resSuc.data) ? resSuc.data : (resSuc.data?.content || []);
      const filtradas = listSuc.filter(s => (s.estado || s.txEstado) === 'ACTIVO');
      setCatSucursales(filtradas);
      return filtradas;
    } catch (err) {
      console.error("Error al cargar sucursales", err);
      return [];
    }
  };

  const getNombreSucursal = (idSucursal, listaSucursales = catSucursales) => {
    if (!idSucursal) return 'Sin Sucursal';
    const sucursalEncontrada = listaSucursales.find(s => Number(s.id) === Number(idSucursal));
    return sucursalEncontrada ? sucursalEncontrada.nombre : `Sucursal #${idSucursal}`;
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Vigente';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
    return fechaStr;
  };

  const fetchPersonas = async (sucursalesList = catSucursales) => {
    try {
      const res = await personaService.getPersonas();
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setPersonas(list);
      await fetchSucursalesActivas(list, sucursalesList);
    } catch (err) { 
      toast.error("Error al cargar personas"); 
    }
  };

  const fetchSucursalesActivas = async (listaPersonas, sucursalesList) => {
    const mapa = {};
    await Promise.all(
      listaPersonas.map(async (p) => {
        try {
          const res = await personaSucursalService.getSucursalActivaPorPersona(p.id);
          if (res && res.data && res.data.idSucursal) {
            mapa[p.id] = getNombreSucursal(res.data.idSucursal, sucursalesList);
          } else {
            mapa[p.id] = 'Sin Sucursal';
          }
        } catch (err) {
          mapa[p.id] = 'Sin Sucursal';
        }
      })
    );
    setSucursalesActivasMap(mapa);
  };

  const handleToggleEstado = async (personaId, accion) => {    
    const loadId = toast.loading(`Cambiando a ${accion}...`);
    try {
      if (accion === 'INACTIVAR') {
        await personaService.inactivarPersona(personaId, 1);
        toast.success("Persona inactivada con éxito", { id: loadId });
      } else if (accion === 'ACTIVAR') {
        await personaService.activarPersona(personaId, 1);
        toast.success("Persona activada con éxito", { id: loadId });
      } else if (accion === 'ELIMINAR') {
        await personaService.eliminarPersona(personaId, 1);
        toast.success("Persona eliminada con éxito", { id: loadId });
      }
      fetchPersonas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cambiar estado", { id: loadId });
    }
  };

  const handleSavePersona = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Guardando persona...");
    try {
      if (isEditing) {
        await personaService.updatePersona(currentPersona.id, currentPersona);
        toast.success("Persona actualizada", { id: loadId });
      } else {
        await personaService.createPersona(currentPersona); 
        toast.success("Persona registrada", { id: loadId });
      }
      setIsModalOpen(false);
      fetchPersonas();
    } catch (err) { 
      toast.error(err.response?.data?.message || "Error al guardar", { id: loadId }); 
    }
  };

  const handleSaveAsignacion = async (e) => {
    e.preventDefault();
    if (!nuevaAsignacion.idSucursal) {
      toast.error("Seleccione una sucursal");
      return;
    }

    const loadId = toast.loading("Asignando sucursal...");
    try {
      const payload = {
        fechaInicio: nuevaAsignacion.fechaInicio,
        fechaFin: nuevaAsignacion.fechaFin || null,
        idPersona: Number(personaSeleccionada.id),
        idSucursal: Number(nuevaAsignacion.idSucursal),
        txEstado: 'ACTIVO',
        txIdUsuario: 1
      };

      await personaSucursalService.asignarPersonaSucursal(payload, 1);
      toast.success("Sucursal asignada con éxito", { id: loadId });
      
      cargarHistorialPersona(personaSeleccionada.id);
      fetchPersonas();
      
      setNuevaAsignacion({
        idSucursal: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al asignar la sucursal", { id: loadId });
    }
  };

  const handleAccionPersonaSucursal = async (asignacionId, accion) => {
    const loadId = toast.loading(`Procesando acción (${accion})...`);
    try {
      if (accion === 'ELIMINAR') {
        await personaSucursalService.eliminarPersonaSucursal(asignacionId, 1);
        toast.success("Asignación eliminada", { id: loadId });
      } else if (accion === 'INACTIVAR') {
        await personaSucursalService.inactivarPersonaSucursal(asignacionId, 1);
        toast.success("Asignación inactivada", { id: loadId });
      } else if (accion === 'ACTIVAR') {
        await personaSucursalService.activarPersonaSucursal(asignacionId, 1);
        toast.success("Asignación activada", { id: loadId });
      }
      cargarHistorialPersona(personaSeleccionada.id);
      fetchPersonas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al procesar la acción", { id: loadId });
    }
  };

  const openModal = (persona = null) => {
    if (persona) {
      setIsEditing(true);
      setCurrentPersona({ ...persona, nombres: persona.nombres || '', primerApellido: persona.primerApellido || '', segundoApellido: persona.segundoApellido || '', numeroDocumento: persona.numeroDocumento || '' });
    } else {
      setIsEditing(false);
      setCurrentPersona({ id: null, nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: 'CI', numeroDocumento: '', estado: 'ACTIVO', txIdUsuario: 1 });
    }
    setIsModalOpen(true);
  };

  const cargarHistorialPersona = async (idPersona) => {
    setLoadingHistorial(true);
    try {
      const res = await personaSucursalService.getSucursalesPorPersona(idPersona);
      setHistorialSucursales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistorialSucursales([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const openSucursalModal = (persona) => {
    setPersonaSeleccionada(persona);
    cargarHistorialPersona(persona.id);
    setIsSucursalModalOpen(true);
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Users className="text-indigo-600" size={28} /> Gestión de Personas
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Administración de personal, estados y asignaciones de sucursales corporativas.
          </p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-md shadow-indigo-100 active:scale-95"
        >
          <Plus size={16} /> Nueva Persona
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Nombre Completo</th>
                <th className="px-6 py-4 text-left">Documento</th>
                <th className="px-6 py-4 text-left">Sucursal Activa</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <div className="flex justify-center items-center gap-2 font-bold">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : personas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No se encontraron registros de personas.
                  </td>
                </tr>
              ) : (
                personas.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-indigo-600">
                      #{p.id}
                    </td>                
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          {p.nombres ? p.nombres.charAt(0) : 'U'}
                        </div>
                        {p.nombreCompleto || `${p.nombres || ''} ${p.primerApellido || ''} ${p.segundoApellido || ''}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                        {p.tipoDocumento}: {p.numeroDocumento || 'S/N'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100 font-bold">
                        <Building2 size={13} /> {sucursalesActivasMap[p.id] || 'Sin Sucursal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge estado={p.txEstado} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                      {p.txEstado === 'ACTIVO' && (
                        <>
                          <button 
                            onClick={() => openSucursalModal(p)} 
                            title="Gestionar Sucursales" 
                            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          >
                            <Building2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleEstado(p.id, 'INACTIVAR')} 
                            title="Inactivar Persona" 
                            className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                          >
                            <Power size={16} />
                          </button>
                        </>
                      )}

                      {p.txEstado === 'ELABORADO' && (
                        <>
                          <button 
                            onClick={() => handleToggleEstado(p.id, 'ACTIVAR')} 
                            title="Activar Persona" 
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => openModal(p)} 
                            title="Modificar Persona" 
                            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm("¿Está seguro de eliminar este registro?")) {
                                handleToggleEstado(p.id, 'ELIMINAR');
                              }
                            }} 
                            title="Eliminar Persona" 
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GESTIÓN DE SUCURSALES */}
      {isSucursalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Building2 size={20} className="text-indigo-600" /> Control de Sucursales por Persona
                </h3>
                <p className="text-xs text-indigo-600 font-bold mt-0.5">
                  Persona: {personaSeleccionada?.nombreCompleto || `${personaSeleccionada?.nombres} ${personaSeleccionada?.primerApellido}`}
                </p>
              </div>
              <button 
                onClick={() => setIsSucursalModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs overflow-y-auto flex-grow">
              <form onSubmit={handleSaveAsignacion} className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-black text-slate-700 flex items-center gap-2 uppercase text-[11px] tracking-wider">
                  <Plus size={15} className="text-indigo-600" /> Nueva Asignación de Sucursal
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <SucursalSelect 
                      required
                      sucursales={catSucursales}
                      value={nuevaAsignacion.idSucursal} 
                      onChange={e => setNuevaAsignacion({...nuevaAsignacion, idSucursal: e.target.value})} 
                    />
                  </div>

                  <div>
                    <FormDatePicker 
                      label="Fecha Inicio"
                      required
                      value={nuevaAsignacion.fechaInicio} 
                      onChange={e => setNuevaAsignacion({...nuevaAsignacion, fechaInicio: e.target.value})} 
                    />
                  </div>

                  <div>
                    <FormDatePicker 
                      label="Fecha Fin"
                      value={nuevaAsignacion.fechaFin} 
                      onChange={e => setNuevaAsignacion({...nuevaAsignacion, fechaFin: e.target.value})} 
                    />
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95"
                    >
                      Asignar Sucursal
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="font-black text-slate-700 flex items-center gap-2 uppercase text-[11px] tracking-wider">
                  <History size={15} className="text-indigo-600" /> Historial de Asignaciones
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3 text-left">Sucursal</th>
                        <th className="p-3 text-left">Vigencia</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
                      {loadingHistorial ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400">Cargando historial...</td></tr>
                      ) : historialSucursales.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400">No hay sucursales asignadas a esta persona.</td></tr>
                      ) : (
                        historialSucursales.map((ps) => (
                          <tr key={ps.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-slate-800">
                              {getNombreSucursal(ps.idSucursal)}
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {formatearFecha(ps.fechaInicio)} al {ps.fechaFin ? formatearFecha(ps.fechaFin) : 'Vigente'}
                            </td>
                            <td className="p-3 text-center">
                              <StatusBadge estado={ps.txEstado} />
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {ps.txEstado === 'ACTIVO' ? (
                                <button 
                                  onClick={() => handleAccionPersonaSucursal(ps.id, 'INACTIVAR')} 
                                  title="Inactivar Asignación"
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-100"
                                >
                                  <Power size={15} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleAccionPersonaSucursal(ps.id, 'ACTIVAR')} 
                                  title="Activar Asignación"
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                              )}

                              <button 
                                onClick={() => {
                                  if (window.confirm("¿Desea eliminar permanentemente esta asignación?")) {
                                    handleAccionPersonaSucursal(ps.id, 'ELIMINAR');
                                  }
                                }} 
                                title="Eliminar Asignación"
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsSucursalModalOpen(false)} 
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 shadow-sm transition-all"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PERSONA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" /> {isEditing ? 'Modificar Persona' : 'Registrar Persona'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePersona} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nombres *</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-xl p-3 font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    value={currentPersona.nombres} onChange={e => setCurrentPersona({...currentPersona, nombres: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Primer Apellido *</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-xl p-3 font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    value={currentPersona.primerApellido} onChange={e => setCurrentPersona({...currentPersona, primerApellido: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Segundo Apellido</label>
                  <input type="text" className="w-full border border-slate-200 rounded-xl p-3 font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    value={currentPersona.segundoApellido} onChange={e => setCurrentPersona({...currentPersona, segundoApellido: e.target.value})} />
                </div>
                <div>
                  <TipoDocumentoSelect 
                    required
                    value={currentPersona.tipoDocumento} 
                    onChange={e => setCurrentPersona({...currentPersona, tipoDocumento: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nro. Documento</label>
                  <input type="text" className="w-full border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                    value={currentPersona.numeroDocumento} onChange={e => setCurrentPersona({...currentPersona, numeroDocumento: e.target.value})} />
                </div>
              </div>

              <div className="mt-6 pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaList;