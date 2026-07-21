import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function SeccionesPresupuesto() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [secciones, setSecciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('secciones_presupuesto')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('nombre', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setSecciones(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Secciones de Presupuesto</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar esta sección? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('secciones_presupuesto').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setSecciones((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Secciones de Presupuesto</h2>
        <NuevoButton to="/secciones-presupuesto/nueva">+ Nueva Sección</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={secciones}
          vacio="No hay secciones registradas para esta empresa."
          acciones={
            isStaff
              ? (fila) => (
                  <AccionesFila
                    editarTo={`/secciones-presupuesto/${fila.id}/editar`}
                    onBorrar={() => borrar(fila.id)}
                  />
                )
              : undefined
          }
        />
      )}
    </div>
  )
}
