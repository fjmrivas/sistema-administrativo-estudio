const COLORES = {
  teal: 'text-teal',
  violeta: 'text-violeta',
  rojo: 'text-rojo',
  navy: 'text-navy',
}

export function KpiCard({ titulo, valor, color = 'navy', nota }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-5">
      <p className="text-sm font-medium text-navy/60">{titulo}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${COLORES[color]}`}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-navy/40">{nota}</p>}
    </div>
  )
}
