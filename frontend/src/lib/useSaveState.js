import { useCallback, useRef, useState } from 'react'

/** Tracks a single save action's lifecycle (idle -> saving -> saved -> idle) so a
 * button can show a spinner then a checkmark instead of a static label, without
 * every page re-implementing the same timeout dance. `run` re-throws on failure so
 * callers can still show their own error message/toast. */
export function useSaveState() {
  const [status, setStatus] = useState('idle')
  const timeoutRef = useRef(null)

  const run = useCallback(async (fn) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setStatus('saving')
    try {
      const result = await fn()
      setStatus('saved')
      timeoutRef.current = setTimeout(() => setStatus('idle'), 1800)
      return result
    } catch (err) {
      setStatus('idle')
      throw err
    }
  }, [])

  return { status, saving: status === 'saving', saved: status === 'saved', run }
}
