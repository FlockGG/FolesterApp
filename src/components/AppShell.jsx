import { FileSearch, LoaderCircle, LogOut, MessageCircle, Plus, Search, UserRound, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useDatabase } from '../context/database'
import Avatar from './Avatar'
import { getProfile, saveProfile, searchContent } from '../lib/data'
import { announceNimiqWalletChange, chooseNimiqAddress, onNimiqWalletChange } from '../lib/nimiqHub'
import { onAvatarChange } from '../lib/profileEvents'

function NavItem({ to, icon: Icon, children }) {
  return <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition duration-300 ${isActive ? 'border border-gold/45 bg-gold text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon size={18} strokeWidth={1.8} />{children}</NavLink>
}

export default function AppShell({ children, onCompose }) {
  const { user, signOut } = useAuth()
  const { client } = useDatabase()
  const [walletAddress, setWalletAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [walletError, setWalletError] = useState('')

  useEffect(() => {
    let active = true
    getProfile(client, user.id)
      .then((profile) => { if (active) { setWalletAddress(profile?.nimiq_address || ''); setAvatarUrl(profile?.avatar_url || '') } })
      .catch(() => { if (active) { setWalletAddress(''); setAvatarUrl('') } })
    return () => { active = false }
  }, [client, user.id])

  useEffect(() => onNimiqWalletChange(setWalletAddress), [])
  useEffect(() => onAvatarChange(setAvatarUrl), [])

  async function connectNimiqWallet() {
    setWalletConnecting(true)
    setWalletError('')
    try {
      const address = await chooseNimiqAddress()
      const updatedProfile = await saveProfile(client, { id: user.id, nimiq_address: address })
      setWalletAddress(updatedProfile.nimiq_address || address)
      announceNimiqWalletChange(updatedProfile.nimiq_address || address)
    } catch (error) {
      setWalletError(error?.message || 'Unable to connect your Nimiq wallet.')
    } finally {
      setWalletConnecting(false)
    }
  }

  const shortWalletAddress = walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)}` : ''
  return <div className="app-shell relative z-0 min-h-screen text-slate-100">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video autoPlay loop muted playsInline className="h-full w-full object-cover"><source src="https://vmjgttogusschelcplbp.supabase.co/storage/v1/object/public/public-assets/White%20Waves%20-%20Background_1080p.mp4" type="video/mp4" /></video>
      <div className="absolute inset-0 bg-slate-950/50" />
    </div>
    <aside className="fixed inset-y-5 left-5 z-20 hidden w-64 rounded-2xl border border-slate-800 bg-black p-5 shadow-[0_12px_32px_rgba(15,23,42,0.2)] md:flex md:flex-col">
      <NavLink to="/" className="mb-10 flex items-center gap-2.5 px-2">
        <img src="/folester-profile.png" alt="Folester" className="h-9 w-9 rounded-xl border border-white/20 object-cover" />
        <span className="text-lg font-extrabold tracking-tight text-white">Folester</span>
      </NavLink>
      <nav className="space-y-1">
        <NavItem to="/" icon={MessageCircle}>Feed</NavItem>
        <NavItem to="/callouts" icon={FileSearch}>Callouts</NavItem>
        <NavItem to="/profile" icon={UserRound}>Profile</NavItem>
      </nav>
      <div className="mt-auto border-t border-white/15 pt-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar avatarUrl={avatarUrl} alt="Your profile" className="h-8 w-8 border border-white/20" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/70">{user?.email}</span>
          <button onClick={() => signOut().catch(() => {})} className="icon-button text-white/70 hover:bg-white/10 hover:text-white" title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
    <main className="relative z-10 pb-28 md:ml-[18rem] md:pb-10">
      <header className="sticky top-0 z-10 mx-4 mt-4 flex h-16 items-center gap-3 rounded-2xl border border-slate-800 bg-black px-4 sm:mx-8 sm:px-6 md:mx-10">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 md:hidden"><img src="/folester-profile.png" alt="Folester" className="h-9 w-9 rounded-xl border border-slate-800 object-cover" /><span className="hidden font-extrabold tracking-tight text-white min-[430px]:inline">Folester</span></NavLink>
        <GlobalSearch />
        <button onClick={connectNimiqWallet} disabled={walletConnecting} className="shrink-0 rounded-xl bg-black px-2.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55 sm:px-4" type="button" title={walletError || (walletAddress ? `Connected: ${walletAddress}` : 'Connect your Nimiq wallet')}><Wallet size={16} className="inline text-gold" /><span className="ml-2 hidden sm:inline">{walletConnecting ? 'Connecting…' : walletAddress ? shortWalletAddress : 'Connect Nimiq'}</span><span className="ml-2 sm:hidden">{walletConnecting ? 'Connecting…' : walletAddress ? 'Connected' : 'Connect'}</span></button>
      </header>
      {children}
    </main>
    <nav className="fixed inset-x-4 bottom-4 z-30 flex h-[66px] items-center justify-around rounded-full border border-slate-800 bg-black px-3 shadow-lg shadow-slate-900/30 md:hidden">
      <NavLink to="/" end className={({ isActive }) => `flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-full text-[10px] font-bold transition duration-300 ${isActive ? 'bg-gold text-slate-950' : 'text-white/70'}`}><MessageCircle size={18} strokeWidth={1.8} />Feed</NavLink>
      <NavLink to="/callouts" className={({ isActive }) => `flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-full text-[10px] font-bold transition duration-300 ${isActive ? 'bg-gold text-slate-950' : 'text-white/70'}`}><FileSearch size={18} strokeWidth={1.8} />Callouts</NavLink>
      <NavLink to="/profile" className={({ isActive }) => `flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-full text-[10px] font-bold transition duration-300 ${isActive ? 'bg-gold text-slate-950' : 'text-white/70'}`}><UserRound size={18} strokeWidth={1.8} />Profile</NavLink>
    </nav>
    <button type="button" onClick={onCompose} className="fixed bottom-24 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#c8952d] bg-gold text-[#201605] shadow-[0_12px_28px_rgba(224,177,66,0.35)] transition hover:-translate-y-1 hover:bg-[#e6ba50] md:bottom-7 md:right-8" aria-label="Compose"><Plus size={25} strokeWidth={2.4} /></button>
  </div>
}

function GlobalSearch() {
  const { client } = useDatabase()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ posts: [], callouts: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setOpen(true)
    setError('')
    try {
      setResults(await searchContent(client, query))
    } catch (nextError) {
      setResults({ posts: [], callouts: [] })
      setError(nextError.message || 'Search is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  function selectResult(path) {
    setOpen(false)
    navigate(path)
  }

  const empty = !loading && !error && results.posts.length === 0 && results.callouts.length === 0
  return <div className="relative mx-auto w-full max-w-xl"><form onSubmit={submit}><label className="sr-only" htmlFor="global-search">Search Folester</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} strokeWidth={1.8} /><input id="global-search" className="field !rounded-xl !border-slate-800 !bg-slate-950 !py-2.5 !pl-9 !pr-3 !text-white placeholder:!text-slate-500 text-xs font-medium sm:text-sm" value={query} onChange={(event) => { setQuery(event.target.value); setOpen(false) }} placeholder="Search posts and research" /></div></form>{open && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(32rem,calc(100vh-6rem))] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-xl shadow-black/50">{loading ? <div className="flex items-center gap-2 px-3 py-4 text-xs font-semibold text-slate-400"><LoaderCircle size={15} className="animate-spin" />Searching Folester…</div> : error ? <p className="px-3 py-3 text-xs font-semibold text-red-400">{error}</p> : empty ? <p className="px-3 py-3 text-xs text-slate-400">No posts or callouts matched “{query}”.</p> : <><SearchGroup title="Posts" items={results.posts} onSelect={() => selectResult('/')} render={(item) => <><p className="truncate text-xs font-bold text-white">{item.content}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.profiles?.username || 'Folester member'}{item.coin_tag ? ` · $${item.coin_tag.replace(/^\$/, '')}` : ''}</p></>} /><SearchGroup title="Callouts" items={results.callouts} onSelect={() => selectResult('/callouts')} render={(item) => <><p className="truncate text-xs font-bold text-white">{item.title}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.thesis}</p></>} /></>}</div>}</div>
}

function SearchGroup({ title, items, onSelect, render }) {
  if (items.length === 0) return null
  return <section className="py-1"><p className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{title}</p>{items.map((item) => <button key={item.id} onClick={onSelect} className="block w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10">{render(item)}</button>)}</section>
}
