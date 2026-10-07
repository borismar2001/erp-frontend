import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as personaService from '../api/personaService';

const PersonaList = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState({
    nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: 'CI', estado: 'ACTIVO'
  });

  useEffect(() => { fetchPersonas(); }, []);

  const fetchPersonas = async () => {
    try {
      const res = await personaService.getPersonas();
      setPersonas(Array.isArray(res.data) ? res.data : (res.data.content || []));
    } catch (err) { toast.error("Error al cargar personas"); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const loadId = toast.loading("Guardando...");
    try {
      if (isEditing) await personaService.updatePersona(currentPersona.id, currentPersona);
      //api.put(`/api/v1/personas/${currentPersona.id}`, currentPersona);
      else await personaService.createPersona(currentPersona); 
      //api.post('/api/v1/personas', currentPersona);
      toast.success("Operación exitosa", { id: loadId });
      setIsModalOpen(false);
      fetchPersonas();
    } catch (err) { toast.error("Error al procesar", { id: loadId }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta persona?")) return;
    try {
      await personaService.deletePersona(id); 
      //api.delete(`/api/v1/personas/${id}`);
      toast.success("Persona eliminada");
      fetchPersonas();
    } catch (err) { toast.error("No se pudo eliminar"); }
  };

  const openModal = (persona = null) => {
    if (persona) {
      setIsEditing(true);
      setCurrentPersona(persona);
    } else {
      setIsEditing(false);
      setCurrentPersona({ nombres: '', primerApellido: '', segundoApellido: '', tipoDocumento: 'CI', estado: 'ACTIVO' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-6 bg-slate-800 flex justify-between items-center text-white">
        <h2 className="text-xl font-bold">Gestión de Personas</h2>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-all">
          + Nueva Persona
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nro. Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {personas.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {p.id}
                </td>                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {`${p.nombreCompleto}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.tipoDocumento}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.numeroDocumento}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${p.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900 mr-3 font-bold">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 font-bold">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <form onSubmit={handleSave} className="p-6">
              <h3 className="text-xl font-bold mb-6 border-b pb-2">
                {isEditing ? 'Editar Persona' : 'Registrar Persona'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Nombres</label>
                  <input type="text" className="w-full border rounded-lg p-2" required value={currentPersona.nombres}
                    onChange={e => setCurrentPersona({...currentPersona, nombres: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Primer Apellido</label>
                  <input type="text" className="w-full border rounded-lg p-2" required value={currentPersona.primerApellido}
                    onChange={e => setCurrentPersona({...currentPersona, primerApellido: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Segundo Apellido</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={currentPersona.segundoApellido}
                    onChange={e => setCurrentPersona({...currentPersona, segundoApellido: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Tipo Documento</label>
                  <select className="w-full border rounded-lg p-2" value={currentPersona.tipoDocumento}
                    onChange={e => setCurrentPersona({...currentPersona, tipoDocumento: e.target.value})}>
                    <option value="CI">CI</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                    <option value="EXTRANJERO">C.E.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Nro. Documento</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={currentPersona.numeroDocumento}
                    onChange={e => setCurrentPersona({...currentPersona, numeroDocumento: e.target.value})} />
                </div>

              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium">Estado</label>
                  <select className="w-full border rounded-lg p-2" value={currentPersona.estado}
                    onChange={e => setCurrentPersona({...currentPersona, estado: e.target.value})}>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaList;