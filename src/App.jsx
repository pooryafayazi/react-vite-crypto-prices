// src\App.jsx
import React, { useEffect, useRef, useState } from 'react'
import { fca } from './lib/cryptoapi'
import PriceTable from './components/PriceTable'
import './App.css'

const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_MS || 600000)

function splitPair(raw, fallbackQuote) {
  if (!raw) return [null, fallbackQuote.toUpperCase()]
  const s = String(raw).toUpperCase()
  if (s.includes('/')) {
    const [b, q] = s.split('/')
    return [b, q]
  }
  const q = (fallbackQuote || 'USD').toUpperCase()
  if (s.endsWith(q)) return [s.slice(0, s.length - q.length), q]
  return [s, q]
}

function findPriceDeep(obj, quote) {
  const q = String(quote || 'USD').toLowerCase()
  if (obj == null) return NaN
  if (typeof obj === 'number') return obj
  if (typeof obj === 'string' && !isNaN(obj)) return Number(obj)
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const n = findPriceDeep(it, quote)
      if (Number.isFinite(n)) return n
    }
    return NaN
  }
  if (typeof obj === 'object') {
    if (q in obj) {
      const n = findPriceDeep(obj[q], quote)
      if (Number.isFinite(n)) return n
    }
    for (const k of ['price','last','close','value','rate']) {
      if (k in obj) {
        const n = findPriceDeep(obj[k], quote)
        if (Number.isFinite(n)) return n
      }
    }
    for (const k of ['quote','quotes','converted','ticker','data','result','values']) {
      if (k in obj) {
        const n = findPriceDeep(obj[k], quote)
        if (Number.isFinite(n)) return n
      }
    }
    for (const k of Object.keys(obj)) {
      const n = findPriceDeep(obj[k], quote)
      if (Number.isFinite(n)) return n
    }
  }
  return NaN
}

export default function App() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState('USD')
  const [exchange, setExchange] = useState('binance')
  const prevMapRef = useRef(new Map())

  async function load() {
    setLoading(true); setError('')
    try {
      // اولویت: دیتا از یک صرافی مشخص
      let out = []
      try {
        const ex = await fca.getExchange({ exchange, convert: quote })
        const list = Array.isArray(ex?.result) ? ex.result : (Array.isArray(ex) ? ex : [])
        out = list.map((it, i) => {
          const pair = it.pair || it.symbol || it.ticker || `${it.base}/${quote}`
          const [base, q] = splitPair(pair, quote)
          const price = findPriceDeep(it, q)
          const id = `${exchange}:${base}/${q}`
          const prev = prevMapRef.current.get(id) || 0
          const delta = Number.isFinite(price) ? price - prev : 0
          return {
            id, base, quote: q, exchange,
            price, delta,
            deltaClass: delta > 0 ? 'flash-up' : delta < 0 ? 'flash-down' : ''
          }
        }).filter(r => r.base && Number.isFinite(r.price))
      } catch (_) {
        /* اگر /getExchange در پلن Free قفل بود، می‌رویم سراغ fallback پایین */
      }

      // fallback: اگر از صرافی دیتایی نیومد، مثل قبل با getData چند کوین محبوب
      if (!out.length) {
        const popular = ['BTC','ETH','BNB','SOL','XRP']
        const tmp = []
        for (const s of popular) {
          try {
            const r = await fca.getData({ symbol: s, convert: quote })
            const price = findPriceDeep(r?.result || r, quote)
            const id = `global:${s}`
            const prev = prevMapRef.current.get(id) || 0
            const delta = Number.isFinite(price) ? price - prev : 0
            tmp.push({
              id, base: s, quote, exchange,
              price, delta,
              deltaClass: delta > 0 ? 'flash-up' : delta < 0 ? 'flash-down' : ''
            })
          } catch {}
        }
        out = tmp
      }

      const nextPrev = new Map(prevMapRef.current)
      out.forEach(r => nextPrev.set(r.id, r.price))
      prevMapRef.current = nextPrev

      setRows(out)
    } catch (e) {
      setError(e.message || 'Failed to load'); setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [quote, exchange])

  return (
    <main className="container">
      <header className="header">
        <h1>FreeCryptoAPI – Prices</h1>
        <div className="filters">
          <label>Exchange
            <select value={exchange} onChange={e => setExchange(e.target.value)}>
              <option value="binance">binance</option>
              <option value="kraken">kraken</option>
              <option value="coinbase">coinbase</option>
              <option value="bitfinex">bitfinex</option>
            </select>
          </label>
          <label>Quote
            <select value={quote} onChange={e => setQuote(e.target.value)}>
              <option>USD</option><option>EUR</option><option>USDT</option>
            </select>
          </label>
        </div>
      </header>

      <PriceTable rows={rows} loading={loading} error={error} onRefresh={load} />
      <footer className="note"><small>Auto refresh every {REFRESH_MS/1000}s</small></footer>
    </main>
  )
}










