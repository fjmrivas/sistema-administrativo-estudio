import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { KpiCard } from '../components/KpiCard'
import { formatoMoneda } from '../lib/format'

export default function PresupuestoDetalle() {
  const { presupuestoId } = useParams()
  const { isStaff } = useAuth()
  const [presupuesto, setPresupuesto] = useState(null)
  const [totales, setTotales] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      supabase.from('presupuestos').select('*').eq('id', presupuestoId).single(),
      supabase
        .from('v_presupuesto_totales')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .maybeSingle(),
      supabase
        .from('v_presupuesto_items_margen')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('item_numero', { ascending: true }),
    ]).then(([resPresupuesto, resTotales, resItems]) => {
      if (cancelled) return
      if (resPresupuesto.error) setError(resPresupuesto.error.message)
      setPresupuesto(resPresupuesto.data ?? null)
      setTotales(resTotales.data ?? null)
      setItems(resItems.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [presupuestoId])

  async function borrarItem(id) {
    if (!window.confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('presupuesto_items').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  const moneda = presupuesto?.moneda ?? 'PEN'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">
          Presupuesto{presupuesto?.nombre_presupuesto ? ` — ${presupuesto.nombre_presupuesto}` : ''}
          {presupuesto?.numero != null ? ` (#${presupuesto.numero})` : ''}
        </h2>
        <NuevoButton to={`/presupuesto/${presupuestoId}/items/nuevo`}>+ Nuevo Ítem</NuevoButton>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {totales && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard titulo="Sub Total" valor={formatoMoneda(totales.sub_total, moneda)} />
          <KpiCard titulo="IGV" valor={formatoMoneda(totales.igv_total, moneda)} />
          <KpiCard titulo="Total" color="violeta" valor={formatoMoneda(totales.total, moneda)} />
          <KpiCard titulo="Costo Estimado" valor={formatoMoneda(totales.costo_estimado, moneda)} />
          <KpiCard titulo="Costo Real" valor={formatoMoneda(totales.costo_real, moneda)} />
          <KpiCard
            titulo="Utilidad Estimada"
            color="teal"
            valor={formatoMoneda(totales.utilidad_estimada, moneda)}
          />
          <KpiCard
            titulo="Utilidad Real"
            color="teal"
            valor={formatoMoneda(totales.utilidad_real, moneda)}
          />
        </div>
      )}

      <DataTable
        filas={items}
        vacio="No hay ítems registrados en este presupuesto."
        acciones={
          isStaff
            ? (fila) => (
                <AccionesFila
                  editarTo={`/presupuesto/${presupuestoId}/items/${fila.id}/editar`}
                  onBorrar={() => borrarItem(fila.id)}
                />
              )
            : undefined
        }
      />
    </div>
  )
}
