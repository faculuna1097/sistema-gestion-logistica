// frontend/src/components/tableStyles.ts

import { theme } from '../theme'

/**
 * Estilos de tabla compartidos entre FacturasPage, InformePreview,
 * FacturaPreview, NuevoInformeModal, NuevaFacturaModal y HistorialInformes.
 *
 * Se exportan como objetos CSSProperties (no como componentes) para
 * preservar el patrón actual de spread + overrides puntuales:
 *   <th style={{ ...thStyle, textAlign: 'right' }}>
 *   <th style={{ ...thStyle, width: '40px' }}>
 *
 * Cuando haya un refactor de componentes puede evaluarse el salto a
 * <Table> / <Th> / <Td> con props, pero eso es una decisión aparte.
 */

export const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.xs,
  fontWeight: theme.font.weight.semibold,
  color: theme.colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: theme.colors.surfaceHover,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}

export const tdBaseStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textSecondary,
}

export const tableWrapper: React.CSSProperties = {
  background: theme.colors.surface,
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.colors.border}`,
  overflow: 'hidden',
  boxShadow: theme.shadow.sm,
}

/**
 * Fila del bloque de totales (Subtotal / IVA / Total).
 * Usada por FacturaPreview, InformePreview y NuevaFacturaModal paso 3.
 */
export const rowTotalStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 16px',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textSecondary,
  borderTop: `1px solid ${theme.colors.borderLight}`,
}