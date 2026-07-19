import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const EmpresaContext = createContext(null)

export function EmpresaProvider({ children }) {
  const { perfil, isStaff } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [empresaId, setEmpresaId] = useState(null)
  const [loading, setLoading] = useState(true)

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

    supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Error cargando empresas:', error)
        const lista = data ?? []
        setEmpresas(lista)
        setEmpresaId((prev) => prev ?? lista[0]?.id ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [perfil, isStaff])

  const value = { empresas, empresaId, setEmpresaId, isStaff, loading }

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext)
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de <EmpresaProvider>')
  return ctx
}
