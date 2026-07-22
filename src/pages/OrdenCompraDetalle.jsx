import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { FormField, inputClass } from '../components/FormField'
import { FormActions } from '../components/FormActions'
import { CatalogoSelect } from '../components/CatalogoSelect'
import { SinEmpresa } from '../components/SinEmpresa'
import { DataTable } from '../components/DataTable'
import { useMapaNombres, resolverFilas } from '../lib/relaciones'
import { useCatalogo, etiquetaCatalogo } from '../lib/catalogo'
import { COLOR_ESTADO, ETIQUETA_ESTADO } from '../lib/estadoDocumento'
import { formatoFecha } from '../lib/format'

const hoy = new Date().toISOString().slice(0, 10)

const inicial = {
  presupuesto_id: null,
  proveedor_id: null,
  condicion_pago_id: null,
  tipo_doc_id: null,
  tipo_orden_compra_id: null,
  con_retencion: false,
  observaciones: '',
  fecha: hoy,
}

const itemInicial = {
  presupuesto_item_id: null,
  item: '',
  cantidad: '1',
  precio: '0',
  inafecto: '0',
  retencion: '0',
}

export default function OrdenCompraDetalle() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const editando = Boolean(id)
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const { perfil } = useAuth()
  const itemPreseleccionadoAplicado = useRef(false)

  const [form, setForm] = useState(() =>
    !editando && location.state?.presupuestoId
      ? { ...inicial, presupuesto_id: location.state.presupuestoId }
      : inicial
  )
  const [orden, setOrden] = useState(null)
  const [presupuestoInfo, setPresupuestoInfo] = useState(null)
  const [proveedorInfo, setProveedorInfo] = useState(null)
  const [cargandoRegistro, setCargandoRegistro] = useState(editando)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('cabecera')

  const [items, setItems] = useState([])
  const [presupuestoItems, setPresupuestoItems] = useState([])
  const [cargandoItems, setCargandoItems] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [nuevoItem, setNuevoItem] = useState(itemInicial)
  const [editandoItemId, setEditandoItemId] = useState(null)
  const [errorItem, setErrorItem] = useState(null)
  const [guardandoItem, setGuardandoItem] = useState(false)

  const mapaClientes = useMapaNombres('clientes', 'razon_social', { id: empresaId })
  const mapaProyectos = useMapaNombres('proyectos', 'nombre', { cliente_id: empresaId })
  const mapaUsuarios = useMapaNombres('usuarios', 'nombre')
  const { filas: tiposDocumento } = useCatalogo('tipos_documento_facturacion')

  const tipoDocSeleccionado = tiposDocumento.find((t) => t.id === form.tipo_doc_id)
  const permiteRetencion = tipoDocSeleccionado?.codigo === '02'

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  useEffect(() => {
    if (!editando) return
    let cancelled = false

    supabase
      .from('ordenes_compra')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        if (data) {
          setOrden(data)
          setForm({
            presupuesto_id: data.presupuesto_id,
            proveedor_id: data.proveedor_id,
            condicion_pago_id: data.condicion_pago_id,
            tipo_doc_id: data.tipo_doc_id,
            tipo_orden_compra_id: data.tipo_orden_compra_id,
            con_retencion: data.con_retencion ?? false,
            observaciones: data.observaciones ?? '',
            fecha: data.fecha ?? hoy,
          })
        }
        setCargandoRegistro(false)
      })

    return () => {
      cancelled = true
    }
  }, [editando, id])

  useEffect(() => {
    if (!form.presupuesto_id) {
      setPresupuestoInfo(null)
      return
    }
    let cancelled = false

    supabase
      .from('presupuestos')
      .select('*')
      .eq('id', form.presupuesto_id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setPresupuestoInfo(data ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [form.presupuesto_id])

  useEffect(() => {
    if (!form.proveedor_id) {
      setProveedorInfo(null)
      return
    }
    let cancelled = false

    supabase
      .from('terceros')
      .select('*')
      .eq('id', form.proveedor_id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProveedorInfo(data ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [form.proveedor_id])

  useEffect(() => {
    if (!permiteRetencion && form.con_retencion) {
      setForm((f) => ({ ...f, con_retencion: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permiteRetencion])

  useEffect(() => {
    if (!editando || !form.presupuesto_id) return
    let cancelled = false
    setCargandoItems(true)

    Promise.all([
      supabase.from('orden_compra_items').select('*').eq('orden_compra_id', id).order('numero'),
      supabase
        .from('presupuesto_items')
        .select('*')
        .eq('presupuesto_id', form.presupuesto_id)
        .order('item_numero'),
    ]).then(([resItems, resPresItems]) => {
      if (cancelled) return
      setItems(resItems.data ?? [])
      setPresupuestoItems(resPresItems.data ?? [])
      setCargandoItems(false)
    })

    return () => {
      cancelled = true
    }
  }, [editando, id, form.presupuesto_id])

  useEffect(() => {
    if (!editando) return
    if (itemPreseleccionadoAplicado.current) return
    if (!location.state?.presupuestoItemId) return
    if (presupuestoItems.length === 0) return

    itemPreseleccionadoAplicado.current = true
    elegirItemPresupuesto(location.state.presupuestoItemId)
    setTab('items')
    setAgregando(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando, presupuestoItems, location.state])

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Orden de Compra</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  if (cargandoRegistro) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
  }

  async function handleGrabar(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      proveedor_id: form.proveedor_id || null,
      condicion_pago_id: form.condicion_pago_id || null,
      tipo_doc_id: form.tipo_doc_id || null,
      tipo_orden_compra_id: form.tipo_orden_compra_id || null,
      con_retencion: form.con_retencion,
      observaciones: form.observaciones || null,
      fecha: form.fecha,
      moneda: presupuestoInfo?.moneda ?? 'PEN',
      tipo_cambio: presupuestoInfo?.tipo_cambio ?? null,
    }

    if (editando) {
      const { error: err } = await supabase.from('ordenes_compra').update(payload).eq('id', id)
      setSubmitting(false)
      if (err) {
        setError(err.message)
        return
      }
      setOrden((prev) => (prev ? { ...prev, ...payload } : prev))
      return
    }

    payload.presupuesto_id = form.presupuesto_id
    payload.usuario_creador_id = perfil?.id ?? null

    const { data, error: err } = await supabase
      .from('ordenes_compra')
      .insert(payload)
      .select('id')
      .single()

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(`/ordenes-compra/${data.id}`, {
      state: location.state?.presupuestoItemId
        ? { presupuestoItemId: location.state.presupuestoItemId }
        : undefined,
    })
  }

  async function desaprobar() {
    setError(null)
    const { error: err } = await supabase
      .from('ordenes_compra')
      .update({ estado: 'registro' })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setOrden((prev) => (prev ? { ...prev, estado: 'registro' } : prev))
  }

  async function aprobar() {
    setError(null)
    const { error: err } = await supabase
      .from('ordenes_compra')
      .update({
        estado: 'aprobado',
        fecha_aprobacion: hoy,
        usuario_aprobador_id: perfil?.id ?? null,
      })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setOrden((prev) =>
      prev
        ? { ...prev, estado: 'aprobado', fecha_aprobacion: hoy, usuario_aprobador_id: perfil?.id }
        : prev
    )
  }

  function elegirItemPresupuesto(presupuestoItemId) {
    const item = presupuestoItems.find((pi) => pi.id === presupuestoItemId)
    setNuevoItem((f) => ({
      ...f,
      presupuesto_item_id: presupuestoItemId,
      item: item?.concepto ?? '',
    }))
  }

  function editarItem(fila) {
    setEditandoItemId(fila.id)
    setNuevoItem({
      presupuesto_item_id: fila.presupuesto_item_id,
      item: fila.item ?? '',
      cantidad: String(fila.cantidad ?? '1'),
      precio: String(fila.precio ?? '0'),
      inafecto: String(fila.inafecto ?? '0'),
      retencion: String(fila.retencion ?? '0'),
    })
    setAgregando(true)
  }

  function cancelarItem() {
    setAgregando(false)
    setEditandoItemId(null)
    setNuevoItem(itemInicial)
  }

  async function guardarItem(e) {
    e.preventDefault()
    setErrorItem(null)
    setGuardandoItem(true)

    const campos = {
      presupuesto_item_id: nuevoItem.presupuesto_item_id || null,
      item: nuevoItem.item || null,
      cantidad: nuevoItem.cantidad === '' ? 1 : Number(nuevoItem.cantidad),
      precio: Number(nuevoItem.precio),
      inafecto: nuevoItem.inafecto === '' ? 0 : Number(nuevoItem.inafecto),
      retencion: nuevoItem.retencion === '' ? 0 : Number(nuevoItem.retencion),
    }

    if (editandoItemId) {
      const { data, error: err } = await supabase
        .from('orden_compra_items')
        .update(campos)
        .eq('id', editandoItemId)
        .select()
        .single()

      setGuardandoItem(false)
      if (err) {
        setErrorItem(err.message)
        return
      }
      setItems((prev) => prev.map((it) => (it.id === editandoItemId ? data : it)))
      cancelarItem()
      return
    }

    const siguienteNumero = items.reduce((max, it) => Math.max(max, it.numero ?? 0), 0) + 1

    const { data, error: err } = await supabase
      .from('orden_compra_items')
      .insert({
        orden_compra_id: id,
        numero: siguienteNumero,
        ...campos,
      })
      .select()
      .single()

    setGuardandoItem(false)
    if (err) {
      setErrorItem(err.message)
      return
    }
    setItems((prev) => [...prev, data])
    cancelarItem()
  }

  async function borrarItemLinea(itemId) {
    if (!window.confirm('¿Borrar esta línea del detalle de artículos?')) return
    const { error: err } = await supabase.from('orden_compra_items').delete().eq('id', itemId)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId))
  }

  const clienteNombre = presupuestoInfo ? mapaClientes.get(presupuestoInfo.cliente_id) : null
  const proyectoNombre = presupuestoInfo ? mapaProyectos.get(presupuestoInfo.proyecto_id) : null
  const estado = orden?.estado

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-navy">
          {editando ? `Orden de Compra${orden?.numero != null ? ` #${orden.numero}` : ''}` : 'Nueva Orden de Compra'}
        </h2>
        {estado && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              COLOR_ESTADO[estado] ?? 'bg-navy/10 text-navy'
            }`}
          >
            {ETIQUETA_ESTADO[estado] ?? estado}
          </span>
        )}
      </div>

      {editando && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-navy/60">
          {orden?.fecha_aprobacion && (
            <p>
              Aprobada el{' '}
              <span className="font-medium text-navy">{formatoFecha(orden.fecha_aprobacion)}</span>
              {orden.usuario_aprobador_id && (
                <>
                  {' '}
                  por{' '}
                  <span className="font-medium text-navy">
                    {mapaUsuarios.get(orden.usuario_aprobador_id) ?? '—'}
                  </span>
                </>
              )}
            </p>
          )}
          {isStaff && estado === 'registro' && (
            <button
              type="button"
              onClick={aprobar}
              className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal/90"
            >
              Aprobar
            </button>
          )}
          {isStaff && estado === 'aprobado' && (
            <button
              type="button"
              onClick={desaprobar}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5"
            >
              Desaprobar
            </button>
          )}
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-navy/10">
        <button
          type="button"
          onClick={() => setTab('cabecera')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'cabecera' ? 'border-b-2 border-violeta text-violeta' : 'text-navy/50'
          }`}
        >
          Datos Generales
        </button>
        <button
          type="button"
          onClick={() => editando && setTab('items')}
          disabled={!editando}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'items' ? 'border-b-2 border-violeta text-violeta' : 'text-navy/50'
          } ${!editando ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          Detalle de Artículos
        </button>
      </div>

      {tab === 'cabecera' && (
        <form
          onSubmit={handleGrabar}
          className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
        >
          {!editando && (
            <FormField label="Presupuesto (debe estar aprobado)" required>
              <CatalogoSelect
                tabla="presupuestos"
                filtro={{ cliente_id: empresaId, estado: 'aprobado' }}
                value={form.presupuesto_id}
                onChange={(valor) => setForm((f) => ({ ...f, presupuesto_id: valor }))}
              />
            </FormField>
          )}

          {presupuestoInfo && (
            <div className="rounded-lg bg-navy/5 p-3 text-sm text-navy/70">
              <p>
                Cliente: <span className="font-medium text-navy">{clienteNombre ?? '—'}</span>
              </p>
              <p>
                Proyecto: <span className="font-medium text-navy">{proyectoNombre ?? '—'}</span>
              </p>
              <p>
                Presupuesto:{' '}
                <span className="font-medium text-navy">
                  {presupuestoInfo.nombre_presupuesto ?? '—'}
                </span>
              </p>
              <p>
                Moneda: <span className="font-medium text-navy">{presupuestoInfo.moneda}</span>
                {'  ·  '}
                Tipo de cambio:{' '}
                <span className="font-medium text-navy">{presupuestoInfo.tipo_cambio ?? '—'}</span>
              </p>
            </div>
          )}

          <FormField label="Proveedor" required>
            <CatalogoSelect
              tabla="terceros"
              filtro={{ cliente_id: empresaId, tipo: ['proveedor', 'ambos'] }}
              value={form.proveedor_id}
              onChange={(valor) => setForm((f) => ({ ...f, proveedor_id: valor }))}
            />
          </FormField>

          {proveedorInfo && (
            <div className="rounded-lg bg-navy/5 p-3 text-sm text-navy/70">
              <p>
                RUC: <span className="font-medium text-navy">{proveedorInfo.ruc ?? '—'}</span>
              </p>
              <p>
                Teléfono:{' '}
                <span className="font-medium text-navy">{proveedorInfo.telefono ?? '—'}</span>
              </p>
              <p>
                Dirección:{' '}
                <span className="font-medium text-navy">{proveedorInfo.direccion ?? '—'}</span>
              </p>
            </div>
          )}

          <FormField label="Fecha" required>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={set('fecha')}
              className={inputClass}
            />
          </FormField>

          <FormField label="Forma de pago">
            <CatalogoSelect
              tabla="condiciones_pago"
              value={form.condicion_pago_id}
              onChange={(valor) => setForm((f) => ({ ...f, condicion_pago_id: valor }))}
            />
          </FormField>

          <FormField label="Documento" required>
            <select
              required
              value={form.tipo_doc_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, tipo_doc_id: e.target.value || null }))}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {tiposDocumento.map((t) => (
                <option key={t.id} value={t.id}>
                  {etiquetaCatalogo(t)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Tipo">
            <CatalogoSelect
              tabla="tipos_orden_compra"
              value={form.tipo_orden_compra_id}
              onChange={(valor) => setForm((f) => ({ ...f, tipo_orden_compra_id: valor }))}
            />
          </FormField>

          <label
            className={`flex items-center gap-2 text-sm ${
              permiteRetencion ? 'text-navy/80' : 'text-navy/30'
            }`}
          >
            <input
              type="checkbox"
              checked={form.con_retencion}
              disabled={!permiteRetencion}
              onChange={(e) => setForm((f) => ({ ...f, con_retencion: e.target.checked }))}
              className="h-4 w-4 rounded border-navy/25 text-violeta focus:ring-violeta/30 disabled:opacity-50"
            />
            Con Retención
            {!permiteRetencion && (
              <span className="text-xs">(solo para Recibo por Honorarios)</span>
            )}
          </label>

          <FormField label="Observaciones">
            <textarea
              value={form.observaciones}
              onChange={set('observaciones')}
              rows={3}
              className={inputClass}
            />
          </FormField>

          {error && <p className="text-sm text-rojo">{error}</p>}

          <FormActions
            submitting={submitting}
            onCancel={() => navigate('/ordenes-compra')}
            label="Grabar"
          />
        </form>
      )}

      {tab === 'items' && editando && (
        <div>
          {estado === 'registro' && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => (agregando ? cancelarItem() : setAgregando(true))}
                className="rounded-lg bg-violeta px-4 py-2 text-sm font-medium text-white hover:bg-violeta/90"
              >
                {agregando ? 'Cancelar' : '+ Agregar'}
              </button>
            </div>
          )}

          {agregando && estado === 'registro' && (
            <form
              onSubmit={guardarItem}
              className="mb-6 flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-6"
            >
              <FormField label="Línea del presupuesto" required>
                <select
                  required
                  value={nuevoItem.presupuesto_item_id ?? ''}
                  onChange={(e) => elegirItemPresupuesto(e.target.value || null)}
                  className={inputClass}
                >
                  <option value="">Seleccionar…</option>
                  {presupuestoItems.map((pi) => (
                    <option key={pi.id} value={pi.id}>
                      #{pi.item_numero} — {pi.concepto}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Ítem" required>
                <input
                  required
                  value={nuevoItem.item}
                  onChange={(e) => setNuevoItem((f) => ({ ...f, item: e.target.value }))}
                  className={inputClass}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cantidad">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem((f) => ({ ...f, cantidad: e.target.value }))}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Precio" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={nuevoItem.precio}
                    onChange={(e) => setNuevoItem((f) => ({ ...f, precio: e.target.value }))}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Inafecto">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoItem.inafecto}
                    onChange={(e) => setNuevoItem((f) => ({ ...f, inafecto: e.target.value }))}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Retención">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoItem.retencion}
                    onChange={(e) => setNuevoItem((f) => ({ ...f, retencion: e.target.value }))}
                    className={inputClass}
                  />
                </FormField>
              </div>

              {errorItem && <p className="text-sm text-rojo">{errorItem}</p>}

              <FormActions
                submitting={guardandoItem}
                onCancel={cancelarItem}
                label={editandoItemId ? 'Guardar cambios' : 'Guardar línea'}
              />
            </form>
          )}

          {cargandoItems ? (
            <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
          ) : (
            <DataTable
              filas={resolverFilas(items, [], ['orden_compra_id', 'presupuesto_item_id'])}
              vacio="No hay artículos agregados a esta orden de compra."
              acciones={
                isStaff && estado === 'registro'
                  ? (fila) => (
                      <div className="flex items-center justify-end gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => editarItem(fila)}
                          className="font-medium text-violeta hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => borrarItemLinea(fila.id)}
                          className="font-medium text-rojo hover:underline"
                        >
                          Borrar
                        </button>
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
