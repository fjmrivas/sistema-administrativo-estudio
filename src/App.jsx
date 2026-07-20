import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { EmpresaProvider } from './context/EmpresaContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import CuentasPorPagar from './pages/CuentasPorPagar'
import NuevaFactura from './pages/NuevaFactura'
import NuevaObligacion from './pages/NuevaObligacion'
import Clientes from './pages/Clientes'
import NuevoCliente from './pages/NuevoCliente'
import Proyectos from './pages/Proyectos'
import NuevoProyecto from './pages/NuevoProyecto'
import Placeholder from './pages/Placeholder'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EmpresaProvider>
                  <Layout />
                </EmpresaProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cuentas-por-cobrar" element={<CuentasPorCobrar />} />
            <Route path="cuentas-por-cobrar/nueva" element={<NuevaFactura />} />
            <Route path="cuentas-por-cobrar/:id/editar" element={<NuevaFactura />} />
            <Route path="cuentas-por-pagar" element={<CuentasPorPagar />} />
            <Route path="cuentas-por-pagar/nueva" element={<NuevaObligacion />} />
            <Route path="cuentas-por-pagar/:id/editar" element={<NuevaObligacion />} />
            <Route path="bancos" element={<Placeholder titulo="Bancos" />} />
            <Route path="caja-chica" element={<Placeholder titulo="Caja Chica" />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/nuevo" element={<NuevoProyecto />} />
            <Route path="proyectos/:id/editar" element={<NuevoProyecto />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<NuevoCliente />} />
            <Route path="clientes/:id/editar" element={<NuevoCliente />} />
            <Route path="areas" element={<Placeholder titulo="Áreas" />} />
            <Route path="presupuesto" element={<Placeholder titulo="Presupuesto" />} />
            <Route
              path="libros-electronicos"
              element={<Placeholder titulo="Libros Electrónicos" />}
            />
            <Route path="pdt" element={<Placeholder titulo="PDT" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
