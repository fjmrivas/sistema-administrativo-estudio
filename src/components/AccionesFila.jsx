import { Link } from 'react-router-dom'

export function AccionesFila({ editarTo, onBorrar }) {
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      {editarTo && (
        <Link to={editarTo} className="font-medium text-violeta hover:underline">
          Editar
        </Link>
      )}
      <button type="button" onClick={onBorrar} className="font-medium text-rojo hover:underline">
        Borrar
      </button>
    </div>
  )
}
