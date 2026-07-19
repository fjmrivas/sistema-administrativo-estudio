import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const EmpresaContext = createContext(null)

export function EmpresaProvider({ children }) {
  const { perfil, isStaff } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [empresaId, setEmpresaId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!perfil) return

    if (!isStaff) {
      setEmpresaId(perfil.cliente_id)
      setEmpresas([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          console.error('Error cargando empresas:', err)
          setError(err.message)
        }
        const lista = data ?? []
        setEmpresas(lista)
        setEmpresaId((prev) => prev ?? lista[0]?.id ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [perfil, isStaff])

  const value = { empresas, empresaId, setEmpresaId, isStaff, loading, error }

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext)
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de <EmpresaProvider>')
  return ctx
}
