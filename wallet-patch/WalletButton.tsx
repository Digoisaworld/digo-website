import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { ArrowUpRight, Check, LogOut, WalletCards } from 'lucide-react'
import { shortenAddress } from '../lib/solana/wallet'

const CONNECT_PARAM = 'digo_connect'

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { connected, connecting, disconnect, connect, publicKey, wallet, select, wallets } = useWallet()
  const [pendingWallet, setPendingWallet] = useState(false)
  const [error, setError] = useState('')

  const isMobileBrowser = useMemo(
    () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    [],
  )
  const phantomBrowseUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://phantom.app'
    const target = new URL(window.location.href)
    target.searchParams.set(CONNECT_PARAM, '1')
    return `https://phantom.app/ul/browse/${encodeURIComponent(target.toString())}`
  }, [])

  // The Chrome handoff carries a one-shot flag. Once Phantom's in-app browser
  // loads the page and injects its provider, request the wallet connection once.
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileBrowser) return
    const url = new URL(window.location.href)
    if (url.searchParams.get(CONNECT_PARAM) !== '1' || connected || connecting) return
    const phantom = wallets.find((item) => item.adapter.name === 'Phantom')
    if (!phantom || phantom.adapter.readyState === WalletReadyState.NotDetected) return
    if (wallet?.adapter.name !== 'Phantom') {
      select('Phantom')
      setPendingWallet(true)
      return
    }
    setPendingWallet(true)
  }, [connected, connecting, isMobileBrowser, select, wallet, wallets])

  useEffect(() => {
    if (!pendingWallet || !wallet || connected || connecting) return
    connect().then(() => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete(CONNECT_PARAM)
        window.history.replaceState({}, '', url.toString())
      }
    }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Wallet connection was declined.')
      setPendingWallet(false)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete(CONNECT_PARAM)
        window.history.replaceState({}, '', url.toString())
      }
    })
  }, [connect, connected, connecting, pendingWallet, wallet])

  useEffect(() => {
    if (connected && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has(CONNECT_PARAM)) {
        url.searchParams.delete(CONNECT_PARAM)
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [connected])

  const handleConnect = async () => {
    setError('')

    const phantom = wallets.find((item) => item.adapter.name === 'Phantom')
    const phantomUnavailable = !phantom || phantom.adapter.readyState === WalletReadyState.NotDetected

    // Phantom mobile does not inject a provider into external browsers.
    // Use the original tap to open this exact page inside Phantom, without an
    // intermediate error panel or a second "Open Phantom" button.
    if (isMobileBrowser && phantomUnavailable) {
      window.location.assign(phantomBrowseUrl)
      return
    }

    try {
      if (!wallet) {
        if (!phantom) {
          setError('No supported Solana wallet was detected. Open this page in Phantom.')
          return
        }
        select(phantom.adapter.name)
        setPendingWallet(true)
        return
      }
      await connect()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Wallet connection was declined.')
    }
  }

  if (connected && publicKey) {
    return (
      <div className="wallet-connected-wrap">
        <div className="wallet-address" title={publicKey.toBase58()}>
          <Check size={14} strokeWidth={3} />
          {shortenAddress(publicKey.toBase58())}
        </div>
        <button className="icon-button" aria-label="Disconnect wallet" onClick={() => disconnect()}>
          <LogOut size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-action-wrap">
      <button className={`button button-lime ${compact ? 'button-compact' : ''}`} onClick={handleConnect} disabled={connecting || pendingWallet}>
        <WalletCards size={16} />
        {connecting || pendingWallet ? 'Connecting…' : 'Connect wallet'}
        {!compact && <ArrowUpRight size={15} />}
      </button>
      {error && <div className="wallet-error" role="alert">{error}</div>}
    </div>
  )
}
