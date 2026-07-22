import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Clientes() {
  const navigate = useNavigate()
  const { isStaff } = useAuth()
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

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('clientes').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setClientes((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Clientes</h2>
        <NuevoButton to="/clientes/nuevo">+ Nuevo Cliente</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={clientes}
          vacio="No hay clientes registrados."
          onRowClick={isStaff ? (fila) => navigate(`/clientes/${fila.id}/editar`) : undefined}
          acciones={
            isStaff ? (fila) => <AccionesFila onBorrar={() => borrar(fila.id)} /> : undefined
          }
        />
      )}
    </div>
  )
}
