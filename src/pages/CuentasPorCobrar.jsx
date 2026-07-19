import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { SinEmpresa } from '../components/SinEmpresa'
import { sumarCampo } from '../lib/aggregate'
import { formatoMoneda } from '../lib/format'

export default function CuentasPorCobrar() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [facturas, setFacturas] = useState([])
  const [cobranzas, setCobranzas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      supabase
        .from('facturas_venta')
        .select('*')
        .eq('cliente_id', empresaId)
        .order('id', { ascending: false }),
      supabase
        .from('cobranzas')
        .select('*')
        .eq('cliente_id', empresaId)
        .order('id', { ascending: false }),
    ]).then(([resFacturas, resCobranzas]) => {
      if (cancelled) return
      if (resFacturas.error) setError(resFacturas.error.message)
      setFacturas(resFacturas.data ?? [])
      setCobranzas(resCobranzas.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [empresaId])

  const totalFacturado = sumarCampo(facturas, 'monto_total')
  const totalPendiente = sumarCampo(facturas, 'saldo_pendiente')
  const totalCobrado =
    totalFacturado != null && totalPendiente != null ? totalFacturado - totalPendiente : null

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Cuentas por Cobrar</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">Cuentas por Cobrar</h2>
        {totalFacturado != null && (
          <p className="text-sm text-navy/60">
            Facturado: <span className="font-medium text-navy">{formatoMoneda(totalFacturado)}</span>
            {'  ·  '}
            Cobrado: <span className="font-medium text-teal">{formatoMoneda(totalCobrado)}</span>
            {'  ·  '}
            Saldo pendiente:{' '}
            <span className="font-medium text-violeta">{formatoMoneda(totalPendiente)}</span>
          </p>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error cargando facturas: {error}</p>}

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Facturas de venta
        </h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
        ) : (
          <DataTable filas={facturas} vacio="No hay facturas registradas para esta empresa." />
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Cobranzas
        </h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
        ) : (
          <DataTable filas={cobranzas} vacio="No hay cobranzas registradas para esta empresa." />
        )}
      </section>
    </div>
  )
}
