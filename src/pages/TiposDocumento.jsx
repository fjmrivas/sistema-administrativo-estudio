import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DataTable } from '../components/DataTable'

export default function TiposDocumento() {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('tipos_documento_facturacion')
      .select('codigo, nombre')
      .order('codigo', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        setTipos(data ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy">Tipos de Documento</h2>
        <p className="mt-1 text-sm text-navy/50">
          Catálogo oficial de SUNAT, de solo lectura — no se edita desde la app.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-rojo">Error: {error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-navy/50">Cargando…</p>
      ) : (
        <DataTable
          filas={tipos}
          columnas={['codigo', 'nombre']}
          vacio="No hay tipos de documento cargados."
        />
      )}
    </div>
  )
}
