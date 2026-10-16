import React, { useState, useEffect } from 'react';
import * as comprobanteService from '../api/comprobanteService';
import { getTiposCambio } from '../api/tipoCambioService';
import { getCentrosCosto } from '../api/centroCostoService';
import { getPartidasPpto } from '../api/partidaPptoService';
import { getCuentas } from '../api/cuentaService';
import { getAuxiliares } from '../api/auxiliarService';
import toast from 'react-hot-toast';
import { 
  FileText, Plus, Edit, Trash2, Calendar, 
  Layers, ChevronDown, ChevronUp, Calculator, Power, CheckCircle2, ArrowRight
} from 'lucide-react';

const ComprobanteList = () => {
  const [comprobantes, setComprobantes] = useState([]);
  
  // Catálogos
  const [catTiposCambio, setCatTiposCambio] = useState([]);
  const [catCentrosCosto, setCatCentrosCosto] = useState([]);
  const [catPartidas, setCatPartidas] = useState([]);
  const [catCuentas, setCatCuentas] = useState([]);
  const [catAuxiliares, setCatAuxiliares] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [paso, setPaso] = useState(1); // Paso 1: Cabecera | Paso 2: Detalles
  const [expandedId, setExpandedId] = useState(null);

  const getFechaActualISO = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const formatFechaDMY = (fechaStr) => {
    if (!fechaStr) return '';
    const limpia = String(fechaStr).split('T')[0];
    const partes = limpia.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fechaStr;
  };

  const normalizarFechaISO = (fechaStr) => {
    if (!fechaStr) return getFechaActualISO();
    return String(fechaStr).split('T')[0];
  };

  const nuevoDetalleModelo = {
    id: null,
    idComprobante: null,
    idCentroCosto: null,
    idPartidaPpto: null,
    idCuentaContable: null,
    idAuxiliar: null,
    
    datosFactura: '',
    importe: 0,
    glosa: '',
    txEstado: 'ACTIVO',
    txIdUsuario: 1,
    fecha: getFechaActualISO(),
    debeHaber: 'DEB',
    montoDebe: 0.00,
    montoHaber: 0.00    
  };

  const [currentComp, setCurrentComp] = useState({
    id: null,
    idEjercicio: 1,
    
    idTipoCambio: null,
    correlativo: 0,
    tipoComprobante: 'ING',
    esFactura: 'N',
    esPresupuesto: 'N',
    fecha: getFechaActualISO(),
    esActivo: 'S',
    esOriginal: 'S',
    esAlmacenable: 'S',
    glosa: '',
    periodoCosto: 'ENE',
    txEstado: 'ELABORADO',
    txIdUsuario: 1,
    detalles: []
  });

  useEffect(() => {
    fetchComprobantes();
    fetchCatalogos();
  }, []);

  const fetchComprobantes = async () => {
    try {
      const res = await comprobanteService.getComprobantes();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setComprobantes(dataArr);
    } catch (err) {
      toast.error("Error al cargar los comprobantes");
    }
  };

  const fetchCatalogos = async () => {
    try {
      const [resTC, resCC, resPart, resCuentas, resAux] = await Promise.all([
        getTiposCambio().catch(() => ({ data: [] })),
        getCentrosCosto().catch(() => ({ data: [] })),
        getPartidasPpto().catch(() => ({ data: [] })),
        getCuentas().catch(() => ({ data: [] })),
        getAuxiliares().catch(() => ({ data: [] }))
      ]);

      setCatTiposCambio(Array.isArray(resTC.data) ? resTC.data.filter(tc => tc.txEstado === 'ACTIVO' || tc.estado === 'ACTIVO') : []);
      setCatCentrosCosto(Array.isArray(resCC.data) ? resCC.data.filter(cc => cc.txEstado === 'ACTIVO' || cc.estado === 'ACTIVO') : []);
      setCatPartidas(Array.isArray(resPart.data) ? resPart.data.filter(p => p.txEstado === 'ACTIVO' || p.estado === 'ACTIVO') : []);
      setCatCuentas(Array.isArray(resCuentas.data) ? resCuentas.data.filter(c => c.txEstado === 'ACTIVO' || c.estado === 'ACTIVO') : []);
      setCatAuxiliares(Array.isArray(resAux.data) ? resAux.data.filter(a => a.txEstado === 'ACTIVO' || a.estado === 'ACTIVO') : []);
    } catch (err) {
      console.error("Error cargando catálogos", err);
    }
  };

  const getNombreCuenta = (idCuenta) => {
    if (!idCuenta) return 'Sin Cuenta Asignada';
    const cuenta = catCuentas.find(c => c.id === Number(idCuenta));
    return cuenta ? `${cuenta.codigo || ''} - ${cuenta.nombre || ''}` : `Cuenta #${idCuenta}`;
  };

  const handleToggleEstado = async (comp) => {
    const nuevoEstado = comp.txEstado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const loadId = toast.loading(`Cambiando estado a ${nuevoEstado}...`);
    try {
      const payload = { ...comp, txEstado: nuevoEstado };
      await comprobanteService.updateComprobante(comp.id, payload);
      toast.success(`Comprobante #${comp.correlativo || comp.id} ${nuevoEstado.toLowerCase()}`, { id: loadId });
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cambiar estado", { id: loadId });
    }
  };

  const openModal = (compObj = null) => {
    if (compObj) {
      if (compObj.txEstado !== 'ELABORADO') {
        toast.error(`Solo se pueden modificar comprobantes en estado ELABORADO.`);
        return;
      }
      setIsEditing(true);
      setPaso(2); // Al editar va directo a ver/modificar detalles
      setCurrentComp({
        ...compObj,
        fecha: normalizarFechaISO(compObj.fecha),
        detalles: (compObj.detalles || []).map(d => ({
          ...d,
          fecha: normalizarFechaISO(d.fecha || compObj.fecha)
        }))
      });
    } else {
      const fechaHoy = getFechaActualISO();
      setIsEditing(false);
      setPaso(1); // Al crear inicia obligatoriamente en Paso 1 (Cabecera)
      setCurrentComp({
        id: 0,
        idEjercicio: 1,
        
        idTipoCambio: catTiposCambio[0]?.id || null,
        correlativo: null,
        tipoComprobante: 'ING',
        esFactura: 'N',
        esPresupuesto: 'N',
        fecha: fechaHoy,
        esActivo: 'S',
        esOriginal: 'S',
        esAlmacenable: 'S',
        glosa: '',
        periodoCosto: 'ENE',
        txIdUsuario: 1,
        txEstado: 'ELABORADO',
        detalles: []
      });
    }
    setIsModalOpen(true);
  };

  // PASO 1: Guardar unicamente la Cabecera
  const handleSaveCabecera = async (e) => {
    e.preventDefault();

    if (!currentComp.idTipoCambio) {
      toast.error("Debe seleccionar un tipo de cambio");
      return;
    }

    const loadId = toast.loading("Guardando cabecera del comprobante...");
    try {
      const payload = {
        ...currentComp,
        id: isEditing ? Number(currentComp.id) : null,
        idEjercicio: Number(currentComp.idEjercicio) || 1,
        txIdUsuario: Number(currentComp.txidUsuario) || 1,
        idTipoCambio: Number(currentComp.idTipoCambio),
        correlativo: Number(currentComp.correlativo) || null,
        fecha: normalizarFechaISO(currentComp.fecha),
        detalles: []
      };

      let res;
      if (isEditing) {
        res = await comprobanteService.updateComprobante(payload.id, payload);
        toast.success("Cabecera actualizada", { id: loadId });
      } else {
        res = await comprobanteService.createComprobante(payload);
        toast.success("Comprobante creado. Ahora agregue el detalle contable.", { id: loadId });
      }

      const compCreado = res.data || payload;
      setCurrentComp({
        ...compCreado,
        fecha: normalizarFechaISO(compCreado.fecha),
        detalles: compCreado.detalles && compCreado.detalles.length > 0 ? compCreado.detalles : [{ ...nuevoDetalleModelo, fecha: normalizarFechaISO(compCreado.fecha) }]
      });
      
      setPaso(2); // Avanzar al Paso 2 (Detalle)
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar la cabecera", { id: loadId });
    }
  };

  // OPERACIONES DE DETALLE (PASO 2)
  const handleAddDetalle = () => {
    setCurrentComp({
      ...currentComp,
      detalles: [
        ...currentComp.detalles,
        { ...nuevoDetalleModelo, idComprobante: currentComp.id, fecha: currentComp.fecha, glosa: currentComp.glosa }
      ]
    });
  };

  const handleRemoveDetalle = (index) => {
    const nuevosDetalles = [...currentComp.detalles];
    nuevosDetalles.splice(index, 1);
    setCurrentComp({ ...currentComp, detalles: nuevosDetalles });
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...currentComp.detalles];
    const item = { ...nuevosDetalles[index], [field]: value };

    if (field === 'debeHaber') {
      if (value === 'DEB') {
        item.montoDebe = item.montoHaber || item.importe || 0;
        item.montoHaber = 0;
        item.importe = item.montoDebe;
      } else if (value === 'HAB') {
        item.montoHaber = item.montoDebe || item.importe || 0;
        item.montoDebe = 0;
        item.importe = item.montoHaber;
      }
    }

    if (field === 'montoDebe') {
      const val = parseFloat(value) || 0;
      item.montoDebe = val;
      item.importe = val;
      item.montoHaber = 0;
    }

    if (field === 'montoHaber') {
      const val = parseFloat(value) || 0;
      item.montoHaber = val;
      item.importe = val;
      item.montoDebe = 0;
    }

    nuevosDetalles[index] = item;
    setCurrentComp({ ...currentComp, detalles: nuevosDetalles });
  };

  const totalDebe = currentComp.detalles.reduce((sum, d) => sum + (Number(d.montoDebe) || 0), 0);
  const totalHaber = currentComp.detalles.reduce((sum, d) => sum + (Number(d.montoHaber) || 0), 0);
  const diferenciaCuadre = totalDebe - totalHaber;

  // PASO 2: Guardar los detalles asignados
  const handleSaveDetalles = async (e) => {
    e.preventDefault();

    if (currentComp.detalles.length === 0) {
      toast.error("Debe agregar al menos una línea de detalle contable");
      return;
    }

    if (diferenciaCuadre !== 0) {
      toast.error("El asiento contable está descuadrado (Debe y Haber deben ser iguales)");
      return;
    }

    const loadId = toast.loading("Guardando detalles del comprobante...");
    try {
      const payload = {
        ...currentComp,
        detalles: currentComp.detalles.map(det => ({
          ...det,
          id: Number(det.id) || null,
          idComprobante: Number(currentComp.id),
          idCentroCosto: det.idCentroCosto ? Number(det.idCentroCosto) : null,
          idPartidaPpto: det.idPartidaPpto ? Number(det.idPartidaPpto) : null,
          idCuentaContable: det.idCuentaContable ? Number(det.idCuentaContable) : null,
          idAuxiliar: det.idAuxiliar ? Number(det.idAuxiliar) : null,
          importe: parseFloat(det.importe) || 0,
          fecha: normalizarFechaISO(det.fecha || currentComp.fecha)
        }))
      };

      await comprobanteService.updateComprobante(currentComp.id, payload);
      toast.success("Detalle registrado y comprobante completado con éxito", { id: loadId });
      setIsModalOpen(false);
      fetchComprobantes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar el detalle", { id: loadId });
    }
  };

  return (
    <div className="p-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Comprobantes y Asientos Contables
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de libro diario con creación secuencial (Maestro / Detalle).</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Crear Comprobante
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-4"></th>
              <th className="px-4 py-4 text-left">Correlativo</th>
              <th className="px-4 py-4 text-left">Fecha / Periodo</th>
              <th className="px-4 py-4 text-left">Tipo</th>
              <th className="px-4 py-4 text-left">Glosa</th>
              <th className="px-4 py-4 text-center">Detalles</th>
              <th className="px-4 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {comprobantes.map(comp => {
              const isExpanded = expandedId === comp.id;
              const sumDebe = (comp.detalles || []).reduce((s, d) => s + (Number(d.montoDebe) || (d.debeHaber === 'DEB' ? Number(d.importe) : 0)), 0);
              const sumHaber = (comp.detalles || []).reduce((s, d) => s + (Number(d.montoHaber) || (d.debeHaber === 'HAB' ? Number(d.importe) : 0)), 0);

              return (
                <React.Fragment key={comp.id}>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : comp.id)} 
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-indigo-600 text-xs">
                      #{String(comp.correlativo || comp.id).padStart(6, '0')}
                    </td>
                    <td className="px-4 py-4 font-semibold text-xs text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-semibold inline-flex items-center gap-1 text-slate-700">
                          <Calendar size={12} /> {formatFechaDMY(comp.fecha)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">PERIODO: {comp.periodoCosto}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-black border tracking-wide ${
                        comp.tipoComprobante === 'ING' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        comp.tipoComprobante === 'EGR' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {comp.tipoComprobante}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-xs truncate text-xs text-slate-500" title={comp.glosa}>{comp.glosa}</td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-xs">{comp.detalles?.length || 0}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                        comp.txEstado === 'ELABORADO' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {comp.txEstado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      {comp.txEstado === 'ACTIVO' ? (
                        <button 
                          onClick={() => handleToggleEstado(comp)}
                          title="Inactivar Comprobante"
                          className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Power size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleEstado(comp)}
                          title="Activar Comprobante"
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}

                      {comp.txEstado === 'ELABORADO' && (
                        <>
                          <button 
                            onClick={() => openModal(comp)} 
                            title="Modificar Comprobante / Detalles"
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>

                          <button 
                            title="Eliminar Comprobante"
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {/* Subtabla de Detalles Expandible */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80">
                      <td colSpan="8" className="px-8 py-4">
                        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-inner">
                          <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                            <Layers size={14} className="text-indigo-600" /> Desglose del Asiento Contable
                          </h4>
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase border-b">
                              <tr>
                                <th className="p-2">#</th>
                                <th className="p-2">Cuenta Contable</th>
                                <th className="p-2">Glosa Detalle</th>
                                <th className="p-2 text-right">Debe (Bs)</th>
                                <th className="p-2 text-right">Haber (Bs)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(comp.detalles || []).map((det, idx) => {
                                const montoDebe = Number(det.montoDebe) || (det.debeHaber === 'DEB' ? Number(det.importe) : 0);
                                const montoHaber = Number(det.montoHaber) || (det.debeHaber === 'HAB' ? Number(det.importe) : 0);

                                return (
                                  <tr key={det.id || idx}>
                                    <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                                    <td className="p-2 font-semibold text-slate-800">{getNombreCuenta(det.idCuentaContable)}</td>
                                    <td className="p-2 text-slate-500">{det.glosa || comp.glosa}</td>
                                    <td className="p-2 text-right font-mono font-bold text-emerald-600">
                                      {montoDebe > 0 ? `Bs ${montoDebe.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-blue-600">
                                      {montoHaber > 0 ? `Bs ${montoHaber.toFixed(2)}` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t">
                              <tr>
                                <td colSpan="3" className="p-2 text-right text-slate-600">TOTALES:</td>
                                <td className="p-2 text-right font-mono text-emerald-700">Bs {sumDebe.toFixed(2)}</td>
                                <td className="p-2 text-right font-mono text-blue-700">Bs {sumHaber.toFixed(2)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario de Dos Pasos */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header con indicador de pasos */}
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  {isEditing ? `Editar Comprobante #${currentComp.correlativo || currentComp.id}` : 'Nuevo Comprobante Contable'}
                </h3>
                <span className="text-xs text-indigo-600 font-bold">
                  {paso === 1 ? 'Paso 1: Datos de la Cabecera' : `Paso 2: Asignación de Detalle Contable (Comprobante #${currentComp.id})`}
                </span>
              </div>

              {/* Badges de Paso */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paso === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1. Cabecera
                </span>
                <ArrowRight size={14} className="text-slate-400" />
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${paso === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  2. Detalle
                </span>
              </div>
            </div>

            {/* PASO 1: FORMULARIO CABECERA */}
            {paso === 1 && (
              <form onSubmit={handleSaveCabecera} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-grow text-sm">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/3">TIPO:</label>
                          <select 
                            className="w-2/3 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.tipoComprobante}
                            onChange={e => setCurrentComp({...currentComp, tipoComprobante: e.target.value})}
                          >
                            <option value="ING">INGRESO</option>
                            <option value="EGR">EGRESO</option>
                            <option value="TRA">TRASPASO</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/3">FECHA:</label>
                          <div className="w-2/3 flex flex-col">
                            <input 
                              type="date" 
                              required 
                              className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
                              value={currentComp.fecha} 
                              onChange={e => setCurrentComp({...currentComp, fecha: e.target.value})} 
                            />
                            <span className="text-[10px] text-slate-400 font-bold mt-1">
                              Formato: {formatFechaDMY(currentComp.fecha)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/3">TIPO DE CAMBIO:</label>
                          <select 
                            required
                            className="w-2/3 border border-indigo-200 rounded-lg p-2 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={currentComp.idTipoCambio || ''}
                            onChange={e => setCurrentComp({...currentComp, idTipoCambio: e.target.value ? Number(e.target.value) : null})}
                          >
                            <option value="">-- Seleccionar --</option>
                            {catTiposCambio.map(tc => (
                              <option key={tc.id} value={tc.id}>
                                {tc.monedaOrigen}/{tc.monedaDestino} ({tc.valor})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/3">ORIGINAL:</label>
                          <select 
                            className="w-2/3 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.esOriginal}
                            onChange={e => setCurrentComp({...currentComp, esOriginal: e.target.value})}
                          >
                            <option value="S">SI</option>
                            <option value="N">NO</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/2">FACTURA:</label>
                          <select 
                            className="w-1/2 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.esFactura}
                            onChange={e => setCurrentComp({...currentComp, esFactura: e.target.value})}
                          >
                            <option value="S">SI</option>
                            <option value="N">NO</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/2">PRESUPUESTO:</label>
                          <select 
                            className="w-1/2 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.esPresupuesto}
                            onChange={e => setCurrentComp({...currentComp, esPresupuesto: e.target.value})}
                          >
                            <option value="S">SI</option>
                            <option value="N">NO</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/2">ES ACTIVO:</label>
                          <select 
                            className="w-1/2 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.esActivo}
                            onChange={e => setCurrentComp({...currentComp, esActivo: e.target.value})}
                          >
                            <option value="S">SI</option>
                            <option value="N">NO</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider w-1/2">ES ALMACENABLE:</label>
                          <select 
                            className="w-1/2 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={currentComp.esAlmacenable}
                            onChange={e => setCurrentComp({...currentComp, esAlmacenable: e.target.value})}
                          >
                            <option value="S">SI</option>
                            <option value="N">NO</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider sm:w-1/6 pt-2">GLOSA:</label>
                      <div className="sm:w-5/6 relative">
                        <textarea 
                          rows={3} 
                          maxLength={250}
                          required 
                          placeholder="Ingrese la glosa general del comprobante..." 
                          className="w-full border border-slate-300 rounded-xl p-3 outline-none text-slate-800 text-xs resize-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm" 
                          value={currentComp.glosa || ''} 
                          onChange={e => setCurrentComp({...currentComp, glosa: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider sm:w-1/6">PERIODO DE COSTO:</label>
                      <select 
                        className="sm:w-5/6 w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                        value={currentComp.periodoCosto}
                        onChange={e => setCurrentComp({...currentComp, periodoCosto: e.target.value})}
                      >
                        <option value="ENE">ENERO</option>
                        <option value="FEB">FEBRERO</option>
                        <option value="MAR">MARZO</option>
                        <option value="ABR">ABRIL</option>
                        <option value="MAY">MAYO</option>
                        <option value="JUN">JUNIO</option>
                        <option value="JUL">JULIO</option>
                        <option value="AGO">AGOSTO</option>
                        <option value="SEP">SEPTIEMBRE</option>
                        <option value="OCT">OCTUBRE</option>
                        <option value="NOV">NOVIEMBRE</option>
                        <option value="DIC">DICIEMBRE</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-2">
                    {isEditing ? 'Actualizar Cabecera' : 'Crear Comprobante y Pasar a Detalles'} <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: FORMULARIO DETALLE */}
            {paso === 2 && (
              <form onSubmit={handleSaveDetalles} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-grow text-sm">
                  
                  {/* Resumen Cabecera Creada */}
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex justify-between items-center text-xs text-indigo-900">
                    <div>
                      <span className="font-bold">Comprobante ID #{currentComp.id}</span> - Tipo: <strong>{currentComp.tipoComprobante}</strong> - Fecha: <strong>{formatFechaDMY(currentComp.fecha)}</strong>
                    </div>
                    <button type="button" onClick={() => setPaso(1)} className="text-indigo-600 hover:underline font-bold">
                      Editar Cabecera
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={16} className="text-indigo-600" /> Líneas de Detalle Contable ({currentComp.detalles.length})
                    </h4>
                    <button 
                      type="button" 
                      onClick={handleAddDetalle}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all shadow-sm"
                    >
                      + Agregar Línea
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {currentComp.detalles.map((det, index) => {
                      const esDebe = det.debeHaber === 'DEB';

                      return (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Centro Costo</label>
                              <select 
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300 font-semibold"
                                value={det.idCentroCosto || 0}
                                onChange={e => handleDetalleChange(index, 'idCentroCosto', Number(e.target.value))}
                              >
                                <option value={0}>-- C. Costo --</option>
                                {catCentrosCosto.map(cc => <option key={cc.id} value={cc.id}>{cc.nombre}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Partida Ppto.</label>
                              <select 
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300 font-semibold"
                                value={det.idPartidaPpto || 0}
                                onChange={e => handleDetalleChange(index, 'idPartidaPpto', Number(e.target.value))}
                              >
                                <option value={0}>-- Partida --</option>
                                {catPartidas.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Cuenta Contable</label>
                              <select 
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300 font-semibold"
                                value={det.idCuentaContable || 0}
                                onChange={e => handleDetalleChange(index, 'idCuentaContable', Number(e.target.value))}
                              >
                                <option value={0}>-- Cuenta --</option>
                                {catCuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Auxiliar</label>
                              <select 
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300 font-semibold"
                                value={det.idAuxiliar || 0}
                                onChange={e => handleDetalleChange(index, 'idAuxiliar', Number(e.target.value))}
                              >
                                <option value={0}>-- Auxiliar --</option>
                                {catAuxiliares.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Datos Factura</label>
                              <input 
                                type="text" 
                                placeholder="Ej: Factura #123"
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300 font-mono"
                                value={det.datosFactura || ''} 
                                onChange={e => handleDetalleChange(index, 'datosFactura', e.target.value)}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Glosa Específica</label>
                              <input 
                                type="text" 
                                placeholder="Glosa específica..."
                                className="w-full border rounded-lg p-1.5 text-xs bg-white border-slate-300"
                                value={det.glosa || ''} 
                                onChange={e => handleDetalleChange(index, 'glosa', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 items-end">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase">Tipo Movimiento</label>
                              <select 
                                className="w-full border border-indigo-300 rounded-lg p-1.5 text-xs bg-indigo-50 font-black text-indigo-900 outline-none"
                                value={det.debeHaber}
                                onChange={e => handleDetalleChange(index, 'debeHaber', e.target.value)}
                              >
                                <option value="DEB">DEBE</option>
                                <option value="HAB">HABER</option>
                              </select>
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase ${esDebe ? 'text-emerald-700' : 'text-slate-400'}`}>
                                Monto Debe (Bs)
                              </label>
                              <input 
                                type="number" 
                                step="0.01"
                                disabled={!esDebe}
                                className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold outline-none ${
                                  esDebe 
                                    ? 'bg-white border-emerald-500 text-emerald-800 focus:ring-2 focus:ring-emerald-400' 
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                value={det.montoDebe} 
                                onChange={e => handleDetalleChange(index, 'montoDebe', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className={`text-[10px] font-black uppercase ${!esDebe ? 'text-blue-700' : 'text-slate-400'}`}>
                                Monto Haber (Bs)
                              </label>
                              <input 
                                type="number" 
                                step="0.01"
                                disabled={esDebe}
                                className={`w-full border rounded-lg p-1.5 text-xs font-mono font-bold outline-none ${
                                  !esDebe 
                                    ? 'bg-white border-blue-500 text-blue-800 focus:ring-2 focus:ring-blue-400' 
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                value={det.montoHaber} 
                                onChange={e => handleDetalleChange(index, 'montoHaber', e.target.value)}
                              />
                            </div>

                            <div className="flex justify-end pb-0.5">
                              {currentComp.detalles.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveDetalle(index)} 
                                  className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-800 text-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center text-xs font-mono">
                    <div className="flex gap-6">
                      <span>TOTAL DEBE: <strong className="text-emerald-400">Bs {totalDebe.toFixed(2)}</strong></span>
                      <span>TOTAL HABER: <strong className="text-blue-400">Bs {totalHaber.toFixed(2)}</strong></span>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span>DIFERENCIA: </span>
                      <strong className={diferenciaCuadre === 0 ? "text-emerald-400" : "text-amber-400"}>
                        Bs {Math.abs(diferenciaCuadre).toFixed(2)} {diferenciaCuadre === 0 ? "(CUADRADO)" : "(DESCUADRADO)"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-100">
                    Finalizar y Guardar Detalles
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ComprobanteList;