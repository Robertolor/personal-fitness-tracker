import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const { user, loading, signIn, signUp, isSupabaseConfigured } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName)
        setError('Check your email to confirm your account, then sign in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message ?? 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fitness Tracker</h1>
          <p className="mt-1 text-sm text-zinc-500">Athletic physique · daily check-ins · progressive overload</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-sm text-amber-200">
            Supabase not configured. Copy <code className="text-amber-100">.env.example</code> to <code className="text-amber-100">.env</code> and add your keys.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !isSupabaseConfigured}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-emerald-400 hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
