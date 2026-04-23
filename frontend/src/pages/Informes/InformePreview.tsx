// frontend/src/pages/Informes/InformePreview.tsx

import { theme } from '../../theme'
import { formatFecha, formatMoney } from '../../utils/format'
import { thStyle, tdBaseStyle, tableWrapper, rowTotalStyle } from '../../components/tableStyles'
import type { InformeData, InformeClienteFila, InformeFleteroFila } from '../../types'

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TablaCliente({ filas }: { filas: InformeClienteFila[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <th style={thStyle}>Fecha</th>
          <th style={thStyle}>N° Viaje</th>
          <th style={thStyle}>Remito</th>
          <th style={thStyle}>Destinatario</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr
            key={f.viajeId}
            style={{ borderBottom: i < filas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
          >
            <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(f.fecha)}</td>
            <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              #{f.viajeId}
            </td>
            <td style={tdBaseStyle}>{f.numeroRemito ?? '—'}</td>
            <td style={tdBaseStyle}>{f.destinatario ?? '—'}</td>
            <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(f.valor)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TablaFletero({ filas }: { filas: InformeFleteroFila[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <th style={thStyle}>Fecha</th>
          <th style={thStyle}>N° Viaje</th>
          <th style={thStyle}>Cliente</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr
            key={f.viajeId}
            style={{ borderBottom: i < filas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
          >
            <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(f.fecha)}</td>
            <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              #{f.viajeId}
            </td>
            <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{f.clienteNombre}</td>
            <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(f.valor)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  informe: InformeData
}

export function InformePreview({ informe }: Props) {
  const tituloTipo = informe.tipo === 'cliente' ? 'Cliente' : 'Fletero'

  return (
    <div>
      {/* Header del informe */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontFamily: theme.font.family,
          fontSize: theme.font.size.xs,
          fontWeight: theme.font.weight.semibold,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '6px',
        }}>
          Informe del {tituloTipo}
        </div>
        <h2 style={{
          margin: 0,
          fontFamily: theme.font.family,
          fontSize: theme.font.size.xl,
          fontWeight: theme.font.weight.semibold,
          color: theme.colors.textPrimary,
        }}>
          {informe.actor.nombre}
        </h2>
        <div style={{
          fontFamily: theme.font.family,
          fontSize: theme.font.size.sm,
          color: theme.colors.textSecondary,
          marginTop: '4px',
        }}>
          Período: {formatFecha(informe.rango.desde)} – {formatFecha(informe.rango.hasta)}
          {'  ·  '}
          {informe.filas.length} {informe.filas.length === 1 ? 'viaje' : 'viajes'}
        </div>
      </div>

      {/* Tabla de viajes — scrolleable si hay muchos */}
      <div style={{
        ...tableWrapper,
        marginBottom: '16px',
        maxHeight: '220px',
        overflowY: 'auto',
      }}>
        {informe.tipo === 'cliente'
          ? <TablaCliente filas={informe.filas as InformeClienteFila[]} />
          : <TablaFletero filas={informe.filas as InformeFleteroFila[]} />}
      </div>

      {/* Bloque de totales */}
      <div style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.sm,
        overflow: 'hidden',
      }}>
        <div style={{ ...rowTotalStyle, borderTop: 'none' }}>
          <span>Subtotal</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
            {formatMoney(informe.subtotal)}
          </span>
        </div>
        <div style={rowTotalStyle}>
          <span>IVA (21%)</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
            {formatMoney(informe.iva)}
          </span>
        </div>
        <div style={{
          ...rowTotalStyle,
          background: '#0d2b1a',
          color: '#fff',
          fontWeight: theme.font.weight.semibold,
          fontSize: theme.font.size.base,
        }}>
          <span>Total</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(informe.total)}
          </span>
        </div>
      </div>
    </div>
  )
}