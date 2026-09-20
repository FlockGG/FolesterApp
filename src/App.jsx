import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Coins, Eye, EyeOff, Heart, ImagePlus, LoaderCircle, MessageCircle, MessageSquareText, RefreshCw, Send, Share2, Sparkles, Trash2, UserRound, Wallet, X } from 'lucide-react'
import { Link, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import AppShell from './components/AppShell'
import Avatar from './components/Avatar'
import LeaderboardPage from './components/LeaderboardPage'
import Docs from './components/Docs'
import ConnectionDialog from './components/ConnectionDialog'
import { AuthProvider, useAuth } from './context/auth'
import { DatabaseProvider, useDatabase } from './context/database'
import { deleteCallout, deletePost, followUser, getCallouts, getFollowSummary, getPosts, getProfile, getUserCallouts, getUserPosts, insertCallout, insertComment, insertPost, recordTip, saveProfile, searchByHashtag, toggleLike, unfollowUser } from './lib/data'
import { includesHashtag } from './lib/hashtags'
import { isVideoUrl, uploadAvatar, uploadMedia, validateMediaFile } from './lib/media'
import { announceContentCreated, onContentCreated } from './lib/contentEvents'
import { announceAvatarChange } from './lib/profileEvents'
import { announceNimiqWalletChange, checkoutNimiqPayment, chooseNimiqAddress, onNimiqWalletChange } from './lib/nimiqHub'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function messageFor(error) {
  return error?.message || 'Something went wrong. Please try again.'
}

function Identity({ profile, userId }) {
  const label = profile?.username || 'Folester member'
  return <Link to={`/profile/${userId}`} className="flex min-w-0 items-center gap-2.5 rounded-lg transition hover:opacity-80"><Avatar avatarUrl={profile?.avatar_url} alt={label} /><p className="min-w-0 truncate text-sm font-extrabold">{label}</p></Link>
}

function HashtagText({ text }) {
  return <>{String(text || '').split(/(#[A-Za-z0-9_]+)/g).map((part, index) => part.startsWith('#') ? <Link key={`${part}-${index}`} to={`/search?tag=${encodeURIComponent(part.slice(1))}`} className="font-semibold text-[#b48416] transition hover:text-[#80600c] hover:underline">{part}</Link> : <span key={index}>{part}</span>)}</>
}

function MediaPreview({ url, alt, aspect = 'video', className = '' }) {
  if (!url) return null
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video'
  return <div className={`${aspectClass} overflow-hidden bg-slate-950 ${className}`}>{isVideoUrl(url) ? <video className="h-full w-full object-cover" controls playsInline preload="metadata"><source src={url} /></video> : <img src={url} alt={alt} className="h-full w-full object-cover" />}</div>
}

function DeleteEntityButton({ entity, kind, currentUserId, onDeleted }) {
  const { client } = useDatabase()
  const [deleting, setDeleting] = useState(false)
  if (entity.user_id !== currentUserId) return null

  async function removeEntity() {
    if (!window.confirm('Are you sure you want to delete this?')) return
    setDeleting(true)
    try {
      await (kind === 'post' ? deletePost(client, entity.id, currentUserId) : deleteCallout(client, entity.id, currentUserId))
      onDeleted?.(entity.id)
    } catch (error) {
      window.alert(messageFor(error))
    } finally {
      setDeleting(false)
    }
  }

  return <button type="button" onClick={removeEntity} disabled={deleting} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-45" aria-label={`Delete ${kind}`} title={`Delete ${kind}`}><Trash2 size={15} />{deleting && <span className="sr-only">Deleting</span>}</button>
}

function EmptyState({ icon: Icon, title, body }) {
  return <div className="panel flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center"><span className="mb-3 rounded-full bg-stone-100 p-3 text-muted"><Icon size={21} /></span><h2 className="text-sm font-extrabold">{title}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-muted">{body}</p></div>
}

function FeedSkeleton() {
  return <div className="space-y-3" aria-label="Loading posts" aria-busy="true"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
}

function CalloutSkeleton() {
  return <div className="space-y-3" aria-label="Loading callouts" aria-busy="true"><SkeletonCard detailed /><SkeletonCard detailed /></div>
}

function SkeletonCard({ detailed = false }) {
  return <div className="panel animate-pulse p-4 sm:p-5"><div className="flex items-center justify-between"><span className="h-9 w-32 rounded-full bg-stone-100" /><span className="h-3 w-16 rounded bg-stone-100" /></div>{detailed && <span className="mt-5 block h-5 w-2/3 rounded bg-stone-100" />}<span className="mt-4 block h-3 w-full rounded bg-stone-100" /><span className="mt-2 block h-3 w-5/6 rounded bg-stone-100" /><div className="mt-5 h-11 border-t border-line" /></div>
}

function FeedPage() {
  const { client } = useDatabase()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setPosts(await getPosts(client))
    } catch (error) {
      setLoadError(messageFor(error))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => onContentCreated((kind) => { if (kind === 'post') refresh() }), [refresh])

  return <PageFrame eyebrow="Nimiq social layer" title="The signal feed">
    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold">Latest</h2><button className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</button></div>
      {loading ? <FeedSkeleton /> : loadError ? <LoadFailure message={loadError} onRetry={refresh} /> : posts.length === 0 ? <EmptyState icon={MessageSquareText} title="The feed is quiet" body="Be the first to share a useful observation with the Nimiq community." /> : <div className="space-y-3">{posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} onChange={(updatedPost) => setPosts((current) => current.map((item) => item.id === updatedPost.id ? updatedPost : item))} onDelete={(postId) => setPosts((current) => current.filter((item) => item.id !== postId))} />)}</div>}
    </section>
  </PageFrame>
}

function PostCard({ post, currentUserId, onChange, onDelete }) {
  return <article className="content-card overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-[0_14px_32px_rgba(0,0,0,0.32)]"><div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><Identity profile={post.profiles} userId={post.user_id} /><div className="flex shrink-0 items-center gap-1"><time className="text-xs text-slate-400" dateTime={post.created_at}>{formatDate(post.created_at)}</time><DeleteEntityButton entity={post} kind="post" currentUserId={currentUserId} onDeleted={onDelete} /></div></div>{post.media_url && <MediaPreview url={post.media_url} alt="Post attachment" className="mt-5 rounded-xl" />}<p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-200"><HashtagText text={post.content} /></p>{(post.topic || post.coin_tag) && <div className="mt-5 flex flex-wrap gap-2">{post.topic && <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">{post.topic}</span>}{post.coin_tag && <span className="rounded-md bg-gold/15 px-2 py-1 text-[11px] font-bold text-gold">${post.coin_tag.replace(/^\$/, '')}</span>}</div>}</div><SocialSection entity={post} kind="post" currentUserId={currentUserId} onChange={onChange} /></article>
}

function CalloutsPage() {
  const { client } = useDatabase()
  const { user } = useAuth()
  const [callouts, setCallouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setCallouts(await getCallouts(client))
    } catch (error) {
      setLoadError(messageFor(error))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => onContentCreated((kind) => { if (kind === 'callout') refresh() }), [refresh])

  return <PageFrame eyebrow="Research archive" title="Callouts">
    <section className="mt-2">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold">Research notes</h2><button className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</button></div>
      {loading ? <CalloutSkeleton /> : loadError ? <LoadFailure message={loadError} onRetry={refresh} /> : callouts.length === 0 ? <EmptyState icon={Sparkles} title="No callouts yet" body="Be the first to publish research." /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{callouts.map((callout) => <CalloutCard key={callout.id} callout={callout} currentUserId={user.id} onChange={(updatedCallout) => setCallouts((current) => current.map((item) => item.id === updatedCallout.id ? updatedCallout : item))} onDelete={(calloutId) => setCallouts((current) => current.filter((item) => item.id !== calloutId))} />)}</div>}
    </section>
  </PageFrame>
}

function HashtagSearchPage() {
  const { client } = useDatabase()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const tag = (searchParams.get('tag') || '').replace(/^#/, '').replace(/[^A-Za-z0-9_]/g, '')
  const [results, setResults] = useState({ posts: [], callouts: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!tag) {
      setResults({ posts: [], callouts: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const nextResults = await searchByHashtag(client, tag)
      setResults({
        posts: nextResults.posts.filter((post) => includesHashtag(post.content, tag)),
        callouts: nextResults.callouts.filter((callout) => includesHashtag(callout.title, tag) || includesHashtag(callout.thesis, tag)),
      })
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setLoading(false)
    }
  }, [client, tag])

  useEffect(() => { load() }, [load])

  return <PageFrame eyebrow="Hashtag search" title={tag ? `#${tag}` : 'Search'}>{loading ? <LoadingCard label="Searching posts and callouts…" /> : error ? <LoadFailure message={error} onRetry={load} /> : !tag ? <EmptyState icon={MessageSquareText} title="Choose a hashtag" body="Open a hashtag from a post or callout to see matching content." /> : <><section><h2 className="mb-3 text-sm font-extrabold">Posts</h2>{results.posts.length ? <div className="space-y-3">{results.posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} onChange={(updatedPost) => setResults((current) => ({ ...current, posts: current.posts.map((item) => item.id === updatedPost.id ? updatedPost : item) }))} onDelete={(postId) => setResults((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== postId) }))} />)}</div> : <EmptyState icon={MessageSquareText} title="No posts found" body={`No posts use #${tag} yet.`} />}</section><section className="mt-8"><h2 className="mb-3 text-sm font-extrabold">Callouts</h2>{results.callouts.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.callouts.map((callout) => <CalloutCard key={callout.id} callout={callout} currentUserId={user.id} onChange={(updatedCallout) => setResults((current) => ({ ...current, callouts: current.callouts.map((item) => item.id === updatedCallout.id ? updatedCallout : item) }))} onDelete={(calloutId) => setResults((current) => ({ ...current, callouts: current.callouts.filter((item) => item.id !== calloutId) }))} />)}</div> : <EmptyState icon={Sparkles} title="No callouts found" body={`No callouts use #${tag} yet.`} />}</section></>}</PageFrame>
}

function ComposeModal({ userId, onClose }) {
  const { client } = useDatabase()
  const [kind, setKind] = useState('post')
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [thesis, setThesis] = useState('')
  const [sources, setSources] = useState('')
  const [coinTag, setCoinTag] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const mediaInputRef = useRef(null)

  function chooseMedia(event) {
    const file = event.target.files?.[0]
    try {
      validateMediaFile(file)
      setMediaFile(file || null)
      setError('')
    } catch (nextError) {
      event.target.value = ''
      setError(messageFor(nextError))
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (kind === 'post' && !content.trim()) {
      setError('Write something before publishing.')
      return
    }
    if (kind === 'callout' && (!title.trim() || !thesis.trim())) {
      setError('Add a title and thesis.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const mediaUrl = await uploadMedia(client, userId, mediaFile)
      if (kind === 'post') await insertPost(client, { user_id: userId, content: content.trim(), topic: topic.trim(), coin_tag: coinTag.trim(), media_url: mediaUrl })
      else await insertCallout(client, { user_id: userId, title: title.trim(), thesis: thesis.trim(), sources: sources.trim(), coin_tag: coinTag.trim(), media_url: mediaUrl })
      announceContentCreated(kind)
      onClose()
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = 'field !border-white/15 !bg-white/10 !text-white placeholder:!text-slate-400'
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 px-0 backdrop-blur-sm md:items-center md:px-5"><section role="dialog" aria-modal="true" aria-labelledby="compose-title" className="flex min-h-screen w-full flex-col overflow-y-auto bg-black p-5 text-white md:min-h-0 md:max-w-2xl md:rounded-2xl md:border md:border-white/10 md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Folester</p><h2 id="compose-title" className="mt-1 text-2xl font-bold tracking-tight">Compose</h2></div><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close compose"><X size={20} /></button></div><div className="mt-6 grid grid-cols-2 rounded-xl bg-white/10 p-1"><button type="button" onClick={() => { setKind('post'); setError('') }} className={`min-h-10 rounded-lg text-sm font-bold transition ${kind === 'post' ? 'bg-gold text-slate-950' : 'text-slate-300 hover:text-white'}`}>Post</button><button type="button" onClick={() => { setKind('callout'); setError('') }} className={`min-h-10 rounded-lg text-sm font-bold transition ${kind === 'callout' ? 'bg-gold text-slate-950' : 'text-slate-300 hover:text-white'}`}>Callout</button></div><form onSubmit={submit} className="mt-6 space-y-4">{kind === 'post' ? <><textarea className={`${fieldClass} min-h-40 resize-y leading-6`} aria-label="Post content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} placeholder="Share an update…" /><div className="grid gap-3 sm:grid-cols-2"><input className={fieldClass} value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={80} placeholder="Topic" aria-label="Topic" /><input className={fieldClass} value={coinTag} onChange={(event) => setCoinTag(event.target.value)} maxLength={32} placeholder="Ticker" aria-label="Ticker" /></div></> : <><input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="Title" aria-label="Title" /><textarea className={`${fieldClass} min-h-40 resize-y leading-6`} value={thesis} onChange={(event) => setThesis(event.target.value)} maxLength={10000} placeholder="What’s your thesis?" aria-label="Thesis" /><textarea className={`${fieldClass} min-h-24 resize-y leading-6`} value={sources} onChange={(event) => setSources(event.target.value)} maxLength={10000} placeholder="Sources (optional)" aria-label="Sources" /><input className={`${fieldClass} max-w-xs`} value={coinTag} onChange={(event) => setCoinTag(event.target.value)} maxLength={32} placeholder="Ticker" aria-label="Ticker" /></>}<div><input ref={mediaInputRef} id="compose-media" className="sr-only" type="file" accept="image/*,video/*" onChange={chooseMedia} /><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15" onClick={() => mediaInputRef.current?.click()}><ImagePlus size={17} />{mediaFile ? 'Media attached' : 'Add media'}</button>{mediaFile && <p className="mt-2 text-xs font-semibold text-slate-400">{mediaFile.name}</p>}</div>{error && <p role="alert" className="text-sm font-semibold text-red-400">{error}</p>}<div className="mt-auto flex justify-end gap-2 border-t border-white/10 pt-5"><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose}>Cancel</button><button className="button-primary" disabled={submitting}>{submitting ? 'Publishing…' : kind === 'post' ? 'Post' : 'Publish callout'}</button></div></form></section></div>
}

function CalloutCard({ callout, currentUserId, onChange, onDelete }) {
  const ticker = callout.coin_tag ? `$${callout.coin_tag.replace(/^\$/, '')}` : 'NIM'
  return <article className="content-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-[0_14px_32px_rgba(15,23,42,0.17)]"><div className="relative">{callout.media_url ? <MediaPreview url={callout.media_url} alt={`${ticker} callout media`} aspect="square" /> : <div className="aspect-square bg-[radial-gradient(circle_at_28%_24%,rgba(224,177,66,0.35),transparent_30%),linear-gradient(145deg,#111827,#020617)] p-5"><div className="flex h-full items-end rounded-xl border border-white/10 bg-black/10 p-4"><span className="text-5xl font-black tracking-tighter text-gold">{ticker}</span></div></div>}<span className="absolute left-3 top-3 rounded-lg border border-gold/40 bg-slate-950/90 px-2.5 py-1 text-xs font-extrabold tracking-wide text-gold">{ticker}</span><div className="absolute right-2 top-2"><DeleteEntityButton entity={callout} kind="callout" currentUserId={currentUserId} onDeleted={onDelete} /></div></div><div className="flex flex-1 flex-col p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 text-base font-bold leading-5 tracking-tight text-white"><HashtagText text={callout.title} /></h3><time className="shrink-0 text-[10px] text-slate-400" dateTime={callout.created_at}>{formatDate(callout.created_at)}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}><HashtagText text={callout.thesis} /></p></div><SocialSection entity={callout} kind="callout" currentUserId={currentUserId} onChange={onChange} variant="callout" /></article>
}

function SocialSection({ entity, kind, currentUserId, onChange, variant = 'default' }) {
  const { client } = useDatabase()
  const [liking, setLiking] = useState(false)
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)
  const [error, setError] = useState('')
  const commentFieldRef = useRef(null)
  const likes = entity.likes || []
  const comments = entity.comments || []
  const liked = likes.some((like) => like.user_id === currentUserId)
  const target = kind === 'post' ? { postId: entity.id } : { calloutId: entity.id }
  const recipientAddress = entity.profiles?.nimiq_address || ''
  const isCalloutCard = variant === 'callout'

  async function handleLike() {
    setLiking(true)
    setError('')
    try {
      await toggleLike(client, { userId: currentUserId, liked, ...target })
      onChange({ ...entity, likes: liked ? likes.filter((like) => like.user_id !== currentUserId) : [...likes, { user_id: currentUserId }] })
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setLiking(false)
    }
  }

  async function handleComment(event) {
    event.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    setError('')
    try {
      const newComment = await insertComment(client, { user_id: currentUserId, content: comment.trim(), [kind === 'post' ? 'post_id' : 'callout_id']: entity.id })
      onChange({ ...entity, comments: [...comments, newComment] })
      setComment('')
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setCommenting(false)
    }
  }

  async function handleShare() {
    const shareData = { title: 'Folester', text: kind === 'post' ? entity.content : entity.title, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard.writeText(window.location.href)
    } catch (nextError) {
      if (nextError?.name !== 'AbortError') setError('Could not share this item.')
    }
  }

  return <section className={`border-t px-4 py-3.5 ${isCalloutCard ? 'border-white/10 bg-black' : 'border-slate-800 bg-black sm:px-8'}`}>
    <div className={`flex flex-wrap items-center gap-2 ${isCalloutCard ? '' : 'sm:gap-4'}`}>
      <button onClick={handleLike} disabled={liking} className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition duration-300 disabled:opacity-50 ${liked ? 'bg-rose-500/15 text-rose-500' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} aria-pressed={liked}><Heart size={16} strokeWidth={1.8} fill={liked ? 'currentColor' : 'none'} />{likes.length}</button>
      <button type="button" onClick={() => commentFieldRef.current?.focus()} className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"><MessageCircle size={16} strokeWidth={1.8} />{comments.length}</button>
      <button type="button" onClick={handleShare} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Share" title="Share"><Share2 size={16} /></button>
      {recipientAddress ? <button onClick={() => setTipOpen(true)} className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-[#c8952d] bg-gold px-3 text-xs font-extrabold text-[#201605] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(224,177,66,0.26)] ${isCalloutCard ? 'flex-1' : ''}`} title={isCalloutCard ? 'Buy' : 'Tip'}><Coins size={15} strokeWidth={1.8} />{isCalloutCard && 'Buy'}</button> : <span className={`group relative ${isCalloutCard ? 'flex-1' : ''}`}><button disabled className={`inline-flex min-h-10 min-w-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 text-xs font-extrabold text-slate-400 ${isCalloutCard ? 'w-full' : ''}`} title="Tip unavailable"><Coins size={15} strokeWidth={1.8} />{isCalloutCard && 'Buy'}</button><span className="pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-52 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-[11px] font-semibold leading-4 text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">Creator has not connected a wallet.</span></span>}
    </div>
    {comments.length > 0 && <div className="mt-4 space-y-3 border-t border-white/10 pt-3">{comments.map((item) => <div key={item.id} className="flex gap-2.5"><Link to={`/profile/${item.user_id}`} className="shrink-0 transition hover:opacity-80"><Avatar avatarUrl={item.profiles?.avatar_url} alt={item.profiles?.username || 'Folester member'} /></Link><div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><div className="flex items-center justify-between gap-3"><Link to={`/profile/${item.user_id}`} className="text-xs font-extrabold text-white transition hover:underline">{item.profiles?.username || 'Folester member'}</Link><time className="shrink-0 text-[10px] text-slate-400" dateTime={item.created_at}>{formatDate(item.created_at)}</time></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-300">{item.content}</p></div></div>)}</div>}
    <form onSubmit={handleComment} className="mt-3 flex gap-2"><input ref={commentFieldRef} className="field min-h-11 !border-white/10 !bg-white/10 !py-2 !text-white placeholder:!text-slate-400 text-xs" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Add comment…" aria-label="Add a comment" /><button className="button-secondary shrink-0 !border-white/10 !bg-white/10 !px-3 !py-2 !text-white hover:!bg-white/20" disabled={commenting || !comment.trim()} aria-label="Post comment"><Send size={15} /></button></form>
    {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
    {tipOpen && <TipModal recipientAddress={recipientAddress} recipientName={entity.profiles?.username || 'Folester member'} senderId={currentUserId} receiverId={entity.user_id} onClose={() => setTipOpen(false)} />}
  </section>
}

function TipModal({ recipientAddress, recipientName, senderId, receiverId, onClose }) {
  const { client } = useDatabase()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [launching, setLaunching] = useState(false)
  const [copyNotice, setCopyNotice] = useState('')

  function chooseAmount(value) {
    setAmount(value)
    setError('')
  }

  async function requestPayment(event) {
    event.preventDefault()
    setError('')
    setCopyNotice('')
    setLaunching(true)
    try {
      const paymentResult = await checkoutNimiqPayment({ recipient: recipientAddress, amount })
      // The wallet checkout is authoritative. A leaderboard write must never
      // make a completed payment appear unsuccessful to the sender.
      if (senderId !== receiverId) {
        try {
          const txHash = paymentResult?.transactionHash || paymentResult?.txHash || paymentResult?.hash || null
          await recordTip(client, { sender_id: senderId, receiver_id: receiverId, amount: Number(amount), tx_hash: txHash })
        } catch (recordError) {
          console.warn('Tip payment completed but could not be recorded.', recordError)
        }
      }
      window.alert('Tip sent successfully!')
      onClose()
    } catch (nextError) {
      setError(nextError?.name === 'AbortError' ? 'Tip cancelled.' : messageFor(nextError))
    } finally {
      setLaunching(false)
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(recipientAddress)
      setCopyNotice('Address copied.')
      setError('')
    } catch {
      setError('Could not copy the address. Please copy it manually.')
    }
  }

  return <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-md"><section role="dialog" aria-modal="true" aria-labelledby="tip-title" className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl"><div className="flex items-start justify-between gap-4"><div><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/15 text-gold"><Coins size={20} strokeWidth={1.8} /></span><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Nimiq payment</p><h2 id="tip-title" className="mt-1 text-xl font-bold tracking-tight">Tip {recipientName}</h2><p className="mt-1 text-xs leading-5 text-slate-400">Confirm the amount in your Nimiq wallet.</p></div><button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close tipping flow"><X size={19} strokeWidth={1.8} /></button></div><form onSubmit={requestPayment} className="mt-6"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="tip-amount">Amount in NIM</label><input id="tip-amount" className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-base font-bold text-white placeholder:text-slate-500 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25" inputMode="decimal" value={amount} onChange={(event) => chooseAmount(event.target.value)} placeholder="0.00" autoFocus /><div className="mt-3 grid grid-cols-3 gap-2">{['10', '50', '100'].map((value) => <button key={value} type="button" onClick={() => chooseAmount(value)} className={`min-h-12 rounded-full border px-3 py-2.5 text-sm font-bold transition ${amount === value ? 'border-[#E0B142] bg-[#E0B142] text-black' : 'border-white/15 bg-white/5 text-slate-300 hover:border-[#E0B142] hover:bg-[#E0B142] hover:text-black'}`}>{value}</button>)}</div>{error && <p role="alert" className="mt-3 text-xs font-semibold text-red-400">{error}</p>}<div className="mt-5 border-t border-white/10 pt-4"><button className="button-primary w-full" disabled={launching}>{launching ? 'Opening Nimiq Hub…' : 'Send Tip'}</button><button type="button" onClick={copyAddress} className="mt-3 w-full text-xs font-semibold text-slate-400 transition hover:text-gold">{copyNotice || 'Copy Address manually'}</button><button type="button" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose}>Cancel</button></div></form></section></div>
}

function ProfilePage() {
  const { client } = useDatabase()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nimiqAddress, setNimiqAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [walletUpdating, setWalletUpdating] = useState(false)
  const [notice, setNotice] = useState('')
  const [activityTab, setActivityTab] = useState('posts')
  const [myPosts, setMyPosts] = useState([])
  const [myCallouts, setMyCallouts] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState('')
  const avatarInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const result = await getProfile(client, user.id)
      setProfile(result)
      setUsername(result?.username || '')
      setBio(result?.bio || '')
      setAvatarUrl(result?.avatar_url || '')
      setNimiqAddress(result?.nimiq_address || '')
    } catch (error) {
      setLoadError(messageFor(error))
    } finally {
      setLoading(false)
    }
  }, [client, user.id])

  useEffect(() => { load() }, [load])
  useEffect(() => onNimiqWalletChange((address) => {
    setNimiqAddress(address)
    setProfile((current) => current ? { ...current, nimiq_address: address || null } : current)
  }), [])
  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    setActivityError('')
    try {
      const [posts, callouts] = await Promise.all([getUserPosts(client, user.id), getUserCallouts(client, user.id)])
      setMyPosts(posts)
      setMyCallouts(callouts)
    } catch (error) {
      setActivityError(messageFor(error))
    } finally {
      setActivityLoading(false)
    }
  }, [client, user.id])
  useEffect(() => { loadActivity() }, [loadActivity])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const result = await saveProfile(client, { id: user.id, username: username.trim() || null, bio: bio.trim(), avatar_url: avatarUrl.trim() || null })
      setProfile(result)
      setNotice('Profile saved.')
    } catch (error) {
      setNotice(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setNotice('')
    try {
      const nextAvatarUrl = await uploadAvatar(client, user.id, file)
      const updatedProfile = await saveProfile(client, { id: user.id, avatar_url: nextAvatarUrl })
      setAvatarUrl(updatedProfile.avatar_url || nextAvatarUrl)
      setProfile(updatedProfile)
      announceAvatarChange(updatedProfile.avatar_url || nextAvatarUrl)
      setNotice('Profile image updated.')
    } catch (error) {
      setNotice(messageFor(error))
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  async function connectNimiqWallet() {
    setWalletUpdating(true)
    setNotice('')
    try {
      const address = await chooseNimiqAddress()
      const updatedProfile = await saveProfile(client, { id: user.id, nimiq_address: address })
      setProfile(updatedProfile)
      setNimiqAddress(updatedProfile.nimiq_address || address)
      announceNimiqWalletChange(updatedProfile.nimiq_address || address)
      setNotice('Nimiq wallet connected.')
    } catch (error) {
      setNotice(messageFor(error))
    } finally {
      setWalletUpdating(false)
    }
  }

  async function disconnectNimiqWallet() {
    setWalletUpdating(true)
    setNotice('')
    try {
      const updatedProfile = await saveProfile(client, { id: user.id, nimiq_address: null })
      setProfile(updatedProfile)
      setNimiqAddress('')
      announceNimiqWalletChange('')
      setNotice('Nimiq wallet disconnected.')
    } catch (error) {
      setNotice(messageFor(error))
    } finally {
      setWalletUpdating(false)
    }
  }

  const isProfileBlank = !username && !bio && !avatarUrl && !nimiqAddress
  const shortNimiqAddress = nimiqAddress ? `${nimiqAddress.slice(0, 8)}…${nimiqAddress.slice(-4)}` : ''

  return <PageFrame eyebrow="Your identity" title="Profile">
    {loading ? <LoadingCard label="Loading your profile…" /> : loadError ? <LoadFailure message={loadError} onRetry={load} /> : !profile ? <LoadFailure message="Your profile record is missing. Run supabase/schema.sql in your Supabase SQL Editor, then try again." onRetry={load} /> : <><section className="panel p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-4"><button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full disabled:cursor-wait" aria-label="Change profile image"><Avatar avatarUrl={avatarUrl} alt="Your profile" className="h-24 w-24" /><span className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white backdrop-blur-sm transition-opacity duration-200 ${avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{avatarUploading ? <LoaderCircle size={24} className="animate-spin" /> : <Camera size={24} />}</span></button><div><p className="text-sm font-extrabold">{username || 'Folester member'}</p><p className="text-xs text-muted">{user.email}</p>{bio && <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{bio}</p>}<p className="mt-2 text-xs font-medium text-muted">Tap your photo to change it.</p></div><input ref={avatarInputRef} hidden type="file" accept="image/*" onChange={changeAvatar} /></div>
      {isProfileBlank && <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-line bg-stone-50 px-4 py-3"><span className="rounded-full bg-stone-100 p-2 text-muted"><UserRound size={16} /></span><p className="text-xs leading-5 text-muted">Your profile is ready for its first details. Add a name, bio, or connect your Nimiq wallet.</p></div>}
      <form onSubmit={save} className="max-w-xl space-y-4">
        <div><label className="label" htmlFor="profile-username">Username</label><input id="profile-username" className="field" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={60} placeholder="Username" /></div>
        <div><label className="label" htmlFor="profile-bio">Bio</label><textarea id="profile-bio" className="field min-h-28 resize-y leading-6" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} placeholder="Short bio" /></div>
        <div><p className="label">Nimiq wallet <span className="normal-case tracking-normal text-stone-400">(enables tips)</span></p>{nimiqAddress ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Connected</p><p className="mono mt-1 truncate text-sm font-bold text-emerald-950">{shortNimiqAddress}</p></div><button type="button" onClick={disconnectNimiqWallet} disabled={walletUpdating || saving} className="text-xs font-bold text-emerald-800 underline underline-offset-4 transition hover:text-emerald-950 disabled:opacity-45">{walletUpdating ? 'Disconnecting…' : 'Disconnect'}</button></div> : <button type="button" onClick={connectNimiqWallet} disabled={walletUpdating || saving} className="button-primary w-full sm:w-auto"><Wallet size={16} />{walletUpdating ? 'Connecting wallet…' : 'Connect Nimiq Wallet'}</button>}<p className="mt-1.5 text-xs leading-5 text-muted">Connect through Nimiq Hub to securely use your address for payment requests.</p></div>
        {notice && <p role="status" className={notice === 'Profile saved.' || notice === 'Profile image updated.' || notice.includes('wallet connected') || notice.includes('wallet disconnected') ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-semibold text-red-700'}>{notice}</p>}
        <button className="button-primary" disabled={saving || walletUpdating || avatarUploading}>{saving ? 'Saving…' : 'Save profile'}</button>
      </form>
    </section><section className="mt-8"><div role="tablist" aria-label="Your content" className="flex gap-6 border-b border-line"><button role="tab" aria-selected={activityTab === 'posts'} onClick={() => setActivityTab('posts')} className={`min-h-0 border-b-2 pb-3 text-sm font-bold transition ${activityTab === 'posts' ? 'border-gold text-slate-950' : 'border-transparent text-muted hover:text-ink'}`}>My Posts <span className="ml-1 text-xs">{myPosts.length}</span></button><button role="tab" aria-selected={activityTab === 'callouts'} onClick={() => setActivityTab('callouts')} className={`min-h-0 border-b-2 pb-3 text-sm font-bold transition ${activityTab === 'callouts' ? 'border-gold text-slate-950' : 'border-transparent text-muted hover:text-ink'}`}>My Callouts <span className="ml-1 text-xs">{myCallouts.length}</span></button></div><div className="mt-5">{activityLoading ? <LoadingCard label="Loading your published content…" /> : activityError ? <LoadFailure message={activityError} onRetry={loadActivity} /> : activityTab === 'posts' ? myPosts.length ? <div className="space-y-3">{myPosts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} onChange={(updatedPost) => setMyPosts((items) => items.map((item) => item.id === updatedPost.id ? updatedPost : item))} onDelete={(postId) => setMyPosts((items) => items.filter((item) => item.id !== postId))} />)}</div> : <EmptyState icon={MessageSquareText} title="No posts yet" body="Posts you publish will appear here." /> : myCallouts.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{myCallouts.map((callout) => <CalloutCard key={callout.id} callout={callout} currentUserId={user.id} onChange={(updatedCallout) => setMyCallouts((items) => items.map((item) => item.id === updatedCallout.id ? updatedCallout : item))} onDelete={(calloutId) => setMyCallouts((items) => items.filter((item) => item.id !== calloutId))} />)}</div> : <EmptyState icon={Sparkles} title="No callouts yet" body="Your published research will appear here." />}</div></section></>}
  </PageFrame>
}

function PublicProfilePage() {
  const { userId } = useParams()
  const { client } = useDatabase()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState({ followers: 0, following: 0, isFollowing: false })
  const [posts, setPosts] = useState([])
  const [callouts, setCallouts] = useState([])
  const [tab, setTab] = useState('posts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followUpdating, setFollowUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextProfile, nextSummary, nextPosts, nextCallouts] = await Promise.all([
        getProfile(client, userId),
        getFollowSummary(client, userId, user.id),
        getUserPosts(client, userId),
        getUserCallouts(client, userId),
      ])
      setProfile(nextProfile)
      setSummary(nextSummary)
      setPosts(nextPosts)
      setCallouts(nextCallouts)
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setLoading(false)
    }
  }, [client, user.id, userId])

  useEffect(() => { load() }, [load])

  async function toggleFollow() {
    setFollowUpdating(true)
    try {
      if (summary.isFollowing) await unfollowUser(client, user.id, userId)
      else await followUser(client, user.id, userId)
      setSummary((current) => ({ ...current, isFollowing: !current.isFollowing, followers: current.followers + (current.isFollowing ? -1 : 1) }))
    } catch (nextError) {
      setError(messageFor(nextError))
    } finally {
      setFollowUpdating(false)
    }
  }

  const isOwnProfile = user.id === userId
  const label = profile?.username || 'Folester member'

  return <PageFrame eyebrow="Folester member" title="Profile">{loading ? <LoadingCard label="Loading profile…" /> : error ? <LoadFailure message={error} onRetry={load} /> : !profile ? <LoadFailure message="This profile is unavailable." onRetry={load} /> : <><section className="overflow-hidden rounded-2xl border border-slate-800 bg-black text-white"><div className="h-28 bg-[radial-gradient(circle_at_24%_30%,rgba(224,177,66,0.32),transparent_30%),linear-gradient(120deg,#111827,#020617)]" /><div className="px-5 pb-6 sm:px-7"><div className="flex flex-wrap items-end justify-between gap-4"><Avatar avatarUrl={profile.avatar_url} alt={label} className="-mt-12 h-24 w-24 border-4 border-black" />{!isOwnProfile && <button type="button" onClick={toggleFollow} disabled={followUpdating} className={`min-h-10 rounded-xl px-4 text-sm font-bold transition disabled:opacity-50 ${summary.isFollowing ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15' : 'bg-gold text-slate-950 hover:bg-[#e6ba50]'}`}>{followUpdating ? 'Updating…' : summary.isFollowing ? 'Following' : 'Follow'}</button>}</div><h2 className="mt-4 text-2xl font-bold tracking-tight">{label}</h2>{profile.bio && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}<div className="mt-5 flex gap-5 text-sm"><p><span className="font-bold text-white">{summary.followers}</span> <span className="text-slate-400">Followers</span></p><p><span className="font-bold text-white">{summary.following}</span> <span className="text-slate-400">Following</span></p></div></div></section><section className="mt-8"><div role="tablist" aria-label={`${label}'s content`} className="flex gap-6 border-b border-line"><button role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')} className={`min-h-0 border-b-2 pb-3 text-sm font-bold transition ${tab === 'posts' ? 'border-gold text-slate-950' : 'border-transparent text-muted hover:text-ink'}`}>Posts <span className="ml-1 text-xs">{posts.length}</span></button><button role="tab" aria-selected={tab === 'callouts'} onClick={() => setTab('callouts')} className={`min-h-0 border-b-2 pb-3 text-sm font-bold transition ${tab === 'callouts' ? 'border-gold text-slate-950' : 'border-transparent text-muted hover:text-ink'}`}>Callouts <span className="ml-1 text-xs">{callouts.length}</span></button></div><div className="mt-5">{tab === 'posts' ? posts.length ? <div className="space-y-3">{posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} onChange={(updatedPost) => setPosts((items) => items.map((item) => item.id === updatedPost.id ? updatedPost : item))} onDelete={(postId) => setPosts((items) => items.filter((item) => item.id !== postId))} />)}</div> : <EmptyState icon={MessageSquareText} title="No posts yet" body="Nothing published here yet." /> : callouts.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{callouts.map((callout) => <CalloutCard key={callout.id} callout={callout} currentUserId={user.id} onChange={(updatedCallout) => setCallouts((items) => items.map((item) => item.id === updatedCallout.id ? updatedCallout : item))} onDelete={(calloutId) => setCallouts((items) => items.filter((item) => item.id !== calloutId))} />)}</div> : <EmptyState icon={Sparkles} title="No callouts yet" body="Nothing published here yet." />}</div></section></>}</PageFrame>
}

function LoadingCard({ label }) {
  return <div className="panel flex min-h-40 items-center justify-center gap-2 text-sm font-semibold text-muted"><LoaderCircle size={18} className="animate-spin" />{label}</div>
}

function LoadFailure({ message, onRetry }) {
  return <div className="panel p-5"><p className="text-sm font-bold text-red-700">Couldn’t load this data</p><p className="mt-1 text-sm leading-6 text-muted">{message}</p><button className="button-secondary mt-4" onClick={onRetry}><RefreshCw size={15} />Try again</button></div>
}

function PageFrame({ eyebrow, title, action, children }) {
  return <div className="page-enter mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14 md:px-10"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold tracking-tighter text-white sm:text-5xl">{title}</h1></div>{action}</div>{children}</div>
}

function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setNotice('')
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const { session } = await signUp(email, password, username)
        setNotice(session ? 'Account created. You’re signed in.' : 'Account created. Check your email to confirm it, then sign in.')
      }
    } catch (error) {
      setNotice(messageFor(error))
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="grid min-h-screen bg-slate-50 md:grid-cols-2">
    <section className="relative hidden overflow-hidden md:block">
      <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline aria-hidden="true">
        <source src="https://vmjgttogusschelcplbp.supabase.co/storage/v1/object/public/public-assets/Screen%20Recording%202026-07-19%20144231.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/60 to-blue-950/70" />
      <div className="relative z-10 flex h-full items-center justify-center p-12 text-center">
        <div className="max-w-md text-white">
          <p className="text-3xl font-semibold tracking-tight lg:text-4xl">Folester</p>
          <p className="mt-3 text-3xl font-bold leading-tight tracking-tight lg:text-4xl">Connect with Web3</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Powered by Nimiq engine</p>
        </div>
      </div>
    </section>
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8"><div className="page-enter w-full max-w-sm"><div className="mb-10 flex items-center gap-2.5 md:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/45 bg-gold text-xs font-extrabold text-[#201605]">F</span><span className="text-lg font-extrabold tracking-tight">Folester</span></div><h2 className="text-5xl font-bold tracking-tight text-slate-950">{mode === 'signin' ? 'Welcome' : 'Join Folester'}</h2><form className="mt-8 space-y-4" onSubmit={submit}>{mode === 'signup' && <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-username">Username <span className="normal-case tracking-normal text-stone-400">(optional)</span></label><input id="auth-username" className="field" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={60} placeholder="nimiq_researcher" /></div>}<div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-email">Email</label><input id="auth-email" className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div><div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-password">Password</label><div className="relative"><input id="auth-password" className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} placeholder="At least 6 characters" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex min-h-0 min-w-0 items-center px-3 text-slate-500 hover:text-slate-900" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>{notice && <p role="status" className={notice.includes('created') || notice.includes('Check') ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700'}>{notice}</p>}<button className="button-primary w-full" disabled={submitting}>{submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form><p className="mt-5 text-center text-sm text-muted">{mode === 'signin' ? 'New to Folester?' : 'Already a member?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setNotice('') }} className="font-bold text-[#9a731f] underline decoration-gold/70 underline-offset-4">{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p></div></section>
  </main>
}

function ConnectedApp() {
  const { loading, user } = useAuth()
  const [composeOpen, setComposeOpen] = useState(false)
  if (loading) return <main className="flex min-h-screen items-center justify-center gap-2 bg-canvas text-sm font-semibold text-muted"><LoaderCircle size={18} className="animate-spin" />Checking your session…</main>
  if (!user) return <AuthScreen />
  return <><AppShell onCompose={() => setComposeOpen(true)}><Routes><Route path="/" element={<FeedPage />} /><Route path="/callouts" element={<CalloutsPage />} /><Route path="/leaderboard" element={<LeaderboardPage />} /><Route path="/docs" element={<Docs />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/profile/:userId" element={<PublicProfilePage />} /><Route path="/search" element={<HashtagSearchPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AppShell>{composeOpen && <ComposeModal userId={user.id} onClose={() => setComposeOpen(false)} />}</>
}

function Folester() {
  const { client } = useDatabase()
  return client ? <AuthProvider><ConnectedApp /></AuthProvider> : <ConnectionDialog fullScreen />
}

export default function App() {
  return <DatabaseProvider><Folester /></DatabaseProvider>
}
