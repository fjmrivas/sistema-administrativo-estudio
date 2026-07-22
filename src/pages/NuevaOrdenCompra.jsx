import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'

const hoy = new Date().toISOString().slice(0, 10)

const inicial = {
  proveedor_id: null,
  monto: '',
  concepto: '',
  fecha: hoy,
  moneda: 'PEN',
}

export default function NuevaOrdenCompra() {
  const navigate = useNavigate()
  const { presupuestoId, itemId } = useParams()
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: err } = await supabase.from('ordenes_compra').insert({
      presupuesto_item_id: itemId,
      proveedor_id: form.proveedor_id || null,
      monto: Number(form.monto),
      concepto: form.concepto || null,
      fecha: form.fecha,
      moneda: form.moneda,
    })

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(`/presupuesto/${presupuestoId}/items`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">Generar Orden de Compra</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Proveedor" required>
          <CatalogoSelect
            tabla="terceros"
            filtro={{ tipo: ['proveedor', 'ambos'] }}
            value={form.proveedor_id}
            onChange={(valor) => setForm((f) => ({ ...f, proveedor_id: valor }))}
          />
        </FormField>

        <FormField label="Concepto">
          <input value={form.concepto} onChange={set('concepto')} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha" required>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={set('fecha')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Moneda">
            <select value={form.moneda} onChange={set('moneda')} className={inputClass}>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </FormField>
        </div>

        <FormField label="Monto" required>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.monto}
            onChange={set('monto')}
            className={inputClass}
          />
        </FormField>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate(`/presupuesto/${presupuestoId}/items`)}
        />
      </form>
    </div>
  )
}
