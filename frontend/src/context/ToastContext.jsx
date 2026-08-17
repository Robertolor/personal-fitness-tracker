import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'

const ToastContext = createContext(null)

/** Minimal, dependency-free toast stack - a few save confirmations a day don't
 * justify pulling in a whole toast library. Fixed at the top so it's visible
 * regardless of scroll position, auto-dismisses, stacks if more than one fires. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((text, variant = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, text, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur ${
              t.variant === 'error'
                ? 'border-red-800 bg-red-950/90 text-red-200'
                : 'border-emerald-700 bg-emerald-950/90 text-emerald-200'
            }`}
          >
            {t.variant === 'error' ? <AlertCircle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0" />}
            <span className="truncate">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
