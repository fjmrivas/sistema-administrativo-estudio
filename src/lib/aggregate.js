const CAMPOS_MONTO = ['monto_total', 'monto', 'importe', 'total', 'valor', 'saldo']

export function sumarPosibleCampo(filas, candidatos = CAMPOS_MONTO) {
  if (!filas || filas.length === 0) return null
  for (const campo of candidatos) {
    if (filas.some((fila) => fila[campo] != null)) {
      return filas.reduce((acc, fila) => acc + (Number(fila[campo]) || 0), 0)
    }
  }
  return null
}

export function esCampoMonto(nombreCampo) {
  return /monto|importe|total|valor|saldo|precio/i.test(nombreCampo)
}

export function esCampoFecha(nombreCampo) {
  return /fecha|_at$|date/i.test(nombreCampo)
}
