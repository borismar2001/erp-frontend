import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import UserList from './pages/UserList';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import PersonaList from './pages/PersonaList';
import PerfilList from './pages/PerfilList';
import MenuList from './pages/MenuList';
import RoleList from './pages/RoleList';
import EmpresaList from './pages/EmpresaList';
import SucursalList from './pages/SucursalList';
import EjercicioList from './pages/EjercicioList';
import TipoCambioList from './pages/TipoCambioList';
import AuxiliarList from './pages/AuxiliarList';
import CentroCostoList from './pages/CentroCostoList';
import CuentaList from './pages/CuentaList';  
import PartidaPptoList from './pages/PartidaPptoList';
import ComprobanteList from './pages/ComprobanteList';
import ImportarCuentas from './pages/ImportarCuentas';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* 1. RUTA PÚBLICA: Siempre accesible */}
        <Route path="/login" element={<Login />} />

        {/* 2. RUTAS PROTEGIDAS: Requieren Token */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* La ruta raíz "/" ahora muestra Welcome */}
            <Route index element={<Welcome />} />
            <Route path="users" element={<UserList />} />
            <Route path="personas" element={<PersonaList />} />
            <Route path="perfiles" element={<PerfilList />} />
            <Route path="menus" element={<MenuList />} />
            <Route path="roles" element={<RoleList />} />
            <Route path="empresas" element={<EmpresaList />} />
            <Route path="sucursales" element={<SucursalList />} />
            <Route path="ejercicios" element={<EjercicioList />} />
            <Route path="tipos-cambio" element={<TipoCambioList />} />
            <Route path="auxiliares" element={<AuxiliarList />} />
            <Route path="centros-costo" element={<CentroCostoList />} />
            <Route path="cuentas" element={<CuentaList />} />
            <Route path="partidas-ppto" element={<PartidaPptoList />} />
            <Route path="comprobantes" element={<ComprobanteList />} />
            <Route path="importar-cuentas" element={<ImportarCuentas />} />
            {/* Agrega más rutas aquí bajo el mismo layout */}
          </Route>
        </Route>

        {/* 3. COMODÍN: Si no estás logueado y vas a cualquier otra ruta, al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;