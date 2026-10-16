import React from 'react';
import FormSelect from './FormSelect';
import { Building2 } from 'lucide-react';

const SucursalSelect = ({ value, onChange, sucursales = [], required = false, disabled = false }) => {
  return (
    <FormSelect
      label="Sucursal Corporativa"
      value={value}
      onChange={onChange}
      options={sucursales}
      required={required}
      disabled={disabled}
      placeholder="-- Seleccione una Sucursal --"
      icon={Building2}
    />
  );
};

export default SucursalSelect;