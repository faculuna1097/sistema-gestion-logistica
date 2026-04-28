// frontend/src/components/BloqueTotales.tsx

import { theme } from '../theme'
import { formatMoney } from '../utils/format'
import { rowTotalStyle } from './tableStyles'

interface BloqueTotalesProps {
  subtotal: number
  iva: number
  total: number
  /** Default true. Si es false, se renderiza solo el Total. */
  incluyeIva?: boolean
}

/**
 * Bloque de totales reutilizable para previews de facturas e informes.
 * Con IVA: muestra Subtotal + IVA + Total.
 * Sin IVA: muestra solo el Total destacado.
 */
export function BloqueTotales({ subtotal, iva, total, incluyeIva = true }: BloqueTotalesProps) {
  return (
    <div style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadow.sm,
      overflow: 'hidden',
    }}>
      {incluyeIva && (
        <>
          <div style={{ ...rowTotalStyle, borderTop: 'none' }}>
            <span>Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(subtotal)}
            </span>
          </div>
          <div style={rowTotalStyle}>
            <span>IVA (21%)</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(iva)}
            </span>
          </div>
        </>
      )}
      <div style={{
        ...rowTotalStyle,
        borderTop: incluyeIva ? `1px solid ${theme.colors.borderLight}` : 'none',
        background: theme.colors.sidebarBg,
        color: '#fff',
        fontWeight: theme.font.weight.semibold,
        fontSize: theme.font.size.base,
      }}>
        <span>Total</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(total)}
        </span>
      </div>
    </div>
  )
}
