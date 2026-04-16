// src/utils/estadoFactura.ts

import { theme } from '../theme'
import type { EstadoFactura } from '../types'

export const HOY = new Date().toISOString().slice(0, 10)

export const DIAS_ALERTA = 7

export const LIMITE_POR_VENCER = new Date(Date.now() + DIAS_ALERTA * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10)

// Devuelve color, label y bgHex según estado + vencimiento.
// bgHex es el color base para el fondo de celda en la tabla (null = sin color).
// "vencida" y "por vencer" son estados derivados, no existen en la DB.
export function getEstadoVisual(
  estado: EstadoFactura | null,
  vencimiento: string | null
): { color: string; label: string; bgHex: string | null } {
  if (!estado) return { color: theme.colors.textMuted, label: '—', bgHex: null }

  if (estado === 'facturada' && vencimiento) {
    if (vencimiento < HOY)
      return { color: theme.colors.danger, label: 'Vencida',    bgHex: '#c0392b' }
    if (vencimiento <= LIMITE_POR_VENCER)
      return { color: '#f39c12',           label: 'Por vencer', bgHex: '#f39c12' }
  }

  switch (estado) {
    case 'sin_facturar': return { color: '#aab5af',                  label: 'Sin facturar', bgHex: null      }
    case 'facturada':    return { color: theme.colors.facturada.dot, label: 'Facturada',    bgHex: '#3b9ede' }
    case 'pagada':       return { color: theme.colors.pagada.dot,    label: 'Pagada',       bgHex: '#1a7a4a' }
  }
}