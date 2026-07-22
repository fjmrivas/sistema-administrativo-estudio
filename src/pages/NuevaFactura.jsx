import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  tipo_doc: 'Factura',
  serie: '',
  numero: '',
  fecha_emision: '',
  fecha_vencim: '',
  moneda: 'PEN',
  monto_total: '',
  saldo_pendiente: '',
  condicion_pago_id: null,
  proyecto_id: null,
  deudor_id: null,
}

export default function NuevaFactura() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const editando = Boolean(id)
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const desdePresupuesto = !editando ? location.state : null
  const [form, setForm] = useState(() => {
    if (!desdePresupuesto) return inicial
    return {
      ...inicial,
      tipo_doc: desdePresupuesto.tipo_doc ?? inicial.tipo_doc,
      moneda: desdePresupuesto.moneda ?? inicial.moneda,
      monto_total: desdePresupuesto.monto_total ?? inicial.monto_total,
      saldo_pendiente: desdePresupuesto.monto_total ?? inicial.saldo_pendiente,
      proyecto_id: desdePresupuesto.proyecto_id ?? null,
      deudor_id: desdePresupuesto.deudor_id ?? null,
    }
  })
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('facturas_venta')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            tipo_doc: data.tipo_doc ?? 'Factura',
            serie: data.serie ?? '',
            numero: data.numero ?? '',
            fecha_emision: data.fecha_emision ?? '',
            fecha_vencim: data.fecha_vencim ?? '',
            moneda: data.moneda ?? 'PEN',
            monto_total: data.monto_total != null ? String(data.monto_total) : '',
            saldo_pendiente: data.saldo_pendiente != null ? String(data.saldo_pendiente) : '',
            condicion_pago_id: data.condicion_pago_id,
            proyecto_id: data.proyecto_id,
            deudor_id: data.deudor_id,
          })
        }
        setCargandoRegistro(false)
      })

    return () => {
      cancelled = true
    }
  }, [editando, id])

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">
          {editando ? 'Editar Factura' : 'Nueva Factura'}
        </h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  if (cargandoRegistro) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const montoTotal = Number(form.monto_total)
    const saldoPendiente =
      form.saldo_pendiente === '' ? montoTotal : Number(form.saldo_pendiente)

    const payload = {
      tipo_doc: form.tipo_doc,
      serie: form.serie || null,
      numero: form.numero || null,
      fecha_emision: form.fecha_emision,
      fecha_vencim: form.fecha_vencim || null,
      moneda: form.moneda,
      monto_total: montoTotal,
      saldo_pendiente: saldoPendiente,
      condicion_pago_id: form.condicion_pago_id || null,
      proyecto_id: form.proyecto_id || null,
      deudor_id: form.deudor_id || null,
    }
    if (!editando) payload.cliente_id = empresaId

    if (editando) {
      const { error: err } = await supabase.from('facturas_venta').update(payload).eq('id', id)
      setSubmitting(false)
      if (err) {
        setError(err.message)
        return
      }
      navigate('/cuentas-por-cobrar')
      return
    }

    const { data, error: err } = await supabase
      .from('facturas_venta')
      .insert(payload)
      .select('id')
      .single()

    if (err) {
      setSubmitting(false)
      setError(err.message)
      return
    }

    if (desdePresupuesto?.itemsFactura?.length) {
      const filasFacturaItems = desdePresupuesto.itemsFactura.map((it) => ({
        factura_id: data.id,
        presupuesto_item_id: it.presupuesto_item_id,
        monto: it.monto,
      }))
      const { error: errItems } = await supabase
        .from('factura_presupuesto_items')
        .insert(filasFacturaItems)

      setSubmitting(false)
      if (errItems) {
        setError(errItems.message)
        return
      }
    } else {
      setSubmitting(false)
    }

    navigate('/cuentas-por-cobrar')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Factura' : 'Nueva Factura'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Tipo de documento">
          <select value={form.tipo_doc} onChange={set('tipo_doc')} className={inputClass}>
            <option value="Factura">Factura</option>
            <option value="Boleta">Boleta</option>
            <option value="Nota de Crédito">Nota de Crédito</option>
            <option value="Nota de Débito">Nota de Débito</option>
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Serie">
            <input value={form.serie} onChange={set('serie')} className={inputClass} placeholder="F001" />
          </FormField>
          <FormField label="Número">
            <input value={form.numero} onChange={set('numero')} className={inputClass} placeholder="00001" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha de emisión" required>
            <input
              type="date"
              required
              value={form.fecha_emision}
              onChange={set('fecha_emision')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Fecha de vencimiento">
            <input
              type="date"
              value={form.fecha_vencim}
              onChange={set('fecha_vencim')}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Moneda">
            <select value={form.moneda} onChange={set('moneda')} className={inputClass}>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </FormField>
          <FormField label="Monto total" required>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.monto_total}
              onChange={set('monto_total')}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Saldo pendiente">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.saldo_pendiente}
            onChange={set('saldo_pendiente')}
            className={inputClass}
            placeholder="Por defecto, igual al monto total"
          />
        </FormField>

        <FormField label="Deudor">
          <CatalogoSelect
            tabla="terceros"
            filtro={{ tipo: ['deudor', 'ambos'] }}
            value={form.deudor_id}
            onChange={(valor) => setForm((f) => ({ ...f, deudor_id: valor }))}
          />
        </FormField>

        <FormField label="Condición de pago">
          <CatalogoSelect
            tabla="condiciones_pago"
            value={form.condicion_pago_id}
            onChange={(valor) => setForm((f) => ({ ...f, condicion_pago_id: valor }))}
          />
        </FormField>

        <FormField label="Proyecto">
          <CatalogoSelect
            tabla="proyectos"
            filtro={{ cliente_id: empresaId }}
            value={form.proyecto_id}
            onChange={(valor) => setForm((f) => ({ ...f, proyecto_id: valor }))}
          />
        </FormField>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/cuentas-por-cobrar')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
