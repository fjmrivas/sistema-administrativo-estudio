import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function etiquetaCatalogo(fila) {
  if (!fila) return ''
  return (
    fila.nombre ||
    fila.descripcion ||
    fila.razon_social ||
    fila.codigo ||
    fila.numero ||
    `#${String(fila.id).slice(0, 8)}`
  )
}

export function useCatalogo(tabla, filtro) {
  const [filas, setFilas] = useState([])
  const [loading, setLoading] = useState(true)
  const filtroKey = JSON.stringify(filtro ?? {})

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    let query = supabase.from(tabla).select('*')
    for (const [campo, valor] of Object.entries(filtro ?? {})) {
      query = Array.isArray(valor) ? query.in(campo, valor) : query.eq(campo, valor)
    }

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error(`Error cargando catálogo ${tabla}:`, error)
      setFilas(data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, filtroKey])

  return { filas, loading }
}
