import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function Presupuestos() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
          filas={presupuestos}
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
