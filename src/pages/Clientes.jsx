import { useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { supabase } from '../lib/supabase'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setClientes(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Clientes</h2>
        <NuevoButton to="/clientes/nuevo">+ Nuevo Cliente</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error cargando clientes: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable filas={clientes} vacio="No hay clientes registrados." />
      )}
    </div>
  )
}
