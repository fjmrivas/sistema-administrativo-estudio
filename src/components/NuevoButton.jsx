import { Link } from 'react-router-dom'

export function NuevoButton({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded-lg bg-violeta px-4 py-2 text-sm font-medium text-white hover:bg-violeta/90"
    >
      {children}
    </Link>
  )
}
