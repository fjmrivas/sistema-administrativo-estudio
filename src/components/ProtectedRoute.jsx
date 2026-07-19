import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, perfil, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-navy">
        Cargando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!perfil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-fondo px-4 text-center text-navy">
        <p className="font-medium text-rojo">
          Tu cuenta no tiene un perfil asociado en la tabla usuarios.
        </p>
        <p className="text-sm text-navy/60">
          Avisá al estudio para que te den de alta antes de poder ver tus datos.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-2 rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5"
        >
          Salir
        </button>
      </div>
    )
  }

  return children
}
