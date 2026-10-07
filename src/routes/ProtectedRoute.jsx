import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Verificamos si existe el token en el almacenamiento local
  const token = localStorage.getItem('token');

  // Si no hay token, redirigimos al login
  // El componente <Outlet /> renderiza las rutas hijas si está autenticado
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;