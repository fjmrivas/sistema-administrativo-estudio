import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useMapaNombres(tabla, campoEtiqueta, filtro) {
  const [mapa, setMapa] = useState(new Map())
  const filtroKey = JSON.stringify(filtro ?? {})

  useEffect(() => {
    let cancelled = false

    let query = supabase.from(tabla).select(`id, ${campoEtiqueta}`)
    for (const [campo, valor] of Object.entries(filtro ?? {})) {
      query = Array.isArray(valor) ? query.in(campo, valor) : query.eq(campo, valor)
    }

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error(`Error cargando ${tabla}:`, error)
        return
      }
      setMapa(new Map((data ?? []).map((fila) => [fila.id, fila[campoEtiqueta]])))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, campoEtiqueta, filtroKey])

  return mapa
}

export function resolverFilas(filas, resoluciones, camposOcultar = []) {
  return filas.map((fila) => {
    const nueva = { ...fila }
    for (const { campoId, campoDestino, mapa } of resoluciones) {
      const valor = nueva[campoId]
      delete nueva[campoId]
      nueva[campoDestino] = valor != null ? (mapa.get(valor) ?? null) : null
    }
    for (const campo of camposOcultar) {
      delete nueva[campo]
    }
    return nueva
  })
}
