import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  nombre: '',
}

export default function NuevaSeccionPresupuesto() {
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
      .from('secciones_presupuesto')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({ nombre: data.nombre ?? '' })
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
          {editando ? 'Editar Sección' : 'Nueva Sección'}
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

    const payload = { nombre: form.nombre }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('secciones_presupuesto').update(payload).eq('id', id)
      : await supabase.from('secciones_presupuesto').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/secciones-presupuesto')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Sección' : 'Nueva Sección'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Nombre" required>
          <input required value={form.nombre} onChange={set('nombre')} className={inputClass} />
        </FormField>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/secciones-presupuesto')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
