import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  nombre: '',
  area_id: null,
  responsable_id: null,
  fondo_fijo: '',
  activo: true,
}

export default function NuevaCaja() {
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
      .from('cajas_chicas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            nombre: data.nombre ?? '',
            area_id: data.area_id,
            responsable_id: data.responsable_id,
            fondo_fijo: data.fondo_fijo != null ? String(data.fondo_fijo) : '',
            activo: data.activo ?? true,
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
          {editando ? 'Editar Caja Chica' : 'Nueva Caja Chica'}
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
      nombre: form.nombre,
      area_id: form.area_id || null,
      responsable_id: form.responsable_id || null,
      fondo_fijo: form.fondo_fijo === '' ? 0 : Number(form.fondo_fijo),
      activo: form.activo,
    }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('cajas_chicas').update(payload).eq('id', id)
      : await supabase.from('cajas_chicas').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/caja-chica')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Caja Chica' : 'Nueva Caja Chica'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Nombre" required>
          <input required value={form.nombre} onChange={set('nombre')} className={inputClass} />
        </FormField>

        <FormField label="Área">
          <CatalogoSelect
            tabla="areas"
            value={form.area_id}
            onChange={(valor) => setForm((f) => ({ ...f, area_id: valor }))}
          />
        </FormField>

        <FormField label="Responsable">
          <CatalogoSelect
            tabla="responsables"
            value={form.responsable_id}
            onChange={(valor) => setForm((f) => ({ ...f, responsable_id: valor }))}
          />
        </FormField>

        <FormField label="Fondo fijo">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.fondo_fijo}
            onChange={set('fondo_fijo')}
            className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-navy/80">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            className="h-4 w-4 rounded border-navy/25 text-violeta focus:ring-violeta/30"
          />
          Activa
        </label>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/caja-chica')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
