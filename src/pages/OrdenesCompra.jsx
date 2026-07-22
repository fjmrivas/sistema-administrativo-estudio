import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { SinEmpresa } from '../components/SinEmpresa'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'
import { COLOR_ESTADO, ETIQUETA_ESTADO } from '../lib/estadoDocumento'

const RENDERIZADORES = {
  estado: (valor) =>
    valor ? (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          COLOR_ESTADO[valor] ?? 'bg-navy/10 text-navy'
        }`}
      >
        {ETIQUETA_ESTADO[valor] ?? valor}
      </span>
    ) : (
      '—'
    ),
}

function exportarCsv(filas) {
  if (filas.length === 0) return
  const columnas = Object.keys(filas[0]).filter((c) => c !== 'id')
  const encabezado = columnas.join(',')
  const lineas = filas.map((fila) =>
    columnas.map((c) => `"${String(fila[c] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [encabezado, ...lineas].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ordenes-compra-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OrdenesCompra() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapaProveedores = useMapaNombres('terceros', 'razon_social', { cliente_id: empresaId })
  const mapaTiposOc = useMapaNombres('tipos_orden_compra', 'nombre')
  const mapaTiposDoc = useMapaNombres('tipos_documento_facturacion', 'nombre')
  const mapaCondiciones = useMapaNombres('condiciones_pago', 'nombre')
  const mapaPresupuestos = useMapaNombres('presupuestos', 'nombre_presupuesto', {
    cliente_id: empresaId,
  })
  const mapaUsuarios = useMapaNombres('usuarios', 'nombre')

  const ordenesResueltas = useMemo(
    () =>
      resolverFilas(ordenes, [
        { campoId: 'proveedor_id', campoDestino: 'proveedor', mapa: mapaProveedores },
        { campoId: 'tipo_orden_compra_id', campoDestino: 'tipo', mapa: mapaTiposOc },
        { campoId: 'tipo_doc_id', campoDestino: 'documento', mapa: mapaTiposDoc },
        { campoId: 'condicion_pago_id', campoDestino: 'condicion_pago', mapa: mapaCondiciones },
        { campoId: 'presupuesto_id', campoDestino: 'presupuesto', mapa: mapaPresupuestos },
        { campoId: 'usuario_creador_id', campoDestino: 'creado_por', mapa: mapaUsuarios },
        { campoId: 'usuario_aprobador_id', campoDestino: 'aprobado_por', mapa: mapaUsuarios },
      ]),
    [
      ordenes,
      mapaProveedores,
      mapaTiposOc,
      mapaTiposDoc,
      mapaCondiciones,
      mapaPresupuestos,
      mapaUsuarios,
    ]
  )

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('presupuestos')
      .select('id')
      .eq('cliente_id', empresaId)
      .then(async ({ data: presupuestosData, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }

        const presupuestoIds = (presupuestosData ?? []).map((p) => p.id)
        if (presupuestoIds.length === 0) {
          setOrdenes([])
          setLoading(false)
          return
        }

        const { data, error: err2 } = await supabase
          .from('ordenes_compra')
          .select('*')
          .in('presupuesto_id', presupuestoIds)
          .order('creado_en', { ascending: false })

        if (cancelled) return
        if (err2) setError(err2.message)
        setOrdenes(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [empresaId])

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Órdenes de Compra</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function anular(id) {
    if (!window.confirm('¿Anular esta orden de compra?')) return

    const { error: err } = await supabase
      .from('ordenes_compra')
      .update({ estado: 'anulado' })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setOrdenes((prev) => prev.map((o) => (o.id === id ? { ...o, estado: 'anulado' } : o)))
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar esta orden de compra? Esta acción no se puede deshacer.'))
      return

    const { error: err } = await supabase.from('ordenes_compra').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setOrdenes((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Órdenes de Compra</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportarCsv(ordenesResueltas)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-navy/70 hover:bg-navy/5"
          >
            Exportar
          </button>
          <NuevoButton to="/ordenes-compra/nueva">+ Nueva Orden de Compra</NuevoButton>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={ordenesResueltas}
          renderizadores={RENDERIZADORES}
          vacio="No hay órdenes de compra registradas para esta empresa."
          acciones={(fila) => (
            <div className="flex items-center justify-end gap-3 text-sm">
              <Link to={`/ordenes-compra/${fila.id}`} className="font-medium text-navy hover:underline">
                Ver
              </Link>
              {isStaff && fila.estado === 'registro' && (
                <>
                  <button
                    type="button"
                    onClick={() => anular(fila.id)}
                    className="font-medium text-rojo hover:underline"
                  >
                    Anular
                  </button>
                  <button
                    type="button"
                    onClick={() => borrar(fila.id)}
                    className="font-medium text-rojo hover:underline"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}
