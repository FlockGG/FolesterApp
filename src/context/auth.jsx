import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useDatabase } from './database'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { client } = useDatabase()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setUser(null)

    client.auth.getSession().then(({ data, error }) => {
      if (mounted) {
        setUser(error ? null : data.session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo(() => ({
    user,
    loading,
    signIn: async (email, password) => {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signUp: async (email, password, username) => {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() || null },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      return data
    },
    signOut: async () => {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },
  }), [client, loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
