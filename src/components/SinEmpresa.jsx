export function SinEmpresa({ isStaff, error }) {
  return (
    <div className="rounded-xl border border-dashed border-navy/20 bg-white p-10 text-center">
      <p className="font-medium text-rojo">
        {error
          ? 'Error cargando empresas.'
          : isStaff
            ? 'No se encontró ninguna empresa visible para tu usuario.'
            : 'Tu usuario no tiene una empresa asignada.'}
      </p>
      {error && <p className="mt-1 text-sm text-navy/50">{error}</p>}
      {!error && isStaff && (
        <p className="mt-1 text-sm text-navy/50">
          Revisá que existan filas en la tabla clientes y que la política RLS le
          permita leerlas a un usuario staff (cliente_id NULL).
        </p>
      )}
    </div>
  )
}
