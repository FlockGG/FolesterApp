import { UserRound } from 'lucide-react'

export default function Avatar({ avatarUrl, alt = '', className = 'h-10 w-10' }) {
  if (avatarUrl) return <img src={avatarUrl} alt={alt} className={`${className} shrink-0 rounded-full object-cover`} />
  return <span aria-label={alt || 'Profile avatar'} className={`${className} shrink-0 rounded-full border border-white/10 bg-slate-800 text-slate-400`}><span className="flex h-full w-full items-center justify-center"><UserRound className="h-[45%] w-[45%]" strokeWidth={1.8} /></span></span>
}
