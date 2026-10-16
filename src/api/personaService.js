import api from './axios';

export const getPersonas = () => api.get('/api/v1/personas');
export const createPersona = (data) => api.post('/api/v1/personas', data);
export const updatePersona = (id, data) => api.put(`/api/v1/personas/${id}`, data);

export const eliminarPersona = async (id, txIdUsuario = 1) => {
  return await api.delete(`/api/v1/personas/${id}/eliminar`, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};
export const activarPersona = async (id, txIdUsuario = 1) => {
  return await api.put(`/api/v1/personas/${id}/activar`, null, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};
export const inactivarPersona = async (id, txIdUsuario = 1) => {
  return await api.put(`/api/v1/personas/${id}/inactivar`, null, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};