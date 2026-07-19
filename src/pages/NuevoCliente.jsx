import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'

const inicial = {
  razon_social: '',
  ruc: '',
  tipo: 'empresa',
  contacto_nombre: '',
  contacto_email: '',
  contacto_telefono: '',
}

export default function NuevoCliente() {
  const navigate = useNavigate()
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: err } = await supabase.from('clientes').insert({
      razon_social: form.razon_social,
      ruc: form.ruc || null,
      tipo: form.tipo,
      contacto_nombre: form.contacto_nombre || null,
      contacto_email: form.contacto_email || null,
      contacto_telefono: form.contacto_telefono || null,
    })

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/clientes')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">Nuevo Cliente</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Razón social" required>
          <input
            required
            value={form.razon_social}
            onChange={set('razon_social')}
            className={inputClass}
          />
        </FormField>

        <FormField label="RUC">
          <input value={form.ruc} onChange={set('ruc')} maxLength={11} className={inputClass} />
        </FormField>

        <FormField label="Tipo">
          <select value={form.tipo} onChange={set('tipo')} className={inputClass}>
            <option value="empresa">Empresa</option>
            <option value="persona">Persona</option>
          </select>
        </FormField>

        <FormField label="Contacto — nombre">
          <input value={form.contacto_nombre} onChange={set('contacto_nombre')} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Contacto — email">
            <input
              type="email"
              value={form.contacto_email}
              onChange={set('contacto_email')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Contacto — teléfono">
            <input
              value={form.contacto_telefono}
              onChange={set('contacto_telefono')}
              className={inputClass}
            />
          </FormField>
        </div>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions submitting={submitting} onCancel={() => navigate('/clientes')} />
      </form>
    </div>
  )
}
