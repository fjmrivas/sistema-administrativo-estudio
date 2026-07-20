import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'

const inicial = {
  fecha: '',
  tipo: 'Egreso',
  concepto: '',
  monto: '',
  comprobante: '',
  solicitante: '',
  proyecto_id: null,
}

export default function NuevoMovimientoCaja() {
  const navigate = useNavigate()
  const { cajaId, id } = useParams()
  const editando = Boolean(id)
  const { empresaId } = useEmpresa()
  const [form, setForm] = useState(inicial)
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('movimientos_caja_chica')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            fecha: data.fecha ?? '',
            tipo: data.tipo ?? 'Egreso',
            concepto: data.concepto ?? '',
            monto: data.monto != null ? String(data.monto) : '',
            comprobante: data.comprobante ?? '',
            solicitante: data.solicitante ?? '',
            proyecto_id: data.proyecto_id,
          })
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

    const payload = {
      fecha: form.fecha,
      tipo: form.tipo,
      concepto: form.concepto,
      monto: Number(form.monto),
      comprobante: form.comprobante || null,
      solicitante: form.solicitante || null,
      proyecto_id: form.proyecto_id || null,
    }
    if (!editando) payload.caja_chica_id = cajaId

    const { error: err } = editando
      ? await supabase.from('movimientos_caja_chica').update(payload).eq('id', id)
      : await supabase.from('movimientos_caja_chica').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(`/caja-chica/${cajaId}/movimientos`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Movimiento' : 'Nuevo Movimiento'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
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
          <FormField label="Tipo" required>
            <select value={form.tipo} onChange={set('tipo')} className={inputClass}>
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </select>
          </FormField>
        </div>

        <FormField label="Concepto" required>
          <input
            required
            value={form.concepto}
            onChange={set('concepto')}
            className={inputClass}
          />
        </FormField>

        <FormField label="Monto" required>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.monto}
            onChange={set('monto')}
            className={inputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Comprobante">
            <input
              value={form.comprobante}
              onChange={set('comprobante')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Solicitante">
            <input
              value={form.solicitante}
              onChange={set('solicitante')}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Proyecto">
          <CatalogoSelect
            tabla="proyectos"
            filtro={{ cliente_id: empresaId }}
            value={form.proyecto_id}
            onChange={(valor) => setForm((f) => ({ ...f, proyecto_id: valor }))}
          />
        </FormField>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate(`/caja-chica/${cajaId}/movimientos`)}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
