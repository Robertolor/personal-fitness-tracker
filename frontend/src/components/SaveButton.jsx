import { Check, Loader2 } from 'lucide-react'

/** A button that visually reflects a useSaveState() status - spinner while saving,
 * checkmark + "Guardado" briefly after success - instead of just re-enabling
 * silently or relying on a text line elsewhere on the page. */
export default function SaveButton({ status, disabled, children, savedLabel = 'Guardado', variant = 'solid', className = '', ...props }) {
  const saving = status === 'saving'
  const saved = status === 'saved'
  const variantClass =
    variant === 'outline'
      ? saved
        ? 'border border-emerald-600 text-emerald-400'
        : 'border border-zinc-700 text-zinc-100 hover:bg-zinc-800'
      : saved
        ? 'bg-emerald-500 text-white'
        : 'bg-emerald-600 text-white hover:bg-emerald-500'
  return (
    <button
      type="button"
      disabled={saving || disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      {saving && <Loader2 size={16} className="shrink-0 animate-spin" />}
      {saved && <Check size={16} className="shrink-0" />}
      <span>{saving ? 'Guardando…' : saved ? savedLabel : children}</span>
    </button>
  )
}
