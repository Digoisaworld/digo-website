import { useMemo, useState } from 'react'
import { ArrowDown, CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-react'
import { VersionedTransaction } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { MINT_ADDRESS } from '../data/token'
import { WalletButton } from './WalletButton'

const API = 'https://api.jup.ag/swap/v2'
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const LAMPORTS = 1_000_000_000n

type Order = {
  transaction?: string | null
  requestId?: string
  outAmount?: string
  router?: string
  mode?: string
  priceImpact?: number | string
  priceImpactPct?: number | string
  errorCode?: number
  errorMessage?: string
  lastValidBlockHeight?: number
}
type ExecuteResult = {
  status?: 'Success' | 'Failed'
  signature?: string
  code?: number
  error?: string
  totalOutputAmount?: string
}
const decode = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const encode = (a: Uint8Array) => { let s = ''; a.forEach(b => { s += String.fromCharCode(b) }); return btoa(s) }
function solToLamports(s: string): bigint | null {
  if (!/^\d+(\.\d{0,9})?$/.test(s)) return null
  const [w, f = ''] = s.split('.')
  return BigInt(w) * LAMPORTS + BigInt((f + '000000000').slice(0, 9))
}
function digoAmount(raw?: string) {
  if (!raw) return '—'
  try {
    const n = BigInt(raw), base = 100_000_000n
    const whole = (n / base).toLocaleString('en-US')
    const fraction = (n % base).toString().padStart(8, '0').replace(/0+$/, '')
    return fraction ? whole + '.' + fraction : whole
  } catch { return '—' }
}

export function SwapPanel() {
  const { connected, publicKey, signTransaction } = useWallet()
  const [amount, setAmount] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState('')
  const [signature, setSignature] = useState('')
  const lamports = useMemo(() => solToLamports(amount), [amount])

  const getQuote = async () => {
    if (!publicKey || !connected) { setError('Connect your Solana wallet first.'); return }
    if (!lamports || lamports <= 0n) { setError('Enter a valid SOL amount (up to 9 decimal places).'); return }
    setLoading(true); setError(''); setOrder(null); setSignature('')
    try {
      const q = new URLSearchParams({ inputMint: SOL_MINT, outputMint: MINT_ADDRESS, amount: lamports.toString(), taker: publicKey.toBase58() })
      const res = await fetch(API + '/order?' + q.toString(), { headers: { accept: 'application/json' } })
      const data = await res.json() as Order & { message?: string; error?: string }
      if (!res.ok) throw new Error(data.errorMessage || data.error || data.message || 'Jupiter quote request failed (' + res.status + ').')
      if (!data.outAmount || data.outAmount === '0')
        throw new Error(data.errorMessage || 'Jupiter did not return a valid output amount for this pair and size.')
      setOrder(data)
      if (!data.transaction) {
        const detail = data.errorMessage || 'A price quote exists, but Jupiter could not build an executable transaction for this route.'
        setError(data.errorCode !== undefined ? detail + ' (router: ' + (data.router || 'unknown') + ', code: ' + data.errorCode + ')' : detail)
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to fetch a live quote.') }
    finally { setLoading(false) }
  }

  const execute = async () => {
    if (!order?.transaction || !order.requestId || !signTransaction) { setError('This quote has no executable transaction, or this wallet session cannot sign it.'); return }
    setSwapping(true); setError('')
    try {
      const unsigned = VersionedTransaction.deserialize(decode(order.transaction))
      const signed = await signTransaction(unsigned)
      const res = await fetch(API + '/execute', {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          signedTransaction: encode(signed.serialize()),
          requestId: order.requestId,
          ...(order.lastValidBlockHeight ? { lastValidBlockHeight: order.lastValidBlockHeight } : {}),
        }),
      })
      const data = await res.json() as ExecuteResult & { message?: string }
      if (!res.ok || data.status !== 'Success' || !data.signature)
        throw new Error(data.error || data.message || ('Jupiter execution failed' + (data.code !== undefined ? ' (code ' + data.code + ')' : '') + '. Check transaction status before trying again.'))
      setSignature(data.signature); setOrder(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Swap failed or was not confirmed.') }
    finally { setSwapping(false) }
  }

  const impact = order?.priceImpactPct ?? order?.priceImpact
  const executable = Boolean(order?.transaction && order?.requestId)
  return <div className="swap-card">
    <div className="swap-card-topline"><div><span className="eyebrow">BUY DIGO</span><h3>Own the moment.</h3></div><div className="prototype-badge"><CircleAlert size={14} /> Live route</div></div>
    <p className="swap-note">Request a live Jupiter quote. Review the route and approve every transaction inside Phantom.</p>
    <div className="asset-field"><div className="field-label"><span>You send</span><span className="muted">Enter SOL amount</span></div>
      <div className="asset-row"><input value={amount} onChange={e => { setAmount(e.target.value.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '')); setOrder(null); setError(''); setSignature('') }} inputMode="decimal" placeholder="0.00" aria-label="SOL amount" /><div className="asset-select"><span className="asset-icon sol-icon">S</span> SOL</div></div>
    </div>
    <div className="swap-arrow"><ArrowDown size={17} /></div>
    <div className="asset-field output-field"><div className="field-label"><span>You receive</span><span className="muted">{order ? (executable ? 'Executable quote' : 'Indicative quote only') : 'Quote required'}</span></div>
      <div className="asset-row"><div className="output-value">{digoAmount(order?.outAmount)}</div><div className="asset-select"><span className="asset-icon digo-icon">D</span> DIGO</div></div>
    </div>
    <div className="swap-details"><div><span>Price impact</span><strong>{impact === undefined ? 'Unavailable' : String(impact).endsWith('%') ? String(impact) : Number(impact).toFixed(3) + '%'}</strong></div><div><span>Slippage</span><strong>{order ? 'Jupiter RTSE' : 'Set on live route'}</strong></div><div><span>Network fee</span><strong>{order?.transaction ? 'Review in Phantom' : 'Wallet quote required'}</strong></div></div>
    {order?.router && <div className="swap-route-label">Route provider: {order.router.toUpperCase()}</div>}
    {!connected ? <WalletButton /> : <div className="swap-actions">
      <button className="button button-lime full-button" onClick={getQuote} disabled={loading || swapping || !amount.trim()}>{loading && <LoaderCircle className="swap-spinner" size={16} />}{loading ? 'Getting live quote…' : 'Get live quote'}</button>
      {executable && <button className="button button-outline full-button" onClick={execute} disabled={swapping}>{swapping && <LoaderCircle className="swap-spinner" size={16} />}{swapping ? 'Waiting for Phantom…' : 'Review & swap in Phantom'}</button>}
    </div>}
    {error && <div className="swap-feedback swap-error" role="alert">{error}</div>}
    {signature && <div className="swap-feedback swap-success" role="status">Swap confirmed. <a href={'https://solscan.io/tx/' + signature} target="_blank" rel="noreferrer">View transaction on Solscan ↗</a></div>}
    <div className="swap-safe-line"><ShieldCheck size={14} /> Never share your seed phrase or private key. Verify transaction details before approving.</div>
  </div>
}