import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { SinEmpresa } from '../components/SinEmpresa'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { sumarCampo } from '../lib/aggregate'
import { formatoMoneda } from '../lib/format'

const COLOR_SITUACION = {
  VENCIDA: 'bg-rojo/10 text-rojo',
  'POR VENCER': 'bg-violeta/10 text-violeta',
  PAGADA: 'bg-teal/10 text-teal',
}

export default function CuentasPorPagar() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
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

  const totalPendiente = sumarCampo(
    obligaciones.filter((o) => o.situacion !== 'PAGADA'),
    'saldo_pendiente'
  )

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Cuentas por Pagar</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function borrar(id) {
    if (!window.confirm('¿Eliminar esta obligación? Esta acción no se puede deshacer.')) return

    const { error: err } = await supabase.from('obligaciones_por_pagar').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setObligaciones((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Cuentas por Pagar</h2>
        <div className="flex flex-wrap items-center gap-3">
          {totalPendiente != null && (
            <p className="text-sm text-navy/60">
              Saldo pendiente:{' '}
              <span className="font-medium text-rojo">{formatoMoneda(totalPendiente)}</span>
            </p>
          )}
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
          <NuevoButton to="/cuentas-por-pagar/nueva">+ Nueva Obligación</NuevoButton>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error cargando obligaciones: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={obligaciones}
          vacio="No hay obligaciones por pagar registradas para esta empresa."
          acciones={(fila) => (
            <AccionesFila
              editarTo={`/cuentas-por-pagar/${fila.id}/editar`}
              onBorrar={() => borrar(fila.id)}
            />
          )}
        />
      )}
    </div>
  )
}
