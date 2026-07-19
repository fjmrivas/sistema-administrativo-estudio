export function sumarCampo(filas, campo) {
  if (!filas || filas.length === 0) return null
  return filas.reduce((acc, fila) => acc + (Number(fila[campo]) || 0), 0)
}

export function esCampoMonto(nombreCampo) {
  return /monto|importe|total|valor|saldo|precio/i.test(nombreCampo)
}

export function esCampoFecha(nombreCampo) {
  return /fecha|_at$|date/i.test(nombreCampo)
}
