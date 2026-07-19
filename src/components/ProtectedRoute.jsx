import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-navy">
        Cargando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return children
}
