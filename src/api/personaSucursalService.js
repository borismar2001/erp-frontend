import api from './axios';

export const getSucursalActivaPorPersona = async (idPersona) => api.get(`/api/v1/persona-sucursal/persona/${idPersona}/activa`);

// @PostMapping
export const asignarPersonaSucursal = async (personaSucursalData, usuarioId = 1) => {
  return await api.post('/api/v1/persona-sucursal', personaSucursalData, {
    headers: {
      'usuarioId': usuarioId
    }
  });
};

// @GetMapping("/persona/{idPersona}")
export const getSucursalesPorPersona = async (idPersona) => {
  return await api.get(`/api/v1/persona-sucursal/persona/${idPersona}`);
};

// @GetMapping("/persona/{idPersona}/activa")
export const activarPersonaSucursal = async (id, txIdUsuario = 1) => {
  return await api.put(`/api/v1/persona-sucursal/${id}/activar`, null, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};
export const inactivarPersonaSucursal = async (id, txIdUsuario = 1) => {
  return await api.put(`/api/v1/persona-sucursal/${id}/inactivar`, null, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};
export const eliminarPersonaSucursal = async (id, txIdUsuario = 1) => {
  return await api.delete(`/api/v1/persona-sucursal/${id}/eliminar`, null, {
    headers: {
      'tx_id_usuario': txIdUsuario
    }
  });
};