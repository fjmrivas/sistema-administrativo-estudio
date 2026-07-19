export function nombreEmpresa(empresa) {
  if (!empresa) return ''
  return (
    empresa.razon_social ||
    empresa.nombre_comercial ||
    empresa.nombre ||
    empresa.ruc ||
    `Empresa ${empresa.id}`
  )
}

export function formatoMoneda(valor, moneda = 'PEN') {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return '—'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(numero)
}

export function formatoFecha(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor)
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(fecha)
}
