import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { KpiCard } from '../components/KpiCard'
import { formatoMoneda, formatoFecha, formatoFechaHora } from '../lib/format'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'
import { COLOR_ESTADO, ETIQUETA_ESTADO } from '../lib/estadoDocumento'

const OPCIONES_TIPO_DOC = ['Factura', 'Boleta', 'Nota de Crédito', 'Nota de Débito']

function mapearTipoDoc(nombreTipoDoc) {
  if (!nombreTipoDoc) return undefined
  const normalizado = nombreTipoDoc.trim().toLowerCase()
  return OPCIONES_TIPO_DOC.find((opcion) => opcion.toLowerCase() === normalizado)
}

export default function PresupuestoDetalle() {
  const { presupuestoId } = useParams()
  const navigate = useNavigate()
  const { isStaff } = useAuth()
  const { empresaId } = useEmpresa()
  const [presupuesto, setPresupuesto] = useState(null)
  const [totales, setTotales] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionados, setSeleccionados] = useState(() => new Set())
  const [mapaSaldoFacturar, setMapaSaldoFacturar] = useState(() => new Map())

  const mapaProveedores = useMapaNombres('terceros', 'razon_social', { cliente_id: empresaId })
  const mapaSecciones = useMapaNombres('secciones_presupuesto', 'nombre', { cliente_id: empresaId })
  const mapaUsuarios = useMapaNombres('usuarios', 'nombre')
  const mapaTiposDocumento = useMapaNombres('tipos_documento_facturacion', 'nombre')

  const moneda = presupuesto?.moneda ?? 'PEN'

  const itemsResueltos = useMemo(
    () =>
      resolverFilas(
        items,
        [
          { campoId: 'proveedor_id', campoDestino: 'proveedor', mapa: mapaProveedores },
          { campoId: 'seccion_id', campoDestino: 'seccion', mapa: mapaSecciones },
        ],
        // costo_real: valor manual antiguo, ambiguo frente a costo_real_calculado
        ['presupuesto_id', 'costo_real']
      ).map((fila) => ({
        ...fila,
        saldo_por_facturar: mapaSaldoFacturar.get(fila.id) ?? null,
      })),
    [items, mapaProveedores, mapaSecciones, mapaSaldoFacturar]
  )

  const ITEMS_TITULOS = {
    costo_real_calculado: 'Costo Real',
    margen_real_monto: 'Margen Real',
    saldo_por_facturar: 'Saldo x Facturar',
  }

  const ITEMS_RENDERIZADORES = {
    saldo_por_facturar: (valor) => formatoMoneda(valor, moneda),
  }

  function toggleSeleccion(itemId) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

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

  useEffect(() => {
    if (items.length === 0) {
      setMapaSaldoFacturar(new Map())
      return
    }
    let cancelled = false

    supabase
      .from('v_presupuesto_items_facturacion')
      .select('presupuesto_item_id, saldo_por_facturar')
      .in(
        'presupuesto_item_id',
        items.map((it) => it.id)
      )
      .then(({ data }) => {
        if (cancelled) return
        setMapaSaldoFacturar(
          new Map((data ?? []).map((fila) => [fila.presupuesto_item_id, fila.saldo_por_facturar]))
        )
      })

    return () => {
      cancelled = true
    }
  }, [items])

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

  function irAGenerarFactura() {
    const relevantes =
      seleccionados.size > 0 ? items.filter((it) => seleccionados.has(it.id)) : items

    const itemsFactura = relevantes.map((it) => {
      const base = Number(it.precio_total) || 0
      const igv = Number(it.igv) || 0
      return { presupuesto_item_id: it.id, monto: Number((base + igv).toFixed(2)) }
    })
    const montoTotal = itemsFactura.reduce((acc, it) => acc + it.monto, 0)

    navigate('/cuentas-por-cobrar/nueva', {
      state: {
        deudor_id: presupuesto?.deudor_id ?? null,
        proyecto_id: presupuesto?.proyecto_id ?? null,
        moneda: presupuesto?.moneda ?? 'PEN',
        tipo_doc: mapearTipoDoc(mapaTiposDocumento.get(presupuesto?.tipo_doc_emitir_id)),
        monto_total: montoTotal.toFixed(2),
        itemsFactura,
      },
    })
  }

  function irAGenerarOC() {
    const relevantes =
      seleccionados.size > 0 ? items.filter((it) => seleccionados.has(it.id)) : items

    navigate('/ordenes-compra/nueva', {
      state: {
        presupuestoId,
        presupuestoItemIds: relevantes.map((it) => it.id),
      },
    })
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

  const estado = presupuesto?.estado

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">
          Presupuesto{presupuesto?.nombre_presupuesto ? ` — ${presupuesto.nombre_presupuesto}` : ''}
          {presupuesto?.numero != null ? ` (#${presupuesto.numero})` : ''}
        </h2>
        {estado === 'registro' && (
          <NuevoButton to={`/presupuesto/${presupuestoId}/items/nuevo`}>+ Nuevo Ítem</NuevoButton>
        )}
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

        {presupuesto?.usuario_aprobador_id && (
          <p className="text-sm text-navy/60">
            Usuario que aprobó:{' '}
            <span className="font-medium text-navy">
              {mapaUsuarios.get(presupuesto.usuario_aprobador_id) ?? '—'}
            </span>
          </p>
        )}

        {presupuesto?.actualizado_en && (
          <p className="text-sm text-navy/60">
            Última actualización:{' '}
            <span className="font-medium text-navy">{formatoFechaHora(presupuesto.actualizado_en)}</span>
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
              onClick={() => cambiarEstado('registro')}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5"
            >
              Desaprobar
            </button>
            <button
              type="button"
              onClick={irAGenerarFactura}
              className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal/90"
            >
              Generar Factura
            </button>
            <button
              type="button"
              onClick={irAGenerarOC}
              className="rounded-lg bg-violeta px-3 py-1.5 text-sm font-medium text-white hover:bg-violeta/90"
            >
              Generar Orden de Compra
            </button>
          </div>
        )}
      </div>

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
        titulos={ITEMS_TITULOS}
        renderizadores={ITEMS_RENDERIZADORES}
        vacio="No hay ítems registrados en este presupuesto."
        accionesInicio={(fila) => (
          <input
            type="checkbox"
            checked={seleccionados.has(fila.id)}
            onChange={() => toggleSeleccion(fila.id)}
            className="h-4 w-4 rounded border-navy/25 text-violeta focus:ring-violeta/30"
          />
        )}
        acciones={
          isStaff
            ? (fila) => (
                <div className="flex items-center justify-end gap-3 text-sm">
                  <Link
                    to="/ordenes-compra/nueva"
                    state={{ presupuestoId, presupuestoItemId: fila.id }}
                    className="font-medium text-teal hover:underline"
                  >
                    Generar OC
                  </Link>
                  {estado === 'registro' && (
                    <AccionesFila
                      editarTo={`/presupuesto/${presupuestoId}/items/${fila.id}/editar`}
                      onBorrar={() => borrarItem(fila.id)}
                    />
                  )}
                </div>
              )
            : undefined
        }
      />
    </div>
  )
}
