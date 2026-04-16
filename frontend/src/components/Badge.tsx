// frontend/src/components/Badge.tsx

import { theme } from '../theme'
import type { EstadoFactura, TipoFactura } from '../types'

const estadoConfig: Record<EstadoFactura, { bg: string; text: string; dot: string; label: string }> = {
  sin_facturar: { ...theme.colors.sinFacturar, label: 'Sin facturar' },
  facturada:    { ...theme.colors.facturada,   label: 'Facturada' },
  pagada:       { ...theme.colors.pagada,      label: 'Pagada' },
}

const tipoConfig: Record<TipoFactura, { label: string; bg: string; text: string }> = {
  cobranza:      { label: 'Cobranza',      bg: '#eaf4ff', text: '#0c5a9e' }, // celeste — igual que facturada
  pago_fletero:  { label: 'Pago fletero',  bg: '#f0eaff', text: '#5b21b6' }, // violeta
  pago_servicio: { label: 'Pago servicio', bg: theme.colors.borderLight, text: theme.colors.textSecondary }, // pendiente, sin cambio
}

export function EstadoBadge({ estado }: { estado: EstadoFactura }) {
  const cfg = estadoConfig[estado]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg, color: cfg.text,
      padding: '3px 9px',
      borderRadius: '20px',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '12px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}

export function TipoBadge({ tipo }: { tipo: TipoFactura }) {
  const cfg = tipoConfig[tipo]
  return (
    <span style={{
      display: 'inline-flex',
      background: cfg.bg,
      color: cfg.text,
      padding: '3px 9px',
      borderRadius: '20px',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {cfg.label}
    </span>
  )
}