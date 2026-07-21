import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { KpiCard } from '../components/KpiCard'
import { formatoMoneda, formatoFecha } from '../lib/format'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'

const COLOR_ESTADO = {
  registro: 'bg-navy/10 text-navy',
  aprobado: 'bg-teal/10 text-teal',
  cerrado: 'bg-violeta/10 text-violeta',
  anulado: 'bg-rojo/10 text-rojo',
  finalizado: 'bg-teal/10 text-teal',
  contabilizado: 'bg-violeta/10 text-violeta',
}

const ETIQUETA_ESTADO = {
  registro: 'Registro',
  aprobado: 'Aprobado',
  cerrado: 'Cerrado',
  anulado: 'Anulado',
  finalizado: 'Finalizado',
  contabilizado: 'Contabilizado',
}

export default function PresupuestoDetalle() {
  const { presupuestoId } = useParams()
  const { isStaff } = useAuth()
  const { empresaId } = useEmpresa()
  const [presupuesto, setPresupuesto] = useState(null)
  const [totales, setTotales] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [facturaGenerada, setFacturaGenerada] = useState(null)

  const mapaProveedores = useMapaNombres('terceros', 'razon_social', { cliente_id: empresaId })
  const mapaSecciones = useMapaNombres('secciones_presupuesto', 'nombre', { cliente_id: empresaId })

  const itemsResueltos = useMemo(
    () =>
      resolverFilas(
        items,
        [
          { campoId: 'proveedor_id', campoDestino: 'proveedor', mapa: mapaProveedores },
          { campoId: 'seccion_id', campoDestino: 'seccion', mapa: mapaSecciones },
        ],
        ['presupuesto_id']
      ),
    [items, mapaProveedores, mapaSecciones]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      supabase.from('presupuestos').select('*').eq('id', presupuestoId).single(),
      supabase
        .from('v_presupuesto_totales')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .maybeSingle(),
      supabase
        .from('v_presupuesto_items_margen')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('item_numero', { ascending: true }),
    ]).then(([resPresupuesto, resTotales, resItems]) => {
      if (cancelled) return
      if (resPresupuesto.error) setError(resPresupuesto.error.message)
      setPresupuesto(resPresupuesto.data ?? null)
      setTotales(resTotales.data ?? null)
      setItems(resItems.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [presupuestoId])

  async function cambiarEstado(nuevoEstado) {
    const { error: err } = await supabase
      .from('presupuestos')
      .update({ estado: nuevoEstado })
      .eq('id', presupuestoId)
    if (err) {
      setError(err.message)
      return
    }
    setPresupuesto((prev) => (prev ? { ...prev, estado: nuevoEstado } : prev))
  }

  async function generarFactura() {
    setError(null)
    setGenerando(true)

    const { data, error: err } = await supabase.rpc('generar_factura_desde_presupuesto', {
      presupuesto_id: presupuestoId,
    })

    setGenerando(false)
    if (err) {
      setError(err.message)
      return
    }
    setFacturaGenerada(data)
  }

  async function borrarItem(id) {
    if (!window.confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('presupuesto_items').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  const moneda = presupuesto?.moneda ?? 'PEN'

  const estado = presupuesto?.estado

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">
          Presupuesto{presupuesto?.nombre_presupuesto ? ` — ${presupuesto.nombre_presupuesto}` : ''}
          {presupuesto?.numero != null ? ` (#${presupuesto.numero})` : ''}
        </h2>
        <NuevoButton to={`/presupuesto/${presupuestoId}/items/nuevo`}>+ Nuevo Ítem</NuevoButton>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {estado && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              COLOR_ESTADO[estado] ?? 'bg-navy/10 text-navy'
            }`}
          >
            {ETIQUETA_ESTADO[estado] ?? estado}
          </span>
        )}

        {presupuesto?.cod_aprobacion && (
          <p className="text-sm text-navy/60">
            Código de aprobación: <span className="font-medium text-navy">{presupuesto.cod_aprobacion}</span>
          </p>
        )}

        {presupuesto?.fecha_aprobacion && (
          <p className="text-sm text-navy/60">
            Fecha de aprobación:{' '}
            <span className="font-medium text-navy">{formatoFecha(presupuesto.fecha_aprobacion)}</span>
          </p>
        )}

        {isStaff && estado === 'registro' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cambiarEstado('aprobado')}
              className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal/90"
            >
              Aprobar
            </button>
            <button
              type="button"
              onClick={() => cambiarEstado('anulado')}
              className="rounded-lg bg-rojo px-3 py-1.5 text-sm font-medium text-white hover:bg-rojo/90"
            >
              Anular
            </button>
          </div>
        )}

        {isStaff && estado === 'aprobado' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cambiarEstado('cerrado')}
              className="rounded-lg bg-violeta px-3 py-1.5 text-sm font-medium text-white hover:bg-violeta/90"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={generarFactura}
              disabled={generando}
              className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal/90 disabled:opacity-60"
            >
              {generando ? 'Generando…' : 'Generar Factura'}
            </button>
          </div>
        )}
      </div>

      {facturaGenerada && (
        <p className="mb-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal">
          Factura generada correctamente.{' '}
          <Link
            to={`/cuentas-por-cobrar/${facturaGenerada}/editar`}
            className="font-medium underline"
          >
            Ver factura →
          </Link>
        </p>
      )}

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {totales && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard titulo="Sub Total" valor={formatoMoneda(totales.sub_total, moneda)} />
          <KpiCard titulo="IGV" valor={formatoMoneda(totales.igv_total, moneda)} />
          <KpiCard titulo="Total" color="violeta" valor={formatoMoneda(totales.total, moneda)} />
          <KpiCard titulo="Costo Estimado" valor={formatoMoneda(totales.costo_estimado, moneda)} />
          <KpiCard titulo="Costo Real" valor={formatoMoneda(totales.costo_real, moneda)} />
          <KpiCard
            titulo="Utilidad Estimada"
            color="teal"
            valor={formatoMoneda(totales.utilidad_estimada, moneda)}
          />
          <KpiCard
            titulo="Utilidad Real"
            color="teal"
            valor={formatoMoneda(totales.utilidad_real, moneda)}
          />
        </div>
      )}

      <DataTable
        filas={itemsResueltos}
        vacio="No hay ítems registrados en este presupuesto."
        acciones={
          isStaff
            ? (fila) => (
                <AccionesFila
                  editarTo={`/presupuesto/${presupuestoId}/items/${fila.id}/editar`}
                  onBorrar={() => borrarItem(fila.id)}
                />
              )
            : undefined
        }
      />
    </div>
  )
}
