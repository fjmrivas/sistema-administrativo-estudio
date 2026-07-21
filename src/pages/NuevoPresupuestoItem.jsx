import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'

const inicial = {
  item_numero: '',
  concepto: '',
  cantidad: '1',
  fecha: '',
  precio_unitario: '0',
  igv: '0',
  incluir_fee: true,
  proveedor_id: null,
  costo_unitario_estimado: '0',
  costo_real: '0',
  seccion_id: null,
}

export default function NuevoPresupuestoItem() {
  const navigate = useNavigate()
  const { presupuestoId, id } = useParams()
  const editando = Boolean(id)
  const { empresaId } = useEmpresa()
  const [form, setForm] = useState(inicial)
  const [cargandoRegistro, setCargandoRegistro] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    let cancelled = false

    if (editando) {
      supabase
        .from('presupuesto_items')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error: err }) => {
          if (cancelled) return
          if (err) setError(err.message)
          if (data) {
            setForm({
              item_numero: data.item_numero != null ? String(data.item_numero) : '',
              concepto: data.concepto ?? '',
              cantidad: data.cantidad != null ? String(data.cantidad) : '1',
              fecha: data.fecha ?? '',
              precio_unitario: data.precio_unitario != null ? String(data.precio_unitario) : '0',
              igv: data.igv != null ? String(data.igv) : '0',
              incluir_fee: data.incluir_fee ?? true,
              proveedor_id: data.proveedor_id,
              costo_unitario_estimado:
                data.costo_unitario_estimado != null ? String(data.costo_unitario_estimado) : '0',
              costo_real: data.costo_real != null ? String(data.costo_real) : '0',
              seccion_id: data.seccion_id,
            })
          }
          setCargandoRegistro(false)
        })
    } else {
      supabase
        .from('presupuesto_items')
        .select('item_numero')
        .eq('presupuesto_id', presupuestoId)
        .order('item_numero', { ascending: false })
        .limit(1)
        .then(({ data, error: err }) => {
          if (cancelled) return
          if (err) setError(err.message)
          const siguiente = (data?.[0]?.item_numero ?? 0) + 1
          setForm((f) => ({ ...f, item_numero: String(siguiente) }))
          setCargandoRegistro(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [editando, id, presupuestoId])

  if (cargandoRegistro) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      item_numero: Number(form.item_numero),
      concepto: form.concepto,
      cantidad: form.cantidad === '' ? 1 : Number(form.cantidad),
      fecha: form.fecha || null,
      precio_unitario: Number(form.precio_unitario),
      igv: form.igv === '' ? 0 : Number(form.igv),
      incluir_fee: form.incluir_fee,
      proveedor_id: form.proveedor_id || null,
      costo_unitario_estimado:
        form.costo_unitario_estimado === '' ? 0 : Number(form.costo_unitario_estimado),
      costo_real: form.costo_real === '' ? 0 : Number(form.costo_real),
      seccion_id: form.seccion_id || null,
    }
    if (!editando) payload.presupuesto_id = presupuestoId

    const { error: err } = editando
      ? await supabase.from('presupuesto_items').update(payload).eq('id', id)
      : await supabase.from('presupuesto_items').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(`/presupuesto/${presupuestoId}/items`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Ítem' : 'Nuevo Ítem'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="N° de ítem" required>
            <input
              type="number"
              required
              value={form.item_numero}
              onChange={set('item_numero')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Fecha">
            <input
              type="date"
              value={form.fecha}
              onChange={set('fecha')}
              className={inputClass}
            />
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

        <FormField label="Sección">
          <CatalogoSelect
            tabla="secciones_presupuesto"
            filtro={{ cliente_id: empresaId }}
            value={form.seccion_id}
            onChange={(valor) => setForm((f) => ({ ...f, seccion_id: valor }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Cantidad">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cantidad}
              onChange={set('cantidad')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Precio unitario" required>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.precio_unitario}
              onChange={set('precio_unitario')}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="IGV">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.igv}
            onChange={set('igv')}
            className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-navy/80">
          <input
            type="checkbox"
            checked={form.incluir_fee}
            onChange={(e) => setForm((f) => ({ ...f, incluir_fee: e.target.checked }))}
            className="h-4 w-4 rounded border-navy/25 text-violeta focus:ring-violeta/30"
          />
          Incluir fee
        </label>

        <FormField label="Proveedor">
          <CatalogoSelect
            tabla="terceros"
            filtro={{ tipo: ['proveedor', 'ambos'] }}
            value={form.proveedor_id}
            onChange={(valor) => setForm((f) => ({ ...f, proveedor_id: valor }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Costo unitario estimado">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costo_unitario_estimado}
              onChange={set('costo_unitario_estimado')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Costo real">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costo_real}
              onChange={set('costo_real')}
              className={inputClass}
            />
          </FormField>
        </div>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate(`/presupuesto/${presupuestoId}/items`)}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
