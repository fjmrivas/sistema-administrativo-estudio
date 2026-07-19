export const inputClass =
  'w-full rounded-lg border border-navy/15 px-3 py-2 text-navy outline-none focus:border-violeta focus:ring-2 focus:ring-violeta/30'

export function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy/80">
        {label} {required && <span className="text-rojo">*</span>}
      </label>
      {children}
    </div>
  )
}
