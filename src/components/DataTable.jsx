import { esCampoMonto, esCampoFecha } from '../lib/aggregate'
import { formatoMoneda, formatoFecha } from '../lib/format'

function formatearValor(campo, valor) {
  if (valor == null) return '—'
  if (esCampoFecha(campo)) return formatoFecha(valor)
  if (esCampoMonto(campo)) return formatoMoneda(valor)
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}

function tituloColumna(campo) {
  return campo.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DataTable({
  filas,
  columnas,
  vacio = 'Sin registros.',
  acciones,
  accionesInicio,
  titulos,
  renderizadores,
  onRowClick,
}) {
  if (!filas || filas.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">{vacio}</p>
  }

  const cols = columnas ?? Object.keys(filas[0]).filter((c) => c !== 'id' && c !== 'cliente_id')

  return (
    <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-navy/10 bg-navy/[0.03]">
            {accionesInicio && <th className="whitespace-nowrap px-4 py-3" />}
            {cols.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 font-semibold text-navy/70">
                {titulos?.[col] ?? tituloColumna(col)}
              </th>
            ))}
            {acciones && <th className="whitespace-nowrap px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr
              key={fila.id ?? i}
              onClick={onRowClick ? () => onRowClick(fila) : undefined}
              className={`border-b border-navy/5 last:border-0 hover:bg-navy/[0.02] ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {accionesInicio && (
                <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {accionesInicio(fila)}
                </td>
              )}
              {cols.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-3 text-navy/90">
                  {renderizadores?.[col]
                    ? renderizadores[col](fila[col], fila)
                    : formatearValor(col, fila[col])}
                </td>
              ))}
              {acciones && (
                <td
                  className="whitespace-nowrap px-4 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {acciones(fila)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
