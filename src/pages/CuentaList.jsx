import React, { useState, useEffect } from 'react';
import * as cuentaService from '../api/cuentaService';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Edit, Trash2, CheckCircle2, XCircle, Search, FileText, FileSpreadsheet } from 'lucide-react';


const CuentaList = () => {
  const [cuentas, setCuentas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Filtro de búsqueda rápida en Frontend
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);


// Manejador para PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    const toastId = toast.loading("Generando reporte PDF...");
    try {
      //await descargarReportePdf();
      await cuentaService.descargarReportePdf();
      toast.success("PDF descargado correctamente.", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar el reporte PDF.", { id: toastId });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Manejador para Excel
  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    const toastId = toast.loading("Generando reporte Excel...");
    try {
      await cuentaService.descargarReporteExcel();
      //await descargarReporteExcel();
      toast.success("Excel descargado correctamente.", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar el reporte Excel.", { id: toastId });
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Estructura exacta solicitada por tu JSON
  const [currentCuenta, setCurrentCuenta] = useState({
    id: null,
    codigo: '',
    nombre: '',    
    tipo: '',
    nivel: '',
    imputable: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    try {
      const res = await cuentaService.getCuentas();
      const dataArr = Array.isArray(res.data) ? res.data : res.data?.content || [];
      
      // Ordenamos las cuentas por su código contable de forma ascendente
      const dataOrdenada = dataArr.sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
      setCuentas(dataOrdenada);
    } catch (err) {
      toast.error("Error al cargar el plan de cuentas contables");
      setCuentas([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentCuenta.codigo.trim()) {
      toast.error("El código del plan de cuentas es obligatorio");
      return;
    }
    if (!currentCuenta.nombre.trim()) {
      toast.error("El nombre descriptivo de la cuenta es requerido");
      return;
    }

    const loadId = toast.loading("Registrando cuenta en el sistema contable...");
    console.log("Datos a enviar al servidor:", currentCuenta);
    try {
      if (isEditing) {
        await cuentaService.updateCuenta(currentCuenta.id, currentCuenta);
        toast.success("Cuenta contable modificada con éxito", { id: loadId });
      } else {
        await cuentaService.createCuenta(currentCuenta);
        toast.success("Cuenta integrada al plan de cuentas", { id: loadId });
      }
      setIsModalOpen(false);
      fetchCuentas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error en los servidores contables", { id: loadId });
    }
  };

  const openModal = (cuentaObj = null) => {
    if (cuentaObj) {
      setIsEditing(true);
      setCurrentCuenta({
        id: cuentaObj.id,
        codigo: cuentaObj.codigo || '',
        nombre: cuentaObj.nombre || '',    
        tipo: cuentaObj.tipo || '',
        nivel: cuentaObj.nivel || 0,
        imputable: cuentaObj.imputable || '',
        idPadre: cuentaObj.idPadre || null,
        estado: cuentaObj.estado || 'ACTIVO'        
      });
    } else {
      setIsEditing(false);
      setCurrentCuenta({ 
        id: null, // Requerido para la persistencia limpia en Spring Boot
        codigo: '',
        nombre: '',
        tipo: '',
        nivel: 0,
        imputable: '', 
        idPadre: null,
        estado: 'ACTIVO' 
      });
    }
    setIsModalOpen(true);
  };

  // Filtrado reactivo en frontend por código o nombre
  const cuentasFiltradas = cuentas.filter(c => 
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

// ----------------------------------------------------
  // MÉTODO PARA ELIMINAR UNA CUENTA DEL LISTADO
  // ----------------------------------------------------
  const handleDeleteCuenta = async (cuenta) => {
    // Validar si la cuenta es imputable o si tiene movimiento
    if (cuenta.esImputable === 'N') {
      toast.error(`La cuenta ${cuenta.codigo} es de grupo y no puede ser eliminada directamente.`);
      return;
    }

    // Modal / Alerta de confirmación antes de eliminar
    const confirmado = window.confirm(
      `¿Está seguro de eliminar la cuenta contable "${cuenta.codigo} - ${cuenta.nombre}"?`
    );

    if (!confirmado) return;

    const loadId = toast.loading("Eliminando cuenta contable...");

    try {
      await cuentaService.deleteCuenta(cuenta.id);
      
      // Actualizar el estado local para remover el registro de la tabla sin reargar
      setCuentas(prevCuentas => prevCuentas.filter(item => item.id !== cuenta.id));

      toast.success("Cuenta contable eliminada correctamente.", { id: loadId });
    } catch (error) {
      console.error(error);
      
      if (error.response?.status === 403) {
        toast.error("No tienes permisos para eliminar esta cuenta.", { id: loadId });
      } else if (error.response?.status === 409 || error.response?.status === 400) {
        toast.error("No se puede eliminar la cuenta porque ya posee movimientos o subcuentas asociadas.", { id: loadId });
      } else {
        toast.error("Error al intentar eliminar la cuenta contable.", { id: loadId });
      }
    }
  };

  return (
    <div className="p-1">      


<div className="p-6 max-w-6xl mx-auto space-y-4">
</div>


      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Plan de Cuentas Contables
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Catálogo estructural para la imputación de asientos y comprobantes financieros.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Agregar Cuenta
        </button>
          {/* Botón PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <FileText size={16} className="text-red-600" />
            {downloadingPdf ? 'Exportando...' : 'Exportar PDF'}
          </button>

          {/* Botón Excel */}
          <button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            {downloadingExcel ? 'Exportando...' : 'Exportar Excel'}
          </button>

      </div>
              <div className="flex items-center gap-2">

        </div>

      {/* Barra de Filtros en Frontend */}
      <div className="mb-4 max-w-md bg-white border border-slate-100 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-indigo-500 transition-colors">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por código o denominación de cuenta..."
          className="w-full text-xs outline-none bg-transparent text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
      </div>

      {/* Tabla Corporativa */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left w-48">Código</th>
              <th className="px-6 py-4 text-left">Nombre</th>
              <th className="px-6 py-4 text-left">Tipo</th>
              <th className="px-6 py-4 text-left">Nivel</th>
              <th className="px-6 py-4 text-left">Imputable</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
            {cuentasFiltradas.map(cuenta => (
              <tr key={cuenta.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs tracking-wider">
                  {cuenta.codigo}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 uppercase tracking-wide">
                  {cuenta.nombre}
                </td>
                <td className="px-6 py-4">
                  {cuenta.tipo}
                </td>
                <td className="px-6 py-4">
                  {cuenta.nivel}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    cuenta.imputable === 'S' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cuenta.imputable === 'S' ? 'SI' : 'NO'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 ${
                    cuenta.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cuenta.estado === 'ACTIVO' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {cuenta.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openModal(cuenta)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Editar Parámetros"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteCuenta(cuenta)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Inhabilitar Asignación"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {cuentasFiltradas.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-sm text-slate-400 italic bg-slate-50/40">
                  No se encontraron cuentas contables que coincidan con los criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSave} 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header Modal */}
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" />
                {isEditing ? 'Modificar Registro de Cuenta' : 'Estructurar Nueva Cuenta'}
              </h3>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* CÓDIGO CONTABLE */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Código Contable (Nomenclatura)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: 1.1.01.02.001"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm font-mono font-bold outline-none focus:border-indigo-500 bg-transparent text-slate-800"
                  value={currentCuenta.codigo || ''} 
                  onChange={e => {
                    // Permitir números y puntos para la estructura del plan de cuentas
                    const valClean = e.target.value.replace(/[^0-9.]/g, '');
                    setCurrentCuenta({...currentCuenta, codigo: valClean});
                  }} 
                />
              </div>

              {/* DESCRIPCIÓN NOMBRE */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Denominación o Nombre de Cuenta</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: CAJA CHICA - MONEDA NACIONAL"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold text-slate-800"
                  value={currentCuenta.nombre || ''} 
                  onChange={e => setCurrentCuenta({...currentCuenta, nombre: e.target.value.toUpperCase()})} 
                />
              </div>
{/* Fila 3: Selección de Cuenta Padre (idPadre) */}
        <div>
          <label className="block font-black text-slate-700 uppercase mb-1">
            Cuenta Padre (Grupo Superior)
          </label>
          <select 
            className="w-full border border-indigo-200 rounded-lg p-2 font-semibold text-slate-800 bg-indigo-50/50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={currentCuenta.idPadre || ''}
            onChange={e => {
              const padreId = e.target.value ? Number(e.target.value) : null;
              // Si selecciona un padre, buscarlo para sugerir o ajustar el nivel automáticamente
              const cuentaPadre = cuentas.find(c => c.id === padreId);
              setCurrentCuenta({ 
                ...currentCuenta, 
                idPadre: padreId,
                nivel: cuentaPadre ? cuentaPadre.nivel + 1 : 1
              });
            }}
          >
            <option value="">-- Ninguna (Cuenta Raíz - Nivel 1) --</option>
            {cuentas
              // Filtrar para no permitir seleccionarse a sí misma como padre
              .filter(c => c.id !== currentCuenta.id && c.imputable === 'N')
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nombre} (Nivel {c.nivel})
                </option>
              ))
            }
          </select>
        </div>
              {/* TIPO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo de Cuenta</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: ACTIVO"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent uppercase font-semibold text-slate-800"
                  value={currentCuenta.tipo || ''} 
                  onChange={e => setCurrentCuenta({...currentCuenta, tipo: e.target.value.toUpperCase()})} 
                />
              </div>

              {/* NIVEL */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel de Cuenta</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Ej: 1"
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none focus:border-indigo-500 bg-transparent font-semibold text-slate-800"
                  value={currentCuenta.nivel || 0} 
                  onChange={e => setCurrentCuenta({...currentCuenta, nivel: parseInt(e.target.value)})} 
                />
              </div>

              {/* IMPUTABLE */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Imputable</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium text-slate-700"
                  value={currentCuenta.imputable || 'SI'} 
                  onChange={e => setCurrentCuenta({...currentCuenta, imputable: e.target.value})}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="S">SI (Permite imputación)</option>
                  <option value="N">NO (No permite imputación)</option>
                </select>
              </div>

              {/* ESTADO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de Imputación</label>
                <select 
                  className="w-full border rounded-lg p-2.5 mt-1 text-sm outline-none bg-transparent font-medium text-slate-700"
                  value={currentCuenta.estado || 'ACTIVO'} 
                  onChange={e => setCurrentCuenta({...currentCuenta, estado: e.target.value})}
                >
                  <option value="ACTIVO">ACTIVO (Permite transacciones en asientos)</option>
                  <option value="INACTIVO">INACTIVO (Bloquear afectación contable)</option>
                </select>
              </div>
            </div>

            {/* Footer Acciones */}
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 bg-white border text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-100"
              >
                {isEditing ? 'Guardar Modificación' : 'Dar de Alta'}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default CuentaList;