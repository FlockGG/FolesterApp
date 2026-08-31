import { createContext, useContext, useMemo, useState } from 'react'
import { createSupabaseClient, envConfig, hasValidConfig } from '../lib/supabase'

const DatabaseContext = createContext(null)

export function DatabaseProvider({ children }) {
  const [config, setConfig] = useState(envConfig)
  const [client, setClient] = useState(() => (
    hasValidConfig(envConfig) ? createSupabaseClient(envConfig) : null
  ))

  const value = useMemo(() => ({
    client,
    config,
    connect(nextConfig) {
      const nextClient = createSupabaseClient(nextConfig)
      setConfig(nextConfig)
      setClient(nextClient)
    },
  }), [client, config])

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) throw new Error('useDatabase must be used inside DatabaseProvider')
  return context
}
