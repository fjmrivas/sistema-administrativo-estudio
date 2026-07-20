import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  banco_id: null,
  nro_cuenta: '',
  moneda: 'PEN',
  tipo_cuenta: 'corriente',
  activo: true,
}

export default function NuevaCuentaBancaria() {
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
      .from('cuentas_bancarias')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            banco_id: data.banco_id,
            nro_cuenta: data.nro_cuenta ?? '',
            moneda: data.moneda ?? 'PEN',
            tipo_cuenta: data.tipo_cuenta ?? 'corriente',
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
          {editando ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
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
      banco_id: form.banco_id || null,
      nro_cuenta: form.nro_cuenta,
      moneda: form.moneda,
      tipo_cuenta: form.tipo_cuenta,
      activo: form.activo,
    }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('cuentas_bancarias').update(payload).eq('id', id)
      : await supabase.from('cuentas_bancarias').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/bancos')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Banco">
          <CatalogoSelect
            tabla="bancos"
            value={form.banco_id}
            onChange={(valor) => setForm((f) => ({ ...f, banco_id: valor }))}
          />
        </FormField>

        <FormField label="Número de cuenta" required>
          <input
            required
            value={form.nro_cuenta}
            onChange={set('nro_cuenta')}
            className={inputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Moneda">
            <select value={form.moneda} onChange={set('moneda')} className={inputClass}>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </FormField>
          <FormField label="Tipo de cuenta">
            <select value={form.tipo_cuenta} onChange={set('tipo_cuenta')} className={inputClass}>
              <option value="corriente">Corriente</option>
              <option value="ahorros">Ahorros</option>
              <option value="detracciones">Detracciones</option>
            </select>
          </FormField>
        </div>

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
          onCancel={() => navigate('/bancos')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
