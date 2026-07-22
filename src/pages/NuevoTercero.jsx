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
  direccion: '',
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
  const [consultandoRuc, setConsultandoRuc] = useState(false)
  const [errorRuc, setErrorRuc] = useState(null)
  const [rucInfo, setRucInfo] = useState(null)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const rucValido = /^\d{11}$/.test(form.ruc)

  async function consultarRuc() {
    setErrorRuc(null)
    setRucInfo(null)
    setConsultandoRuc(true)

    const { data, error: err } = await supabase.functions.invoke('consultar-ruc', {
      body: { ruc: form.ruc },
    })

    setConsultandoRuc(false)
    if (err) {
      setErrorRuc(err.message)
      return
    }

    setForm((f) => ({
      ...f,
      razon_social: data?.razon_social || f.razon_social,
      direccion: data?.direccion || f.direccion,
    }))
    setRucInfo({ estado: data?.estado ?? null, condicion: data?.condicion ?? null })
  }

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
            direccion: data.direccion ?? '',
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
      direccion: form.direccion || null,
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
          <div className="flex gap-2">
            <input
              value={form.ruc}
              onChange={set('ruc')}
              maxLength={11}
              className={inputClass}
            />
            <button
              type="button"
              onClick={consultarRuc}
              disabled={!rucValido || consultandoRuc}
              className="shrink-0 rounded-lg bg-violeta px-4 py-2 text-sm font-medium text-white hover:bg-violeta/90 disabled:opacity-50"
            >
              {consultandoRuc ? 'Consultando…' : 'Consultar RUC'}
            </button>
          </div>
        </FormField>

        {errorRuc && <p className="text-sm text-rojo">{errorRuc}</p>}

        {rucInfo && (
          <div className="rounded-lg bg-navy/5 p-3 text-sm text-navy/70">
            <p>
              Estado / Condición:{' '}
              <span className="font-medium text-navy">
                {rucInfo.estado ?? '—'} / {rucInfo.condicion ?? '—'}
              </span>
            </p>
          </div>
        )}

        <FormField label="Dirección">
          <input
            value={form.direccion}
            onChange={set('direccion')}
            className={inputClass}
          />
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
