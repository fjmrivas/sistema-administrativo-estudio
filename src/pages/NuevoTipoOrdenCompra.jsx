import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'

const inicial = {
  nombre: '',
}

export default function NuevoTipoOrdenCompra() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)
  const [form, setForm] = useState(inicial)
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('tipos_orden_compra')
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

  if (cargandoRegistro) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = { nombre: form.nombre }

    const { error: err } = editando
      ? await supabase.from('tipos_orden_compra').update(payload).eq('id', id)
      : await supabase.from('tipos_orden_compra').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/tipos-orden-compra')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Tipo de Orden de Compra' : 'Nuevo Tipo de Orden de Compra'}
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
          onCancel={() => navigate('/tipos-orden-compra')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
