import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'

const COLOR_SITUACION = {
  VENCIDA: 'bg-rojo/10 text-rojo',
  'POR VENCER': 'bg-violeta/10 text-violeta',
  PAGADA: 'bg-teal/10 text-teal',
}

export default function CuentasPorPagar() {
  const { empresaId } = useEmpresa()
  const [obligaciones, setObligaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('v_obligaciones_situacion')
      .select('*')
      .eq('cliente_id', empresaId)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        setObligaciones(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [empresaId])

  const resumen = obligaciones.reduce((acc, o) => {
    acc[o.situacion] = (acc[o.situacion] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Cuentas por Pagar</h2>
        <div className="flex gap-2">
          {Object.entries(resumen).map(([situacion, cantidad]) => (
            <span
              key={situacion}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                COLOR_SITUACION[situacion] ?? 'bg-navy/10 text-navy'
              }`}
            >
              {situacion}: {cantidad}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error cargando obligaciones: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={obligaciones}
          vacio="No hay obligaciones por pagar registradas para esta empresa."
        />
      )}
    </div>
  )
}
