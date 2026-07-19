import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'

const inicial = {
  nombre: '',
  codigo: '',
  area_id: null,
  estado: 'planificado',
  fecha_inicio: '',
  fecha_fin: '',
  presupuesto_total: '',
}

export default function NuevoProyecto() {
  const navigate = useNavigate()
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Nuevo Proyecto</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: err } = await supabase.from('proyectos').insert({
      cliente_id: empresaId,
      nombre: form.nombre,
      codigo: form.codigo || null,
      area_id: form.area_id || null,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      presupuesto_total: form.presupuesto_total === '' ? 0 : Number(form.presupuesto_total),
    })

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/proyectos')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold text-navy">Nuevo Proyecto</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
      >
        <FormField label="Nombre" required>
          <input required value={form.nombre} onChange={set('nombre')} className={inputClass} />
        </FormField>

        <FormField label="Código">
          <input value={form.codigo} onChange={set('codigo')} className={inputClass} />
        </FormField>

        <FormField label="Área">
          <CatalogoSelect
            tabla="areas"
            value={form.area_id}
            onChange={(valor) => setForm((f) => ({ ...f, area_id: valor }))}
          />
        </FormField>

        <FormField label="Estado">
          <select value={form.estado} onChange={set('estado')} className={inputClass}>
            <option value="planificado">Planificado</option>
            <option value="en_curso">En curso</option>
            <option value="pausado">Pausado</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha de inicio">
            <input
              type="date"
              value={form.fecha_inicio}
              onChange={set('fecha_inicio')}
              className={inputClass}
            />
          </FormField>
          <FormField label="Fecha de fin">
            <input
              type="date"
              value={form.fecha_fin}
              onChange={set('fecha_fin')}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Presupuesto total">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.presupuesto_total}
            onChange={set('presupuesto_total')}
            className={inputClass}
          />
        </FormField>

        {error && <p className="text-sm text-rojo">{error}</p>}

        <FormActions submitting={submitting} onCancel={() => navigate('/proyectos')} />
      </form>
    </div>
  )
}
