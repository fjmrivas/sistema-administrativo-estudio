import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { EmpresaProvider } from './context/EmpresaContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
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
            <Route
              path="cuentas-por-pagar"
              element={<Placeholder titulo="Cuentas por Pagar" />}
            />
            <Route path="bancos" element={<Placeholder titulo="Bancos" />} />
            <Route path="caja-chica" element={<Placeholder titulo="Caja Chica" />} />
            <Route path="proyectos" element={<Placeholder titulo="Proyectos" />} />
            <Route path="clientes" element={<Placeholder titulo="Clientes" />} />
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
