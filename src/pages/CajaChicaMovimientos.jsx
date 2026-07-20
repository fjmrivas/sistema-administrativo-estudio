import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { KpiCard } from '../components/KpiCard'
import { formatoMoneda } from '../lib/format'

export default function CajaChicaMovimientos() {
  const { cajaId } = useParams()
  const { isStaff } = useAuth()
  const [caja, setCaja] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      supabase.from('cajas_chicas').select('*').eq('id', cajaId).single(),
      supabase
        .from('movimientos_caja_chica')
        .select('*')
        .eq('caja_chica_id', cajaId)
        .order('fecha', { ascending: false }),
    ]).then(([resCaja, resMovimientos]) => {
      if (cancelled) return
      if (resCaja.error) setError(resCaja.error.message)
      setCaja(resCaja.data ?? null)
      setMovimientos(resMovimientos.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [cajaId])

  async function borrar(id) {
    if (!window.confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('movimientos_caja_chica').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setMovimientos((prev) => prev.filter((m) => m.id !== id))
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">
          Caja Chica{caja?.nombre ? ` — ${caja.nombre}` : ''}
        </h2>
        <NuevoButton to={`/caja-chica/${cajaId}/movimientos/nuevo`}>+ Nuevo Movimiento</NuevoButton>
      </div>

      {caja && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard titulo="Saldo actual" color="violeta" valor={formatoMoneda(caja.saldo_actual)} />
          <KpiCard titulo="Fondo fijo" valor={formatoMoneda(caja.fondo_fijo)} />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      <DataTable
        filas={movimientos}
        vacio="No hay movimientos registrados en esta caja."
        acciones={
          isStaff
            ? (fila) => (
                <AccionesFila
                  editarTo={`/caja-chica/${cajaId}/movimientos/${fila.id}/editar`}
                  onBorrar={() => borrar(fila.id)}
                />
              )
            : undefined
        }
      />
    </div>
  )
}
