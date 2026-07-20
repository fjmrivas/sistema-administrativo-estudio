import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  tipo_doc: 'Factura',
  serie: '',
  numero_doc: '',
  fecha_emision: '',
  fecha_vencim: '',
  moneda: 'PEN',
  monto_total: '',
  saldo_pendiente: '',
  tiene_detraccion: false,
  condicion_pago_id: null,
  proyecto_id: null,
  proveedor_id: null,
}

export default function NuevaObligacion() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [form, setForm] = useState(inicial)
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('obligaciones_por_pagar')
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
            numero_doc: data.numero_doc ?? '',
            fecha_emision: data.fecha_emision ?? '',
            fecha_vencim: data.fecha_vencim ?? '',
            moneda: data.moneda ?? 'PEN',
            monto_total: data.monto_total != null ? String(data.monto_total) : '',
            saldo_pendiente: data.saldo_pendiente != null ? String(data.saldo_pendiente) : '',
            tiene_detraccion: data.tiene_detraccion ?? false,
            condicion_pago_id: data.condicion_pago_id,
            proyecto_id: data.proyecto_id,
            proveedor_id: data.proveedor_id,
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
          {editando ? 'Editar Obligación por Pagar' : 'Nueva Obligación por Pagar'}
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
      numero_doc: form.numero_doc || null,
      fecha_emision: form.fecha_emision,
      fecha_vencim: form.fecha_vencim,
      moneda: form.moneda,
      monto_total: montoTotal,
      saldo_pendiente: saldoPendiente,
      tiene_detraccion: form.tiene_detraccion,
      condicion_pago_id: form.condicion_pago_id || null,
      proyecto_id: form.proyecto_id || null,
      proveedor_id: form.proveedor_id || null,
    }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('obligaciones_por_pagar').update(payload).eq('id', id)
      : await supabase.from('obligaciones_por_pagar').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/cuentas-por-pagar')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Obligación por Pagar' : 'Nueva Obligación por Pagar'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Tipo de documento">
          <select value={form.tipo_doc} onChange={set('tipo_doc')} className={inputClass}>
            <option value="Factura">Factura</option>
            <option value="Boleta">Boleta</option>
            <option value="Recibo por Honorarios">Recibo por Honorarios</option>
            <option value="Nota de Crédito">Nota de Crédito</option>
            <option value="Nota de Débito">Nota de Débito</option>
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Serie">
            <input value={form.serie} onChange={set('serie')} className={inputClass} />
          </FormField>
          <FormField label="Número">
            <input value={form.numero_doc} onChange={set('numero_doc')} className={inputClass} />
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
          <FormField label="Fecha de vencimiento" required>
            <input
              type="date"
              required
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

        <label className="flex items-center gap-2 text-sm text-navy/80">
          <input
            type="checkbox"
            checked={form.tiene_detraccion}
            onChange={(e) => setForm((f) => ({ ...f, tiene_detraccion: e.target.checked }))}
            className="h-4 w-4 rounded border-navy/25 text-violeta focus:ring-violeta/30"
          />
          Tiene detracción
        </label>

        <FormField label="Proveedor">
          <CatalogoSelect
            tabla="terceros"
            filtro={{ tipo: ['proveedor', 'ambos'] }}
            value={form.proveedor_id}
            onChange={(valor) => setForm((f) => ({ ...f, proveedor_id: valor }))}
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
          onCancel={() => navigate('/cuentas-por-pagar')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
