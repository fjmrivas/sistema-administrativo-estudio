import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'

export default function Presupuestos() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapaClientes = useMapaNombres('clientes', 'razon_social', { id: empresaId })
  const mapaProyectos = useMapaNombres('proyectos', 'nombre', { cliente_id: empresaId })
  const mapaTerceros = useMapaNombres('terceros', 'razon_social', { cliente_id: empresaId })
  const mapaEjecutivos = useMapaNombres('ejecutivos', 'nombre', { cliente_id: empresaId })
  const mapaProductores = useMapaNombres('productores', 'nombre', { cliente_id: empresaId })
  const mapaAreas = useMapaNombres('areas', 'nombre', { cliente_id: empresaId })
  const mapaTiposDoc = useMapaNombres('tipos_documento_facturacion', 'nombre')

  const presupuestosResueltos = useMemo(
    () =>
      resolverFilas(presupuestos, [
        { campoId: 'cliente_id', campoDestino: 'cliente', mapa: mapaClientes },
        { campoId: 'proyecto_id', campoDestino: 'proyecto', mapa: mapaProyectos },
        { campoId: 'deudor_id', campoDestino: 'cliente_final', mapa: mapaTerceros },
        { campoId: 'ejecutivo_id', campoDestino: 'ejecutivo', mapa: mapaEjecutivos },
        { campoId: 'productor_id', campoDestino: 'productor', mapa: mapaProductores },
        { campoId: 'area_id', campoDestino: 'area', mapa: mapaAreas },
        { campoId: 'tipo_doc_emitir_id', campoDestino: 'tipo_documento', mapa: mapaTiposDoc },
      ]),
    [presupuestos, mapaClientes, mapaProyectos, mapaTerceros, mapaEjecutivos, mapaProductores, mapaAreas, mapaTiposDoc]
  )

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('presupuestos')
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
