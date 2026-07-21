import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  tipo: 'proveedor',
  razon_social: '',
  ruc: '',
  email: '',
  telefono: '',
}

export default function NuevoTercero() {
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
      .from('terceros')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            tipo: data.tipo ?? 'proveedor',
            razon_social: data.razon_social ?? '',
            ruc: data.ruc ?? '',
            email: data.email ?? '',
            telefono: data.telefono ?? '',
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
          {editando ? 'Editar Tercero' : 'Nuevo Tercero'}
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

    const payload = {
      tipo: form.tipo,
      razon_social: form.razon_social,
      ruc: form.ruc || null,
      email: form.email || null,
      telefono: form.telefono || null,
    }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('terceros').update(payload).eq('id', id)
      : await supabase.from('terceros').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/terceros')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Tercero' : 'Nuevo Tercero'}
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

        <FormField label="Tipo" required>
          <select value={form.tipo} onChange={set('tipo')} className={inputClass}>
            <option value="proveedor">Proveedor</option>
            <option value="deudor">Cliente Final (deudor)</option>
            <option value="ambos">Ambos</option>
          </select>
        </FormField>

        <FormField label="RUC">
          <input value={form.ruc} onChange={set('ruc')} maxLength={11} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Teléfono">
            <input value={form.telefono} onChange={set('telefono')} className={inputClass} />
          </FormField>
        </div>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/terceros')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
