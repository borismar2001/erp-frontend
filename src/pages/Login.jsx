import React, { useState } from 'react'; // 1. Importar useState
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  // 2. Definir los estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {      
      // Ahora 'username' y 'password' ya existen porque están arriba
      const response = await api.post('/auth/login', { 
        username, 
        password 
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        toast.success('¡ Bienvenido ' + username + '!');
        navigate('/', { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Error de credenciales";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-6 font-bold text-center">Iniciar Sesión</h2>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Usuario</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={username} // 3. Vincular el valor al estado
            onChange={(e) => setUsername(e.target.value)} // 4. Actualizar el estado al escribir
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-semibold">Contraseña</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password} // Vincular al estado
            onChange={(e) => setPassword(e.target.value)} // Actualizar el estado
            required
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;