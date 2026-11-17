import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { ArrowUpRight, Check, ExternalLink, LogOut, WalletCards, X } from 'lucide-react'
import { shortenAddress } from '../lib/solana/wallet'

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { connected, connecting, disconnect, connect, publicKey, wallet, select, wallets } = useWallet()
  const [pendingWallet, setPendingWallet] = useState(false)
  const [error, setError] = useState('')
  const [showPhantomHandoff, setShowPhantomHandoff] = useState(false)

  const isMobileBrowser = useMemo(
    () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    [],
  )
  const phantomBrowseUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://phantom.app'
    return `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`
  }, [])

  useEffect(() => {
    if (!pendingWallet || !wallet || connected || connecting) return
    connect().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Wallet connection was declined.')
      setPendingWallet(false)
    })
  }, [connect, connected, connecting, pendingWallet, wallet])

  const handleConnect = async () => {
    setError('')
    setShowPhantomHandoff(false)

    try {
      if (!wallet) {
        const phantom = wallets.find((item) => item.adapter.name === 'Phantom')
        const phantomNotDetected = !phantom || phantom.adapter.readyState === WalletReadyState.NotDetected

        // Phantom does not support connecting from external mobile browsers such as Chrome.
        // Open the same page in Phantom's in-app browser instead of showing a false install error.
        if (isMobileBrowser && phantomNotDetected) {
          setError('Phantom connections on mobile work inside Phantom’s in-app browser, not Chrome. Open DIGO in Phantom to continue.')
          setShowPhantomHandoff(true)
          return
        }

        if (!phantom) {
          setError('Install Phantom or another supported Solana wallet to connect.')
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
      {error && (
        <div className="wallet-error" role="alert">
          <X size={13} />
          <span>{error}</span>
          {showPhantomHandoff && (
            <a className="wallet-phantom-handoff" href={phantomBrowseUrl}>
              <ExternalLink size={13} /> Open DIGO in Phantom
            </a>
          )}
        </div>
      )}
    </div>
  )
}
