import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'

export default function TiposOrdenCompra() {
  const { isStaff } = useAuth()
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('tipos_orden_compra')
      .select('*')
      .order('nombre', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setTipos(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este tipo de orden de compra? Esta acción no se puede deshacer.'))
      return

    const { error: err } = await supabase.from('tipos_orden_compra').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setTipos((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Tipos de Orden de Compra</h2>
        {isStaff && (
          <NuevoButton to="/tipos-orden-compra/nuevo">+ Nuevo Tipo</NuevoButton>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={tipos}
          vacio="No hay tipos de orden de compra registrados."
          acciones={
            isStaff
              ? (fila) => (
                  <AccionesFila
                    editarTo={`/tipos-orden-compra/${fila.id}/editar`}
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
