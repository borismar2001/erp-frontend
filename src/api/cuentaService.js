import api from './axios';

export const getCuentas = () => api.get('/api/v1/cuenta');
export const getCuentaById = (id) => api.get(`/api/v1/cuenta/${id}`);
export const createCuenta = (data) => api.post('/api/v1/cuenta', data);
export const updateCuenta = (id, data) => api.put(`/api/v1/cuenta/${id}`, data);
export const deleteCuenta = (id) => api.delete(`/api/v1/cuenta/${id}`);
export const uploadCuentas = (data) => api.post('/api/v1/cuenta/upload', data);
export const uploadBulkCuentas = (data) => api.post('/api/v1/cuenta/bulk', data);


// DEFINICIÓN DE LA FUNCIÓN HELPER
const getAuthHeadersBlob = () => {
  const token = localStorage.getItem('token');
  return {
    responseType: 'blob', // Necesario para procesar respuestas binarias (PDF / Excel)
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

/**
 * Descarga el reporte del Plan de Cuentas en formato PDF
 */
export const descargarReportePdf = async () => {
  const response = await api.get(`/api/v1/reportes/cuentas/pdf`, getAuthHeadersBlob());
  
  // Crear enlace temporal para descargar el blob recibido
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Plan_De_Cuentas_${new Date().toISOString().slice(0, 10)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Descarga el reporte del Plan de Cuentas en formato Excel
 */
export const descargarReporteExcel = async () => {
  const response = await api.get(`/api/v1/reportes/cuentas/excel`, getAuthHeadersBlob());
  
  // Crear enlace temporal para descargar el blob recibido
  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Plan_De_Cuentas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
