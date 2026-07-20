import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  fecha: '',
  cuenta_origen_id: null,
  cuenta_destino_id: null,
  importe_origen: '',
  importe_destino: '',
  tipo_cambio: '',
  concepto: '',
}

export default function NuevaTransferencia() {
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
      .from('transferencias_entre_cuentas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            fecha: data.fecha ?? '',
            cuenta_origen_id: data.cuenta_origen_id,
            cuenta_destino_id: data.cuenta_destino_id,
            importe_origen: data.importe_origen != null ? String(data.importe_origen) : '',
            importe_destino: data.importe_destino != null ? String(data.importe_destino) : '',
            tipo_cambio: data.tipo_cambio != null ? String(data.tipo_cambio) : '',
            concepto: data.concepto ?? '',
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
          {editando ? 'Editar Transferencia' : 'Nueva Transferencia'}
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

    const importeOrigen = Number(form.importe_origen)
    const importeDestino =
      form.importe_destino === '' ? importeOrigen : Number(form.importe_destino)

    const payload = {
      fecha: form.fecha,
      cuenta_origen_id: form.cuenta_origen_id || null,
      cuenta_destino_id: form.cuenta_destino_id || null,
      importe_origen: importeOrigen,
      importe_destino: importeDestino,
      tipo_cambio: form.tipo_cambio === '' ? null : Number(form.tipo_cambio),
      concepto: form.concepto || null,
    }

    const { error: err } = editando
      ? await supabase.from('transferencias_entre_cuentas').update(payload).eq('id', id)
      : await supabase.from('transferencias_entre_cuentas').insert(payload)

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
        {editando ? 'Editar Transferencia' : 'Nueva Transferencia'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Fecha" required>
          <input
            type="date"
            required
            value={form.fecha}
            onChange={set('fecha')}
            className={inputClass}
          />
        </FormField>

        <FormField label="Cuenta origen" required>
          <CatalogoSelect
            tabla="cuentas_bancarias"
            filtro={{ cliente_id: empresaId }}
            value={form.cuenta_origen_id}
            onChange={(valor) => setForm((f) => ({ ...f, cuenta_origen_id: valor }))}
          />
        </FormField>

        <FormField label="Cuenta destino" required>
          <CatalogoSelect
            tabla="cuentas_bancarias"
            filtro={{ cliente_id: empresaId }}
            value={form.cuenta_destino_id}
            onChange={(valor) => setForm((f) => ({ ...f, cuenta_destino_id: valor }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Importe origen" required>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.importe_origen}
              onChange={set('importe_origen')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Importe destino">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.importe_destino}
              onChange={set('importe_destino')}
              className={inputClass}
              placeholder="Por defecto, igual al importe origen"
            />
          </FormField>
        </div>

        <FormField label="Tipo de cambio">
          <input
            type="number"
            step="0.0001"
            min="0"
            value={form.tipo_cambio}
            onChange={set('tipo_cambio')}
            className={inputClass}
            placeholder="Solo si las cuentas son de distinta moneda"
          />
        </FormField>

        <FormField label="Concepto">
          <input value={form.concepto} onChange={set('concepto')} className={inputClass} />
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
