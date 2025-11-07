// src\components\PriceTable.jsx
import React from 'react'


export default function PriceTable({ rows, loading, error, onRefresh }) {
  if (error) {
    return (
      <div className="panel">
        <div className="panel-hd">
          <h2>Crypto Prices</h2>
          <button onClick={onRefresh}>Retry</button>
        </div>
        <p className="error">{error}</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Crypto Prices</h2>
        <button onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="table">
        <div className="thead">
          <div>Ticker</div>
          <div>Exchange</div>
          <div>Price</div>
          <div>Δ (since last)</div>
        </div>

        {rows.map(r => (
          <div key={r.id} className={`trow ${r.deltaClass || ''}`}>
            <div className="mono">{r.base}/{r.quote}</div>
            <div>{r.exchange}</div>
            <div className="mono">{r.price?.toLocaleString()}</div>
            <div className={`mono ${r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : ''}`}>
              {r.delta === 0 ? '—' : `${r.delta > 0 ? '+' : ''}${r.delta.toFixed(6)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
