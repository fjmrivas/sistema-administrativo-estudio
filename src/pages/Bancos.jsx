import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../context/EmpresaContext'
import { DataTable } from '../components/DataTable'
import { NuevoButton } from '../components/NuevoButton'
import { AccionesFila } from '../components/AccionesFila'
import { SinEmpresa } from '../components/SinEmpresa'

export default function Bancos() {
  const { empresaId, loading: empresaLoading, isStaff, error: empresaError } = useEmpresa()
  const [cuentas, setCuentas] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('cliente_id', empresaId)
      .then(async ({ data: cuentasData, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }

        const cuentasList = cuentasData ?? []
        setCuentas(cuentasList)
        const ids = cuentasList.map((c) => c.id)

        if (ids.length === 0) {
          setDocumentos([])
          setTransferencias([])
          setLoading(false)
          return
        }

        const [resDocumentos, resTransferencias] = await Promise.all([
          supabase.from('documentos_banco').select('*').in('cuenta_bancaria_id', ids),
          supabase
            .from('transferencias_entre_cuentas')
            .select('*')
            .or(`cuenta_origen_id.in.(${ids.join(',')}),cuenta_destino_id.in.(${ids.join(',')})`),
        ])

        if (cancelled) return
        if (resDocumentos.error) setError(resDocumentos.error.message)
        setDocumentos(resDocumentos.data ?? [])
        setTransferencias(resTransferencias.data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [empresaId])

  async function borrarCuenta(id) {
    if (!window.confirm('¿Eliminar esta cuenta bancaria? Esta acción no se puede deshacer.')) return
    const { error: err } = await supabase.from('cuentas_bancarias').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setCuentas((prev) => prev.filter((c) => c.id !== id))
  }

  async function borrarDocumento(id) {
    if (!window.confirm('¿Eliminar este documento de banco? Esta acción no se puede deshacer.'))
      return
    const { error: err } = await supabase.from('documentos_banco').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setDocumentos((prev) => prev.filter((d) => d.id !== id))
  }

  async function borrarTransferencia(id) {
    if (!window.confirm('¿Eliminar esta transferencia? Esta acción no se puede deshacer.')) return
    const { error: err } = await supabase.from('transferencias_entre_cuentas').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setTransferencias((prev) => prev.filter((t) => t.id !== id))
  }

  if (empresaLoading) {
    return <p className="py-8 text-center text-sm text-navy/50">Cargando empresa…</p>
  }

  if (!empresaId) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-navy">Bancos</h2>
        <SinEmpresa isStaff={isStaff} error={empresaError} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-navy">Bancos</h2>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
            Cuentas bancarias
          </h3>
          <NuevoButton to="/bancos/cuenta/nueva">+ Nueva Cuenta</NuevoButton>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
        ) : (
          <DataTable
            filas={cuentas}
            vacio="No hay cuentas bancarias registradas para esta empresa."
            acciones={
              isStaff
                ? (fila) => (
                    <AccionesFila
                      editarTo={`/bancos/cuenta/${fila.id}/editar`}
                      onBorrar={() => borrarCuenta(fila.id)}
                    />
                  )
                : undefined
            }
          />
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
            Documentos de banco
          </h3>
          <NuevoButton to="/bancos/documento/nuevo">+ Nuevo Documento</NuevoButton>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
        ) : (
          <DataTable
            filas={documentos}
            vacio="No hay documentos de banco registrados para esta empresa."
            acciones={
              isStaff
                ? (fila) => (
                    <AccionesFila
                      editarTo={`/bancos/documento/${fila.id}/editar`}
                      onBorrar={() => borrarDocumento(fila.id)}
                    />
                  )
                : undefined
            }
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
            Transferencias entre cuentas
          </h3>
          <NuevoButton to="/bancos/transferencia/nueva">+ Nueva Transferencia</NuevoButton>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
        ) : (
          <DataTable
            filas={transferencias}
            vacio="No hay transferencias registradas para esta empresa."
            acciones={
              isStaff
                ? (fila) => (
                    <AccionesFila
                      editarTo={`/bancos/transferencia/${fila.id}/editar`}
                      onBorrar={() => borrarTransferencia(fila.id)}
                    />
                  )
                : undefined
            }
          />
        )}
      </section>
    </div>
  )
}
