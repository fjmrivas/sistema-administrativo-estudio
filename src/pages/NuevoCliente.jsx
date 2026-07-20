import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const { id } = useParams()
  const editando = Boolean(id)
  const [form, setForm] = useState(inicial)
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            razon_social: data.razon_social ?? '',
            ruc: data.ruc ?? '',
            tipo: data.tipo ?? 'empresa',
            contacto_nombre: data.contacto_nombre ?? '',
            contacto_email: data.contacto_email ?? '',
            contacto_telefono: data.contacto_telefono ?? '',
          })
        }
        setCargandoRegistro(false)
      })

    return () => {
      cancelled = true
    }
  }, [editando, id])

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      razon_social: form.razon_social,
      ruc: form.ruc || null,
      tipo: form.tipo,
      contacto_nombre: form.contacto_nombre || null,
      contacto_email: form.contacto_email || null,
      contacto_telefono: form.contacto_telefono || null,
    }

    const { error: err } = editando
      ? await supabase.from('clientes').update(payload).eq('id', id)
      : await supabase.from('clientes').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/clientes')
  }

  if (cargandoRegistro) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
      </h2>
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

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/clientes')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
