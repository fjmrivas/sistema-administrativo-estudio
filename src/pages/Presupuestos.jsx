import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'
import { formatoMoneda } from '../lib/format'
import { COLOR_ESTADO, ETIQUETA_ESTADO } from '../lib/estadoDocumento'

const COLUMNAS = [
  'estado',
  'periodo',
  'numero',
  'fecha',
  'fecha_aprobacion',
  'cod_aprobacion',
  'proyecto',
  'cliente_final',
  'nombre_presupuesto',
  'importe',
  'costo_real',
  'porcentaje_margen',
  'importe_facturado',
  'ejecutivo',
  'productor',
  'factura_numero',
  'cobrado',
  'fecha_cobro',
]

const TITULOS = {
  estado: 'Situación',
  periodo: 'Periodo',
  numero: 'Número',
  fecha: 'Fecha',
  fecha_aprobacion: 'Fecha de Aprobación',
  cod_aprobacion: 'Cod. Aprobación',
  proyecto: 'Proyecto',
  cliente_final: 'Cliente Final',
  nombre_presupuesto: 'Nombre del Presupuesto',
  importe: 'Importe',
  costo_real: 'Costo Real',
  porcentaje_margen: '%',
  importe_facturado: 'Importe Facturado',
  ejecutivo: 'Ejecutivo',
  productor: 'Productor',
  factura_numero: 'N° Factura',
  cobrado: 'Cobrado',
  fecha_cobro: 'Fecha de Cobro',
}

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
  importe: (valor, fila) => formatoMoneda(valor, fila.moneda ?? 'PEN'),
  costo_real: (valor, fila) => formatoMoneda(valor, fila.moneda ?? 'PEN'),
  importe_facturado: (valor, fila) => formatoMoneda(valor, fila.moneda ?? 'PEN'),
  porcentaje_margen: (valor) => (valor != null ? `${Number(valor).toFixed(2)}%` : '—'),
  cobrado: (valor) => (
    <input
      type="checkbox"
      checked={Boolean(valor)}
      disabled
      readOnly
      className="h-4 w-4 rounded border-navy/25 text-violeta"
    />
  ),
}

export default function Presupuestos() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapaProyectos = useMapaNombres('proyectos', 'nombre', { cliente_id: empresaId })
  const mapaTerceros = useMapaNombres('terceros', 'razon_social', { cliente_id: empresaId })
  const mapaEjecutivos = useMapaNombres('ejecutivos', 'nombre', { cliente_id: empresaId })
  const mapaProductores = useMapaNombres('productores', 'nombre', { cliente_id: empresaId })

  const presupuestosResueltos = useMemo(
    () =>
      resolverFilas(presupuestos, [
        { campoId: 'proyecto_id', campoDestino: 'proyecto', mapa: mapaProyectos },
        { campoId: 'deudor_id', campoDestino: 'cliente_final', mapa: mapaTerceros },
        { campoId: 'ejecutivo_id', campoDestino: 'ejecutivo', mapa: mapaEjecutivos },
        { campoId: 'productor_id', campoDestino: 'productor', mapa: mapaProductores },
      ]),
    [presupuestos, mapaProyectos, mapaTerceros, mapaEjecutivos, mapaProductores]
  )

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('v_presupuestos_resumen')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('periodo', { ascending: false })
      .order('numero', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setPresupuestos(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Presupuesto</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('presupuestos').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setPresupuestos((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Presupuesto</h2>
        <NuevoButton to="/presupuesto/nuevo">+ Nuevo Presupuesto</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={presupuestosResueltos}
          columnas={COLUMNAS}
          titulos={TITULOS}
          renderizadores={RENDERIZADORES}
          vacio="No hay presupuestos registrados para esta empresa."
          acciones={(fila) => (
            <div className="flex items-center justify-end gap-3 text-sm">
              <Link
                to={`/presupuesto/${fila.id}/items`}
                className="font-medium text-navy hover:underline"
              >
                Ver Items
              </Link>
              {isStaff && (
                <AccionesFila
                  editarTo={`/presupuesto/${fila.id}/editar`}
                  onBorrar={() => borrar(fila.id)}
                />
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}
