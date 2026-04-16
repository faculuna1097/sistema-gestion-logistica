// src/components/CopyButton.tsx

import { useState } from 'react'
import { theme } from '../theme'

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[CopyButton] Error al copiar:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? '¡Copiado!' : 'Copiar'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        borderRadius: theme.radius.sm,
        color: copied ? theme.colors.primary : theme.colors.textMuted,
        transition: 'color 0.15s',
      }}
    >
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  )
}