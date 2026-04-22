// frontend/src/pages/Informes/HistorialInformes.tsx

import { useMemo } from 'react'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { TipoInformeBadge } from '../../components/Badge'
import { theme } from '../../theme'
import type { Informe } from '../../types'

// ─── Formatters ──────────────────────────────────────────────────────────────
// Duplicados con FacturasPage e InformePreview — deuda técnica marcada.

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatFechaCreacion(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Estilos de tabla (consistentes con FacturasPage y ViajesPage) ───────────
// Duplicados entre archivos — deuda técnica marcada para resolver aparte.

const thStyle: React.CSSProperties = {
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

const tdBaseStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textSecondary,
}

const tableWrapper: React.CSSProperties = {
  background: theme.colors.surface,
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.colors.border}`,
  overflow: 'hidden',
  boxShadow: theme.shadow.sm,
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface HistorialInformesProps {
  informes: Informe[]
  loading: boolean
  error: string | null
  onVerInforme: (informe: Informe) => void
  onExportarInforme: (informe: Informe) => void
  onEliminarInforme: (informe: Informe) => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function HistorialInformes({
  informes,
  loading,
  error,
  onVerInforme,
  onExportarInforme,
  onEliminarInforme,
}: HistorialInformesProps) {
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  const clienteMap = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nombre])),
    [clientes]
  )
  const fleteroMap = useMemo(
    () => Object.fromEntries(fleteros.map(f => [f.id, f.nombre])),
    [fleteros]
  )

  const getNombreTitular = (informe: Informe) => {
    if (informe.tipo === 'cliente' && informe.clienteId !== null) {
      return clienteMap[informe.clienteId] ?? `Cliente ${informe.clienteId}`
    }
    if (informe.tipo === 'fletero' && informe.fleteroId !== null) {
      return fleteroMap[informe.fleteroId] ?? `Fletero ${informe.fleteroId}`
    }
    return '—'
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontFamily: theme.font.family, color: theme.colors.textMuted }}>
        Cargando informes...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: theme.colors.dangerLight,
        color: theme.colors.danger,
        padding: '12px 16px',
        borderRadius: theme.radius.md,
        fontFamily: theme.font.family,
        fontSize: theme.font.size.sm,
      }}>
        {error}
      </div>
    )
  }
  console.log('[HistorialInformes] render con', informes.length, 'informes')
  
  return (
    <div style={tableWrapper}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Titular</th>
            <th style={thStyle}>Rango</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>N° viajes</th>
            <th style={thStyle}>Creado el</th>
            <th style={{ ...thStyle, width: '50px' }} />
          </tr>
        </thead>
        <tbody>
          {informes.length === 0 ? (
            <tr>
              <td colSpan={7} style={{
                padding: '48px 32px',
                textAlign: 'center',
                fontFamily: theme.font.family,
                fontSize: theme.font.size.sm,
                color: theme.colors.textMuted,
              }}>
                Todavía no generaste informes. Tocá "+ Nuevo informe" para crear el primero.
              </td>
            </tr>
          ) : informes.map((informe, i) => (
            <tr
              key={informe.id}
              onClick={() => onVerInforme(informe)}
              onMouseEnter={e => e.currentTarget.style.background = theme.colors.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{
                borderBottom: i < informes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <td style={{
                ...tdBaseStyle,
                fontWeight: theme.font.weight.medium,
                color: theme.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {informe.codigo}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <TipoInformeBadge tipo={informe.tipo} />
              </td>
              <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>
                {getNombreTitular(informe)}
              </td>
              <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>
                {formatFecha(informe.rangoDesde)} → {formatFecha(informe.rangoHasta)}
              </td>
              <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {informe.viajeIds.length}
              </td>
              <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>
                {formatFechaCreacion(informe.createdAt)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onExportarInforme(informe)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.textMuted,
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: theme.radius.sm,
                      transition: 'all 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = theme.colors.primaryLight
                      e.currentTarget.style.color = theme.colors.primary
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = theme.colors.textMuted
                    }}
                    title="Exportar PDF"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onEliminarInforme(informe)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.textMuted,
                      cursor: 'pointer',
                      fontSize: theme.font.size.lg,
                      padding: '4px 8px',
                      borderRadius: theme.radius.sm,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = theme.colors.dangerLight
                      e.currentTarget.style.color = theme.colors.danger
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = theme.colors.textMuted
                    }}
                    title="Eliminar informe"
                  >
                    ×
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}