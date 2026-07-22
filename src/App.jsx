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
import Bancos from './pages/Bancos'
import NuevaCuentaBancaria from './pages/NuevaCuentaBancaria'
import NuevoDocumentoBanco from './pages/NuevoDocumentoBanco'
import NuevaTransferencia from './pages/NuevaTransferencia'
import CajaChica from './pages/CajaChica'
import NuevaCaja from './pages/NuevaCaja'
import CajaChicaMovimientos from './pages/CajaChicaMovimientos'
import NuevoMovimientoCaja from './pages/NuevoMovimientoCaja'
import Presupuestos from './pages/Presupuestos'
import NuevoPresupuesto from './pages/NuevoPresupuesto'
import PresupuestoDetalle from './pages/PresupuestoDetalle'
import NuevoPresupuestoItem from './pages/NuevoPresupuestoItem'
import Terceros from './pages/Terceros'
import NuevoTercero from './pages/NuevoTercero'
import Ejecutivos from './pages/Ejecutivos'
import NuevoEjecutivo from './pages/NuevoEjecutivo'
import Productores from './pages/Productores'
import NuevoProductor from './pages/NuevoProductor'
import Areas from './pages/Areas'
import NuevaArea from './pages/NuevaArea'
import SeccionesPresupuesto from './pages/SeccionesPresupuesto'
import NuevaSeccionPresupuesto from './pages/NuevaSeccionPresupuesto'
import TiposDocumento from './pages/TiposDocumento'
import OrdenesCompra from './pages/OrdenesCompra'
import OrdenCompraDetalle from './pages/OrdenCompraDetalle'
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
            <Route path="bancos" element={<Bancos />} />
            <Route path="bancos/cuenta/nueva" element={<NuevaCuentaBancaria />} />
            <Route path="bancos/cuenta/:id/editar" element={<NuevaCuentaBancaria />} />
            <Route path="bancos/documento/nuevo" element={<NuevoDocumentoBanco />} />
            <Route path="bancos/documento/:id/editar" element={<NuevoDocumentoBanco />} />
            <Route path="bancos/transferencia/nueva" element={<NuevaTransferencia />} />
            <Route path="bancos/transferencia/:id/editar" element={<NuevaTransferencia />} />
            <Route path="caja-chica" element={<CajaChica />} />
            <Route path="caja-chica/nueva" element={<NuevaCaja />} />
            <Route path="caja-chica/:id/editar" element={<NuevaCaja />} />
            <Route path="caja-chica/:cajaId/movimientos" element={<CajaChicaMovimientos />} />
            <Route
              path="caja-chica/:cajaId/movimientos/nuevo"
              element={<NuevoMovimientoCaja />}
            />
            <Route
              path="caja-chica/:cajaId/movimientos/:id/editar"
              element={<NuevoMovimientoCaja />}
            />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/nuevo" element={<NuevoProyecto />} />
            <Route path="proyectos/:id/editar" element={<NuevoProyecto />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<NuevoCliente />} />
            <Route path="clientes/:id/editar" element={<NuevoCliente />} />
            <Route path="areas" element={<Areas />} />
            <Route path="areas/nueva" element={<NuevaArea />} />
            <Route path="areas/:id/editar" element={<NuevaArea />} />
            <Route path="terceros" element={<Terceros />} />
            <Route path="terceros/nuevo" element={<NuevoTercero />} />
            <Route path="terceros/:id/editar" element={<NuevoTercero />} />
            <Route path="ejecutivos" element={<Ejecutivos />} />
            <Route path="ejecutivos/nuevo" element={<NuevoEjecutivo />} />
            <Route path="ejecutivos/:id/editar" element={<NuevoEjecutivo />} />
            <Route path="productores" element={<Productores />} />
            <Route path="productores/nuevo" element={<NuevoProductor />} />
            <Route path="productores/:id/editar" element={<NuevoProductor />} />
            <Route path="secciones-presupuesto" element={<SeccionesPresupuesto />} />
            <Route
              path="secciones-presupuesto/nueva"
              element={<NuevaSeccionPresupuesto />}
            />
            <Route
              path="secciones-presupuesto/:id/editar"
              element={<NuevaSeccionPresupuesto />}
            />
            <Route path="tipos-documento" element={<TiposDocumento />} />
            <Route path="ordenes-compra" element={<OrdenesCompra />} />
            <Route path="ordenes-compra/nueva" element={<OrdenCompraDetalle />} />
            <Route path="ordenes-compra/:id" element={<OrdenCompraDetalle />} />
            <Route path="presupuesto" element={<Presupuestos />} />
            <Route path="presupuesto/nuevo" element={<NuevoPresupuesto />} />
            <Route path="presupuesto/:id/editar" element={<NuevoPresupuesto />} />
            <Route path="presupuesto/:presupuestoId/items" element={<PresupuestoDetalle />} />
            <Route
              path="presupuesto/:presupuestoId/items/nuevo"
              element={<NuevoPresupuestoItem />}
            />
            <Route
              path="presupuesto/:presupuestoId/items/:id/editar"
              element={<NuevoPresupuestoItem />}
            />
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
