import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  cuenta_bancaria_id: null,
  tercero_id: null,
  tipo: 'Depósito',
  numero: '',
  fecha: '',
  moneda: 'PEN',
  importe: '',
}

export default function NuevoDocumentoBanco() {
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
      .from('documentos_banco')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            cuenta_bancaria_id: data.cuenta_bancaria_id,
            tercero_id: data.tercero_id,
            tipo: data.tipo ?? 'Depósito',
            numero: data.numero ?? '',
            fecha: data.fecha ?? '',
            moneda: data.moneda ?? 'PEN',
            importe: data.importe != null ? String(data.importe) : '',
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
          {editando ? 'Editar Documento de Banco' : 'Nuevo Documento de Banco'}
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
      cuenta_bancaria_id: form.cuenta_bancaria_id || null,
      tercero_id: form.tercero_id || null,
      tipo: form.tipo,
      numero: form.numero || null,
      fecha: form.fecha,
      moneda: form.moneda,
      importe: Number(form.importe),
    }

    const { error: err } = editando
      ? await supabase.from('documentos_banco').update(payload).eq('id', id)
      : await supabase.from('documentos_banco').insert(payload)

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
        {editando ? 'Editar Documento de Banco' : 'Nuevo Documento de Banco'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Cuenta bancaria" required>
          <CatalogoSelect
            tabla="cuentas_bancarias"
            filtro={{ cliente_id: empresaId }}
            value={form.cuenta_bancaria_id}
            onChange={(valor) => setForm((f) => ({ ...f, cuenta_bancaria_id: valor }))}
          />
        </FormField>

        <FormField label="Tercero">
          <CatalogoSelect
            tabla="terceros"
            value={form.tercero_id}
            onChange={(valor) => setForm((f) => ({ ...f, tercero_id: valor }))}
          />
        </FormField>

        <FormField label="Tipo de documento">
          <select value={form.tipo} onChange={set('tipo')} className={inputClass}>
            <option value="Depósito">Depósito</option>
            <option value="Cheque">Cheque</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Nota de Abono">Nota de Abono</option>
            <option value="Nota de Cargo">Nota de Cargo</option>
          </select>
        </FormField>

        <FormField label="Número">
          <input value={form.numero} onChange={set('numero')} className={inputClass} />
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

        <FormField label="Importe" required>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.importe}
            onChange={set('importe')}
            className={inputClass}
          />
        </FormField>

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
