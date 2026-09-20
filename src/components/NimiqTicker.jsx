import { useEffect, useState } from 'react'

const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=nimiq-2&vs_currencies=usd&include_24hr_change=true'

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  }).format(value)
}

export default function NimiqTicker() {
  const [quote, setQuote] = useState(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadQuote() {
      try {
        const response = await fetch(PRICE_URL, { signal: controller.signal })
        if (!response.ok) throw new Error('Price feed unavailable')
        const data = await response.json()
        const price = Number(data?.['nimiq-2']?.usd)
        const change = Number(data?.['nimiq-2']?.usd_24h_change)
        if (!Number.isFinite(price) || !Number.isFinite(change)) throw new Error('Invalid price feed response')
        if (active) {
          setQuote({ price, change })
          setUnavailable(false)
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setUnavailable(true)
      }
    }

    loadQuote()
    const intervalId = window.setInterval(loadQuote, 60_000)
    return () => {
      active = false
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  if (!quote) return <div className="hidden min-h-10 items-center rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-semibold text-slate-500 sm:flex" aria-live="polite">{unavailable ? 'NIM feed unavailable' : 'Loading NIM…'}</div>

  const positive = quote.change >= 0
  return <div className="hidden min-h-10 items-center rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-semibold sm:flex" aria-label={`NIM price ${formatPrice(quote.price)}, ${positive ? 'up' : 'down'} ${Math.abs(quote.change).toFixed(2)} percent in 24 hours`}>
    <span className="mono text-slate-200">$NIM: {formatPrice(quote.price)}</span>
    <span className={`mono ml-2 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>({positive ? '+' : '-'}{Math.abs(quote.change).toFixed(2)}%)</span>
  </div>
}
