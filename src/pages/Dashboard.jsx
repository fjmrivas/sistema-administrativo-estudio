import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { KpiCard } from '../components/KpiCard'
import { SinEmpresa } from '../components/SinEmpresa'
import { sumarCampo } from '../lib/aggregate'
import { formatoMoneda } from '../lib/format'

export default function Dashboard() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)

    async function cargar() {
      const [facturas, obligaciones, cajas] = await Promise.all([
        supabase
          .from('facturas_venta')
          .select('saldo_pendiente')
          .eq('cliente_id', empresaId),
        supabase
          .from('v_obligaciones_situacion')
          .select('saldo_pendiente')
          .eq('cliente_id', empresaId)
          .neq('situacion', 'PAGADA'),
        supabase
          .from('cajas_chicas')
          .select('saldo_actual, fondo_fijo')
          .eq('cliente_id', empresaId),
      ])

      if (cancelled) return

      const porCobrar = sumarCampo(facturas.data, 'saldo_pendiente')
      const porPagar = sumarCampo(obligaciones.data, 'saldo_pendiente')
      const cajaChica = sumarCampo(cajas.data, 'saldo_actual')
      const fondoFijo = sumarCampo(cajas.data, 'fondo_fijo')

      setKpis({ porCobrar, porPagar, cajaChica, fondoFijo })
      setLoading(false)
    }

    cargar()
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
        <h2 className="mb-6 text-xl font-semibold text-navy">Inicio</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-navy">Inicio</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Por Cobrar"
          color="teal"
          valor={loading ? '…' : kpis?.porCobrar != null ? formatoMoneda(kpis.porCobrar) : '—'}
        />
        <KpiCard
          titulo="Por Pagar"
          color="rojo"
          valor={loading ? '…' : kpis?.porPagar != null ? formatoMoneda(kpis.porPagar) : '—'}
        />
        <KpiCard
          titulo="Caja Chica"
          color="violeta"
          valor={loading ? '…' : kpis?.cajaChica != null ? formatoMoneda(kpis.cajaChica) : '—'}
          nota={
            !loading && kpis?.fondoFijo != null
              ? `Fondo fijo: ${formatoMoneda(kpis.fondoFijo)}`
              : undefined
          }
        />
        <KpiCard titulo="Presupuesto Ejecutado" valor="Próximamente" nota="Módulo en construcción" />
      </div>
    </div>
  )
}
