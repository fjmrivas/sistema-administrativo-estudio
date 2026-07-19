import { useEmpresa } from '../context/EmpresaContext'
import { nombreEmpresa } from '../lib/format'

export function EmpresaSelector() {
  const { empresas, empresaId, setEmpresaId, isStaff, loading } = useEmpresa()

  if (!isStaff) return null
  if (loading) return <span className="text-sm text-navy/50">Cargando empresas…</span>
  if (empresas.length === 0) return null

  return (
    <select
      value={empresaId ?? ''}
      onChange={(e) => setEmpresaId(e.target.value)}
      className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-navy outline-none focus:border-violeta focus:ring-2 focus:ring-violeta/30"
    >
      {empresas.map((empresa) => (
        <option key={empresa.id} value={empresa.id}>
          {nombreEmpresa(empresa)}
        </option>
      ))}
    </select>
  )
}
