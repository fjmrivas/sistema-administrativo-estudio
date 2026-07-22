import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function Terceros() {
  const navigate = useNavigate()
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [terceros, setTerceros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('terceros')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('razon_social', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setTerceros(data ?? [])
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Terceros</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este tercero? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('terceros').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setTerceros((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Terceros</h2>
        <NuevoButton to="/terceros/nuevo">+ Nuevo Tercero</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={terceros}
          vacio="No hay terceros registrados para esta empresa."
          onRowClick={isStaff ? (fila) => navigate(`/terceros/${fila.id}/editar`) : undefined}
          acciones={
            isStaff ? (fila) => <AccionesFila onBorrar={() => borrar(fila.id)} /> : undefined
          }
        />
      )}
    </div>
  )
}
