// frontend/src/components/FormFields.tsx

import React from 'react'
import { theme } from '../theme'

interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.sm,
        fontWeight: theme.font.weight.medium,
        color: theme.colors.textSecondary,
      }}>
        {label}{required && <span style={{ color: theme.colors.danger, marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{
          fontSize: theme.font.size.xs,
          color: theme.colors.danger,
          fontFamily: theme.font.family,
        }}>
          {error}
        </span>
      )}
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '14px',
  color: '#1a1f1c',
  background: '#ffffff',
  border: '1px solid #e4e7e1',
  borderRadius: '8px',
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}