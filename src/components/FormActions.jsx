export function FormActions({ submitting, onCancel, label = 'Guardar' }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-4 py-2 text-sm font-medium text-navy/70 hover:bg-navy/5"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-violeta px-4 py-2 text-sm font-medium text-white hover:bg-violeta/90 disabled:opacity-60"
      >
        {submitting ? 'Guardando…' : label}
      </button>
    </div>
  )
}
