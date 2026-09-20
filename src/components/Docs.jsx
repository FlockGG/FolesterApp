import { BookOpen, Database, ExternalLink, Layers3, Terminal, Wallet } from 'lucide-react'

const sections = [
  ['overview', '01', 'Platform overview'],
  ['architecture', '02', 'Technical architecture'],
  ['nimiq-hub', '03', 'Nimiq Hub protocol'],
  ['security', '04', 'Schema and RLS'],
  ['development', '05', 'Local development'],
]

const hubExample = `import HubApi from '@nimiq/hub-api'

const hub = new HubApi('https://hub.nimiq.com')

export async function processNimiqTip(recipientAddress, amountInLuna) {
  return hub.checkout({
    appName: 'Folester Intelligence',
    recipient: recipientAddress,
    value: amountInLuna,
    fee: 0,
  })
}`

const rlsExample = `ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tips are visible to everyone"
  ON public.tips FOR SELECT
  USING (true);

CREATE POLICY "Users can record their own tips"
  ON public.tips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);`

const setupExample = `git clone https://github.com/FlockGG/FolesterApp.git
cd FolesterApp
npm install
npm run dev`

function CodeBlock({ language, children }) {
  return <div className="overflow-hidden rounded-xl border border-slate-800 bg-black"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-2"><span className="mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{language}</span><span className="mono text-[10px] text-slate-600">Folester</span></div><pre className="overflow-x-auto p-4"><code className="mono text-xs leading-6 text-slate-200">{children}</code></pre></div>
}

function DocumentationSection({ id, number, icon: Icon, title, children }) {
  return <section id={id} className="scroll-mt-28 border-b border-slate-800 pb-12 pt-1 last:border-0" aria-labelledby={`${id}-title`}><div className="mb-6 flex items-center gap-3"><span className="mono flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-[11px] font-bold text-gold">{number}</span><Icon size={18} className="text-slate-400" /><h2 id={`${id}-title`} className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2></div>{children}</section>
}

export default function Docs() {
  return <div className="page-enter mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 md:px-10"><div className="mb-10 border-b border-slate-800 pb-8"><p className="mono text-xs font-bold uppercase tracking-[0.18em] text-gold">Folester technical documentation</p><h1 className="mt-3 text-4xl font-semibold tracking-tighter text-white sm:text-5xl">System reference</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Architecture, protocol flows, data security, and local setup for the Nimiq intelligence network.</p></div><div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12"><aside className="mb-8 lg:mb-0"><nav className="rounded-2xl border border-slate-800 bg-black p-3 lg:sticky lg:top-24" aria-label="Documentation sections"><p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">On this page</p><div className="space-y-1">{sections.map(([id, number, label]) => <a key={id} href={`#${id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"><span className="mono text-[10px] text-gold/80">{number}</span>{label}</a>)}</div></nav></aside><article className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200 shadow-[0_14px_32px_rgba(0,0,0,0.24)] sm:p-8"><DocumentationSection id="overview" number="01" icon={BookOpen} title="Platform Overview & System Specification"><div className="space-y-5 text-sm leading-7 text-slate-300"><p><strong className="text-white">Core philosophy.</strong> Folester is a high-signal Web3 intelligence feed for market researchers and analysts operating in the Nimiq ecosystem. The interface prioritizes verifiable context, concise thesis formation, and durable research over the velocity of unstructured discussion.</p><p><strong className="text-white">Solution design.</strong> Structured Alpha Callouts replace free-form market threads with a title, thesis, sources, ticker context, and timestamp. Non-custodial NIM microtipping is available directly in the social timeline, allowing readers to reward useful research without placing funds in Folester custody.</p><p><strong className="text-white">Target audience.</strong> The platform is designed for crypto analysts, liquidity providers, and decentralized community researchers who need a focused place to publish, assess, and support Nimiq-native market intelligence.</p></div></DocumentationSection><DocumentationSection id="architecture" number="02" icon={Layers3} title="Technical Architecture"><div className="grid gap-3 sm:grid-cols-2"><ArchitectureCard label="Frontend" value="React 19, Vite, Tailwind CSS, Lucide" detail="Single-page UI with React Router routes, Vite production builds, utility-first styling, and accessible SVG icons." /><ArchitectureCard label="Backend & database" value="Supabase PostgreSQL" detail="Public content and social state are stored in Supabase with row-level security policies applied to every application table." /><ArchitectureCard label="Blockchain layer" value="Nimiq Hub API" detail="The client asks the official Hub window to create and sign transactions. Folester never receives wallet credentials or private keys." /><ArchitectureCard label="Market data" value="CoinGecko Simple Price API" detail="The NIM ticker polls asynchronously every 60 seconds for USD price and 24-hour change, with a safe unavailable state." /></div></DocumentationSection><DocumentationSection id="nimiq-hub" number="03" icon={Wallet} title="Nimiq Hub Protocol Integration"><p className="text-sm leading-7 text-slate-300">Tips are initiated on an individual post or callout. The payment request leaves the application boundary before the user inspects and authorizes it in Nimiq Hub.</p><ol className="mt-5 space-y-3 border-l border-slate-800 pl-5 text-sm leading-6 text-slate-300"><li><strong className="text-white">Client trigger.</strong> A reader selects a tip action for a callout or profile with a connected Nimiq address.</li><li><strong className="text-white">Hub request.</strong> Folester opens the official Nimiq Hub checkout client with recipient and value in Luna.</li><li><strong className="text-white">User authorization.</strong> The user inspects and signs directly with their Nimiq credentials or compatible wallet device.</li><li><strong className="text-white">Broadcast result.</strong> Hub resolves the checkout after a successful wallet flow and returns its transaction result.</li><li><strong className="text-white">Ledger record.</strong> Folester records sender, receiver, amount, and the available transaction hash for leaderboard aggregation. The payment itself remains non-custodial.</li></ol><div className="mt-6"><CodeBlock language="javascript">{hubExample}</CodeBlock></div></DocumentationSection><DocumentationSection id="security" number="04" icon={Database} title="Database Schema & Row Level Security"><div className="space-y-4 text-sm leading-7 text-slate-300"><p><strong className="text-white">Profiles</strong> stores public identity fields, an optional Nimiq address, avatar reference, and bio. <strong className="text-white">Callouts</strong> stores structured research theses, tickers, source material, media, and timestamps. <strong className="text-white">Tips</strong> stores the recorded on-chain payment metadata: <span className="mono text-xs text-gold">id, sender_id, receiver_id, amount, tx_hash, created_at</span>.</p><p>The RLS model permits public reads required for timelines and ranking, while authenticated writes are bound to the signed-in user. A sender cannot write a tip on behalf of another account or create a self-tip record.</p><CodeBlock language="sql">{rlsExample}</CodeBlock></div></DocumentationSection><DocumentationSection id="development" number="05" icon={Terminal} title="Local Development & Open Source"><div className="space-y-5 text-sm leading-7 text-slate-300"><p>Folester is open source under the MIT License. The public repository is available at <a href="https://github.com/FlockGG/FolesterApp" target="_blank" rel="noreferrer" className="font-semibold text-gold underline underline-offset-4 hover:text-[#e6ba50]">github.com/FlockGG/FolesterApp <ExternalLink className="inline" size={13} /></a>.</p><p>Install dependencies and start the Vite development server:</p><CodeBlock language="bash">{setupExample}</CodeBlock><p>Configure the Supabase URL and anonymous key in the local environment, then apply the repository SQL migrations in the Supabase SQL Editor. Run <span className="mono text-xs text-gold">schema.sql</span> first, followed by social and tipping migrations before exercising likes, comments, follows, or leaderboard records.</p></div></DocumentationSection></article></div></div>
}

function ArchitectureCard({ label, value, detail }) {
  return <div className="rounded-xl border border-slate-800 bg-black p-4"><p className="mono text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{label}</p><h3 className="mt-2 text-sm font-bold text-white">{value}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p></div>
}
