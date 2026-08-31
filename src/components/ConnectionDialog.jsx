import { useState } from 'react'
import { Database, ExternalLink, X } from 'lucide-react'
import { useDatabase } from '../context/database'

export default function ConnectionDialog({ onClose, fullScreen = false }) {
  const { config, connect } = useDatabase()
  const [url, setUrl] = useState(config.url)
  const [anonKey, setAnonKey] = useState(config.anonKey)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      connect({ url: url.trim(), anonKey: anonKey.trim() })
      onClose?.()
    } catch (nextError) {
      setError(nextError.message || 'Unable to create a Supabase connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const form = (
    <div className="panel modal-content w-full max-w-md p-6 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-ink"><Database size={20} /></div>
          <h1 className="text-xl font-extrabold tracking-tight">Connect your database</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted">Folester needs your Supabase project before it can load research or social activity.</p>
        </div>
        {!fullScreen && <button className="icon-button !min-h-9 !min-w-9 !rounded-lg" onClick={onClose} aria-label="Close settings"><X size={19} /></button>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="supabase-url">Project URL</label>
          <input id="supabase-url" className="field" type="url" autoComplete="url" placeholder="https://project.supabase.co" value={url} onChange={(event) => setUrl(event.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="supabase-key">Anon key</label>
          <input id="supabase-key" className="field" type="password" autoComplete="off" placeholder="eyJ..." value={anonKey} onChange={(event) => setAnonKey(event.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="button-primary w-full" disabled={submitting}>{submitting ? 'Connecting…' : 'Connect Supabase'}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-muted">This is held only for the current browser session. For a persistent setup, add <code className="mono text-[11px] text-ink">VITE_SUPABASE_URL</code> and <code className="mono text-[11px] text-ink">VITE_SUPABASE_ANON_KEY</code> to <code className="mono text-[11px] text-ink">.env.local</code>.</p>
      <a className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink underline underline-offset-2" href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noreferrer">Find project API settings <ExternalLink size={12} /></a>
    </div>
  )

  if (fullScreen) return <main className="flex min-h-screen items-center justify-center bg-canvas px-5">{form}</main>
  return <div className="modal-backdrop">{form}</div>
}
