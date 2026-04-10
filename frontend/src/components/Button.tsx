import React from 'react'
import { theme } from '../theme'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: theme.font.family,
    fontWeight: theme.font.weight.medium,
    fontSize: size === 'sm' ? theme.font.size.sm : theme.font.size.base,
    padding: size === 'sm' ? '6px 12px' : '8px 16px',
    borderRadius: theme.radius.md,
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'background 0.15s, opacity 0.15s',
    whiteSpace: 'nowrap',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.primary,
      color: '#fff',
    },
    secondary: {
      background: theme.colors.surface,
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.border}`,
    },
    danger: {
      background: theme.colors.dangerLight,
      color: theme.colors.danger,
      border: `1px solid #f5c6c2`,
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.textSecondary,
    },
  }

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}