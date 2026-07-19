import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { KpiCard } from '../components/KpiCard'
import { sumarPosibleCampo } from '../lib/aggregate'
import { formatoMoneda } from '../lib/format'

export default function Dashboard() {
  const { empresaId } = useEmpresa()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)

    async function cargar() {
      const [facturas, cobranzas, obligaciones, cajas] = await Promise.all([
        supabase.from('facturas_venta').select('*').eq('cliente_id', empresaId),
        supabase.from('cobranzas').select('*').eq('cliente_id', empresaId),
        supabase
          .from('v_obligaciones_situacion')
          .select('*')
          .eq('cliente_id', empresaId)
          .neq('estado', 'PAGADA'),
        supabase.from('cajas_chicas').select('*').eq('cliente_id', empresaId),
      ])

      if (cancelled) return

      const totalFacturado = sumarPosibleCampo(facturas.data)
      const totalCobrado = sumarPosibleCampo(cobranzas.data)
      const porCobrar =
        totalFacturado != null && totalCobrado != null ? totalFacturado - totalCobrado : null

      const porPagar = sumarPosibleCampo(obligaciones.data)
      const cajaChica = sumarPosibleCampo(cajas.data, ['saldo'])

      setKpis({ porCobrar, porPagar, cajaChica })
      setLoading(false)
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [empresaId])

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
        />
        <KpiCard titulo="Presupuesto Ejecutado" valor="Próximamente" nota="Módulo en construcción" />
      </div>
    </div>
  )
}
