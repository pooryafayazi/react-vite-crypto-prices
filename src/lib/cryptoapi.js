// src\lib\cryptoapi.js
// api documentation : https://freecryptoapi.com/documentation/
const DEV = import.meta.env.DEV
const BASE = (import.meta.env.VITE_CRYPTO_API_BASE || 'https://api.freecryptoapi.com/v1').replace(/\/$/, '')
const BASE_URL = DEV ? '/fca/v1' : BASE
const KEY = import.meta.env.VITE_CRYPTO_API_KEY || ''
const AUTH = String(import.meta.env.VITE_CRYPTO_API_AUTH || 'bearer').toLowerCase()


function toQuery(params = {}) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v ?? '' !== '') q.append(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}


function withAuthHeader(init = {}) {
  if (!KEY) return init
  const headers = new Headers(init.headers || {})
  if (AUTH === 'bearer') headers.set('Authorization', `Bearer ${KEY}`)
  else if (AUTH === 'header') headers.set('X-API-KEY', KEY)
  else headers.set('X-API-KEY', KEY)
  return { ...init, headers }
}


export async function api(path, params) {
  const url = `${BASE_URL}${path}${toQuery(params)}`
  // try: header (Bearer)
  let res = await fetch(url, withAuthHeader({ mode: 'cors' }))
  if (!res.ok) {
    const txt = await res.text().catch(()=>'')
    const msg = `${txt}`.toLowerCase()
    const shouldRetry = res.status === 401 || res.status === 403 || msg.includes('unauthorized')
    if (shouldRetry && KEY) {
      // fallback: query ?apikey=
      const u = new URL(url, window.location.origin)
      u.searchParams.set('apikey', KEY)
      res = await fetch(u.toString(), {})
    } else {
      throw new Error(`HTTP ${res.status} ${path}: ${txt || res.statusText}`)
    }
  }
  return res.json()
}


export const fca = {
  getCryptoList() { return api('/getCryptoList') },     // C بزرگ
  getTop({ limit = 50 } = {}) { return api('/getTop', { limit }) },
  getData({ symbol = 'BTC', convert = 'USD' } = {}) { return api('/getData', { symbol, convert }) },

  getExchange({ exchange = 'binance', convert = 'USD' } = {}) {
    return api('/getExchange', { exchange, convert })
  },
}


