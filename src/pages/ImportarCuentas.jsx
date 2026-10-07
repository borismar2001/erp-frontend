import React, { useState } from 'react';
import * as cuentaService from '../api/cuentaService';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  Trash2, Database, Download 
} from 'lucide-react';

const ImportarCuentas = () => {
  const [dataExcel, setDataExcel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [erroresValidacion, setErroresValidacion] = useState([]);

  // Leer y procesar el archivo Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convertir la hoja a JSON
        const dataRaw = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (dataRaw.length === 0) {
          toast.error("El archivo Excel está vacío.");
          return;
        }

        // Mapear y validar la estructura recibida
        const filasProcesadas = [];
        const errores = [];

        dataRaw.forEach((row, index) => {
          const numFila = index + 2; // +2 por encabezado y base 1

          const codigo = String(row['Codigo'] || row['codigo'] || '').trim();
          const nombre = String(row['Nombre'] || row['nombre'] || '').trim();
          const tipo = String(row['Tipo'] || row['tipo'] || 'ACTIVO').trim().toUpperCase();
          const nivel = parseInt(row['Nivel'] || row['nivel'] || 1);
          const imputable = String(row['Imputable'] || row['imputable'] || 'S').trim().toUpperCase();
          const estado = String(row['Estado'] || row['estado'] || 'ACTIVO').trim().toUpperCase();
        // Lectura de la columna 'padre' de la imagen
          const codigoPadre = String(row['padre'] || row['Padre'] || '').trim();

          // Validaciones básicas de campos obligatorios
          if (!codigo) errores.push(`Fila ${numFila}: El campo 'Codigo' está vacío.`);
          if (!nombre) errores.push(`Fila ${numFila}: El campo 'Nombre' está vacío.`);

          filasProcesadas.push({
            idTemp: index + 1,
            codigo,
            nombre,
            tipo,
            nivel,
            imputable: imputable === 'SI' || imputable === 'S' ? 'S' : 'N',
            estado: estado === 'ACTIVO' || estado === 'A' ? 'ACTIVO' : 'INACTIVO',
            idPadre: null,      // Se mantendrá en null hasta que la API o el frontend resuelva la relación por código
            codigoPadre: codigoPadre // Código del padre de referencia (1.0.00, 1.1.00, etc.)
          });
        });

        setDataExcel(filasProcesadas);
        setErroresValidacion(errores);

        if (errores.length === 0) {
          toast.success(`Se cargaron ${filasProcesadas.length} cuentas correctamente.`);
        } else {
          toast.error(`Se detectaron ${errores.length} inconsistencias en el Excel.`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al procesar el archivo Excel.");
      }
    };

    reader.readAsBinaryString(file);
  };

  // Limpiar vista
  const handleReset = () => {
    setDataExcel([]);
    setFileName('');
    setErroresValidacion([]);
  };

  // Descargar plantilla base para el usuario
  const handleDownloadPlantilla = () => {
    const plantillaData = [
      { Codigo: '1.0.00', Nombre: 'ACTIVO', Tipo: 'ACTIVO', Nivel: 1, Imputable: 'N', Estado: 'ACTIVO', padre: null },
      { Codigo: '1.1.00', Nombre: 'ACTIVO CORRIENTE', Tipo: 'ACTIVO', Nivel: 2, Imputable: 'N', Estado: 'ACTIVO', padre: '1.0.00' },
      { Codigo: '1.1.01', Nombre: 'CAJA GENERAL', Tipo: 'ACTIVO', Nivel: 3, Imputable: 'S', Estado: 'ACTIVO', padre: '1.1.00' }
    ];

    const ws = XLSX.utils.json_to_sheet(plantillaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Cuentas");
    XLSX.writeFile(wb, "Plantilla_Plan_De_Cuentas.xlsx");
  };

  // Confirmar e guardar en el Servidor (API)
  const handleGuardarEnServidor = async () => {
    if (dataExcel.length === 0) return;
    if (erroresValidacion.length > 0) {
      toast.error("Corrige los errores antes de importar.");
      return;
    }

    setLoading(true);
    const loadId = toast.loading("Guardando plan de cuentas en el sistema...");

    try {
      // Reemplaza esta línea por tu endpoint REST real:
      // await axios.post('/api/cuenta-contable/importar-lote', dataExcel);
      //await axios.post('/api/v1/cuenta/upload', dataExcel);
      console.log("Datos a enviar al servidor:", dataExcel);
      await cuentaService.uploadBulkCuentas(dataExcel);

      //await new Promise(res => setTimeout(res, 1500)); // Simulación API

      toast.success("¡Plan de cuentas cargado con éxito!", { id: loadId });
      handleReset();
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar las cuentas en la base de datos.", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" /> Importar Plan de Cuentas Contables
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cargue su catálogo contable en lote desde un archivo Excel (`.xlsx` o `.xls`).
          </p>
        </div>

        <button 
          onClick={handleDownloadPlantilla}
          className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download size={15} className="text-indigo-600" /> Descargar Plantilla
        </button>
      </div>

      {/* Dropzone de Carga de Archivo */}
      {dataExcel.length === 0 && (
        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-center flex flex-col items-center justify-center cursor-pointer relative">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="p-4 bg-indigo-100/60 rounded-full text-indigo-600 mb-3">
            <Upload size={32} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Arrastra tu archivo Excel aquí o haz clic para examinar</h3>
          <p className="text-xs text-slate-400 mt-1">Formatos soportados: .XLSX, .XLS</p>
        </div>
      )}

      {/* Panel de Resumen de Archivo y Acciones */}
      {dataExcel.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{fileName}</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Registros listos: <strong className="text-slate-700">{dataExcel.length} cuentas</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Cancelar / Limpiar
            </button>
            <button 
              onClick={handleGuardarEnServidor}
              disabled={loading || erroresValidacion.length > 0}
              className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all ${
                erroresValidacion.length > 0 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              <Database size={15} /> Confirmar e Importar
            </button>
          </div>
        </div>
      )}

      {/* Errores de Validación */}
      {erroresValidacion.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
            <AlertTriangle size={16} /> Errores detectados en la planilla ({erroresValidacion.length})
          </div>
          <ul className="list-disc list-inside text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
            {erroresValidacion.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla de Previsualización */}
      {dataExcel.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Previsualización de datos</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              OK para procesar
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0 border-b">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre de Cuenta</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Nivel</th>
                  <th className="p-3 text-center">Imputable</th>
                  <th className="p-3 text-center">Cód. Padre</th>
                  <th className="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dataExcel.map((c) => (
                  <tr key={c.idTemp} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">{c.idTemp}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{c.codigo}</td>
                    <td className="p-3 font-medium text-slate-800">{c.nombre}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-100">{c.tipo}</span></td>
                    <td className="p-3 text-center font-bold">{c.nivel}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${c.esImputable === 'S' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.esImputable === 'S' ? 'SI' : 'NO'}
                      </span>
                    </td>
                    {/* Muestra de la referencia del código padre */}
                    <td className="p-3 text-center font-mono font-bold text-slate-600">
                      {c.codigoPadre ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.codigoPadre}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>                    
                    <td className="p-3 text-right font-bold text-slate-600">{c.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImportarCuentas;