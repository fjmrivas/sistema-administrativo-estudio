import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const GRUPOS = [
  {
    titulo: 'General',
    items: [
      { to: '/', label: 'Inicio', end: true },
      { to: '/proyectos', label: 'Proyectos' },
      { to: '/clientes', label: 'Clientes' },
    ],
  },
  {
    titulo: 'Tesorería',
    items: [
      { to: '/cuentas-por-cobrar', label: 'Cuentas por Cobrar' },
      { to: '/cuentas-por-pagar', label: 'Cuentas por Pagar' },
      { to: '/bancos', label: 'Bancos' },
      { to: '/caja-chica', label: 'Caja Chica' },
    ],
  },
  {
    titulo: 'Planeamiento',
    items: [
      { to: '/presupuesto', label: 'Presupuesto' },
      { to: '/ordenes-compra', label: 'Órdenes de Compra' },
    ],
  },
  {
    titulo: 'Cumplimiento SUNAT',
    items: [
      { to: '/libros-electronicos', label: 'Libros Electrónicos' },
      { to: '/pdt', label: 'PDT' },
    ],
  },
  {
    titulo: 'Maestros',
    items: [
      { to: '/terceros', label: 'Terceros' },
      { to: '/ejecutivos', label: 'Ejecutivos' },
      { to: '/productores', label: 'Productores' },
      { to: '/areas', label: 'Áreas' },
      { to: '/secciones-presupuesto', label: 'Secciones de Presupuesto' },
      { to: '/tipos-documento', label: 'Tipos de Documento' },
      { to: '/tipos-orden-compra', label: 'Tipos de Orden de Compra' },
    ],
  },
]

function NavGroup({ titulo, items, onNavigate, abierto, onToggle }) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/60"
      >
        {titulo}
        <span className={`transition-transform ${abierto ? 'rotate-90' : ''}`}>›</span>
      </button>
      {abierto && (
        <ul className="mb-4 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-violeta text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SidebarContent({ onNavigate }) {
  const [abiertos, setAbiertos] = useState(() =>
    Object.fromEntries(GRUPOS.map((grupo) => [grupo.titulo, true]))
  )

  function toggleGrupo(titulo) {
    setAbiertos((prev) => ({ ...prev, [titulo]: !prev[titulo] }))
  }

  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 py-6">
      <div className="mb-8 px-3">
        <h1 className="font-display text-lg font-semibold text-white">Estudio Contable</h1>
      </div>
      {GRUPOS.map((grupo) => (
        <NavGroup
          key={grupo.titulo}
          {...grupo}
          onNavigate={onNavigate}
          abierto={abiertos[grupo.titulo] ?? true}
          onToggle={() => toggleGrupo(grupo.titulo)}
        />
      ))}
    </nav>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-navy md:block">
      <SidebarContent />
    </aside>
  )
}
