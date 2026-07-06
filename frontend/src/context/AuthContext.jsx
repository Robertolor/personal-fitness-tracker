import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedUserData } from '../lib/seed'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  const loadSettings = useCallback(async (userId) => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    setSettings(data)
    return data
  }, [])

  const refreshSettings = useCallback(async () => {
    if (user?.id) await loadSettings(user.id)
  }, [user?.id, loadSettings])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        seedUserData(s.user.id)
          .then(() => loadSettings(s.user.id))
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        seedUserData(s.user.id).then(() => loadSettings(s.user.id))
      } else {
        setSettings(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadSettings])

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      await seedUserData(data.user.id)
      await loadSettings(data.user.id)
    }
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        settings,
        refreshSettings,
        signUp,
        signIn,
        signOut,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
