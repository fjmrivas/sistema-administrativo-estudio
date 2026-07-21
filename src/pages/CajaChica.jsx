import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'

export default function CajaChica() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapaAreas = useMapaNombres('areas', 'nombre', { cliente_id: empresaId })
  const mapaResponsables = useMapaNombres('responsables', 'nombre', { cliente_id: empresaId })

  const cajasResueltas = useMemo(
    () =>
      resolverFilas(cajas, [
        { campoId: 'area_id', campoDestino: 'area', mapa: mapaAreas },
        { campoId: 'responsable_id', campoDestino: 'responsable', mapa: mapaResponsables },
      ]),
    [cajas, mapaAreas, mapaResponsables]
  )

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('cajas_chicas')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('nombre', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setCajas(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Caja Chica</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar esta caja chica? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('cajas_chicas').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setCajas((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Caja Chica</h2>
        <NuevoButton to="/caja-chica/nueva">+ Nueva Caja</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={cajasResueltas}
          vacio="No hay cajas chicas registradas para esta empresa."
          acciones={(fila) => (
            <div className="flex items-center justify-end gap-3 text-sm">
              <Link
                to={`/caja-chica/${fila.id}/movimientos`}
                className="font-medium text-navy hover:underline"
              >
                Movimientos
              </Link>
              {isStaff && (
                <AccionesFila
                  editarTo={`/caja-chica/${fila.id}/editar`}
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
