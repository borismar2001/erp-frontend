import React from 'react';
import FormSelect from './FormSelect';
import { CreditCard } from 'lucide-react';

const TipoDocumentoSelect = ({ value, onChange, required = false }) => {
  const tiposDocumento = [
    { id: 'CI', nombre: 'Cédula de Identidad (CI)' },
    { id: 'PASAPORTE', nombre: 'Pasaporte' },
    { id: 'EXTRANJERO', nombre: 'Carnet de Extranjero (C.E.)' }
  ];

  return (
    <FormSelect
      label="Tipo Documento"
      value={value}
      onChange={onChange}
      options={tiposDocumento}
      required={required}
      placeholder="-- Seleccione Tipo Documento --"
      icon={CreditCard}
    />
  );
};

export default TipoDocumentoSelect;