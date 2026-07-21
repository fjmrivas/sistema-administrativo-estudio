import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  periodo: new Date().getFullYear().toString(),
  numero: '',
  fecha: '',
  fecha_aprobacion: '',
  cod_aprobacion: '',
  tiempo_entrega_dias: '',
  nombre_presupuesto: '',
  ejecutivo_id: null,
  productor_id: null,
  area_id: null,
  moneda: 'PEN',
  tipo_cambio: '',
  tipo_doc_emitir_id: null,
  deudor_id: null,
  proyecto_id: null,
  fee_porcentaje: '0',
  igv_porcentaje: '18',
}

export default function NuevoPresupuesto() {
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
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setForm({
            periodo: data.periodo != null ? String(data.periodo) : '',
            numero: data.numero != null ? String(data.numero) : '',
            fecha: data.fecha ?? '',
            fecha_aprobacion: data.fecha_aprobacion ?? '',
            cod_aprobacion: data.cod_aprobacion ?? '',
            tiempo_entrega_dias:
              data.tiempo_entrega_dias != null ? String(data.tiempo_entrega_dias) : '',
            nombre_presupuesto: data.nombre_presupuesto ?? '',
            ejecutivo_id: data.ejecutivo_id,
            productor_id: data.productor_id,
            area_id: data.area_id,
            moneda: data.moneda ?? 'PEN',
            tipo_cambio: data.tipo_cambio != null ? String(data.tipo_cambio) : '',
            tipo_doc_emitir_id: data.tipo_doc_emitir_id,
            deudor_id: data.deudor_id,
            proyecto_id: data.proyecto_id,
            fee_porcentaje: data.fee_porcentaje != null ? String(data.fee_porcentaje) : '0',
            igv_porcentaje: data.igv_porcentaje != null ? String(data.igv_porcentaje) : '18',
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
          {editando ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
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
      periodo: Number(form.periodo),
      numero: Number(form.numero),
      fecha: form.fecha,
      fecha_aprobacion: form.fecha_aprobacion || null,
      cod_aprobacion: form.cod_aprobacion || null,
      tiempo_entrega_dias: form.tiempo_entrega_dias === '' ? null : Number(form.tiempo_entrega_dias),
      nombre_presupuesto: form.nombre_presupuesto || null,
      ejecutivo_id: form.ejecutivo_id || null,
      productor_id: form.productor_id || null,
      area_id: form.area_id || null,
      moneda: form.moneda,
      tipo_cambio: form.tipo_cambio === '' ? null : Number(form.tipo_cambio),
      tipo_doc_emitir_id: form.tipo_doc_emitir_id || null,
      deudor_id: form.deudor_id || null,
      proyecto_id: form.proyecto_id || null,
      fee_porcentaje: form.fee_porcentaje === '' ? 0 : Number(form.fee_porcentaje),
      igv_porcentaje: form.igv_porcentaje === '' ? 0 : Number(form.igv_porcentaje),
    }
    if (!editando) payload.cliente_id = empresaId

    const { error: err } = editando
      ? await supabase.from('presupuestos').update(payload).eq('id', id)
      : await supabase.from('presupuestos').insert(payload)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/presupuesto')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">
        {editando ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Nombre del presupuesto">
          <input
            value={form.nombre_presupuesto}
            onChange={set('nombre_presupuesto')}
            className={inputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Periodo" required>
            <input
              type="number"
              required
              value={form.periodo}
              onChange={set('periodo')}
              className={inputClass}
              placeholder="2026"
            />
          </FormField>
          <FormField label="Número" required>
            <input
              type="number"
              required
              value={form.numero}
              onChange={set('numero')}
              className={inputClass}
            />
          </FormField>
        </div>

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
          <FormField label="Fecha de aprobación">
            <input
              type="date"
              value={form.fecha_aprobacion}
              onChange={set('fecha_aprobacion')}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Código de aprobación">
            <input
              value={form.cod_aprobacion}
              onChange={set('cod_aprobacion')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Tiempo de entrega (días)">
            <input
              type="number"
              min="0"
              value={form.tiempo_entrega_dias}
              onChange={set('tiempo_entrega_dias')}
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

        <FormField label="Deudor">
          <CatalogoSelect
            tabla="terceros"
            filtro={{ tipo: ['deudor', 'ambos'] }}
            value={form.deudor_id}
            onChange={(valor) => setForm((f) => ({ ...f, deudor_id: valor }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Ejecutivo">
            <CatalogoSelect
              tabla="responsables"
              filtro={{ cliente_id: empresaId }}
              value={form.ejecutivo_id}
              onChange={(valor) => setForm((f) => ({ ...f, ejecutivo_id: valor }))}
            />
          </FormField>
          <FormField label="Productor">
            <CatalogoSelect
              tabla="responsables"
              filtro={{ cliente_id: empresaId }}
              value={form.productor_id}
              onChange={(valor) => setForm((f) => ({ ...f, productor_id: valor }))}
            />
          </FormField>
        </div>

        <FormField label="Área">
          <CatalogoSelect
            tabla="areas"
            filtro={{ cliente_id: empresaId }}
            value={form.area_id}
            onChange={(valor) => setForm((f) => ({ ...f, area_id: valor }))}
          />
        </FormField>

        <FormField label="Tipo de documento a emitir">
          <CatalogoSelect
            tabla="tipos_documento_facturacion"
            value={form.tipo_doc_emitir_id}
            onChange={(valor) => setForm((f) => ({ ...f, tipo_doc_emitir_id: valor }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Moneda">
            <select value={form.moneda} onChange={set('moneda')} className={inputClass}>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </FormField>
          <FormField label="Tipo de cambio">
            <input
              type="number"
              step="0.0001"
              min="0"
              value={form.tipo_cambio}
              onChange={set('tipo_cambio')}
              className={inputClass}
              placeholder="Solo si el proyecto es en otra moneda"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fee (%)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.fee_porcentaje}
              onChange={set('fee_porcentaje')}
              className={inputClass}
            />
          </FormField>
          <FormField label="IGV (%)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.igv_porcentaje}
              onChange={set('igv_porcentaje')}
              className={inputClass}
            />
          </FormField>
        </div>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions
          submitting={submitting}
          onCancel={() => navigate('/presupuesto')}
          label={editando ? 'Guardar cambios' : 'Guardar'}
        />
      </form>
    </div>
  )
}
