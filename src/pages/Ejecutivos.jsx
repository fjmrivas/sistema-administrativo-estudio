import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function Ejecutivos() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [ejecutivos, setEjecutivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('ejecutivos')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('nombre', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setEjecutivos(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Ejecutivos</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este ejecutivo? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('ejecutivos').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setEjecutivos((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Ejecutivos</h2>
        <NuevoButton to="/ejecutivos/nuevo">+ Nuevo Ejecutivo</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={ejecutivos}
          vacio="No hay ejecutivos registrados para esta empresa."
          acciones={
            isStaff
              ? (fila) => (
                  <AccionesFila
                    editarTo={`/ejecutivos/${fila.id}/editar`}
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
