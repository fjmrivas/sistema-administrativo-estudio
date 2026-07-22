import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function Areas() {
  const navigate = useNavigate()
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('areas')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('nombre', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setAreas(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Áreas</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar esta área? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('areas').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Áreas</h2>
        <NuevoButton to="/areas/nueva">+ Nueva Área</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={areas}
          vacio="No hay áreas registradas para esta empresa."
          onRowClick={isStaff ? (fila) => navigate(`/areas/${fila.id}/editar`) : undefined}
          acciones={
            isStaff ? (fila) => <AccionesFila onBorrar={() => borrar(fila.id)} /> : undefined
          }
        />
      )}
    </div>
  )
}
