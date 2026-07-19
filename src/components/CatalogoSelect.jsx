import { useCatalogo, etiquetaCatalogo } from '../lib/catalogo'
import { inputClass } from './FormField'

export function CatalogoSelect({ tabla, filtro, value, onChange, placeholder = 'Sin especificar' }) {
  const { filas, loading } = useCatalogo(tabla, filtro)

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={inputClass}
    >
      <option value="">{loading ? 'Cargando…' : placeholder}</option>
      {filas.map((fila) => (
        <option key={fila.id} value={fila.id}>
          {etiquetaCatalogo(fila)}
        </option>
      ))}
    </select>
  )
}
