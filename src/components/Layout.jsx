import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { SidebarContent } from './Sidebar'
import { EmpresaSelector } from './EmpresaSelector'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { perfil, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-fondo">
      <Sidebar />

      {menuAbierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-navy shadow-xl">
            <SidebarContent onNavigate={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-navy/10 bg-white px-4 py-3 md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-navy hover:bg-navy/5 md:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <EmpresaSelector />

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-navy/70 sm:inline">
              {perfil?.nombre || perfil?.email || ''}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
