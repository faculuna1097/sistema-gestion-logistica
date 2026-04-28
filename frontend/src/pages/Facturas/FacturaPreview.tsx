// frontend/src/pages/Facturas/FacturaPreview.tsx

import { theme } from '../../theme'
import { formatFecha, formatMoney } from '../../utils/format'
import { thStyle, tdBaseStyle, tableWrapper } from '../../components/tableStyles'
import { BloqueTotales } from '../../components/BloqueTotales'
import type { FacturaPreviewData, FacturaClienteFila, FacturaFleteroFila } from '../../hooks/useFacturaWizard'

// ─── Subcomponentes de tabla ──────────────────────────────────────────────────

function TablaCliente({ filas }: { filas: FacturaClienteFila[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <th style={thStyle}>Fecha</th>
          <th style={thStyle}>N° Viaje</th>
          <th style={thStyle}>Remito</th>
          <th style={thStyle}>Destinatario</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr
            key={f.facturaId}
            style={{ borderBottom: i < filas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
          >
            <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(f.fecha)}</td>
            <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              #{f.viajeId}
            </td>
            <td style={tdBaseStyle}>{f.numeroRemito ?? '—'}</td>
            <td style={tdBaseStyle}>{f.destinatario ?? '—'}</td>
            <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(f.monto)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TablaFletero({ filas }: { filas: FacturaFleteroFila[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <th style={thStyle}>Fecha</th>
          <th style={thStyle}>N° Viaje</th>
          <th style={thStyle}>Cliente</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr
            key={f.facturaId}
            style={{ borderBottom: i < filas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
          >
            <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(f.fecha)}</td>
            <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              #{f.viajeId}
            </td>
            <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{f.clienteNombre}</td>
            <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
              {formatMoney(f.monto)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  factura: FacturaPreviewData
  // Datos del header — opcionales porque el wizard paso 3 todavía no los tiene.
  // Cuando vengan (caso: FacturaDetailModal), se renderizan en la sección
  // derecha del header.
  numero?: string | null
  fechaEmision?: string | null
  vencimiento?: string | null
  cuit?: string | null
}

export function FacturaPreview({ factura, numero, fechaEmision, vencimiento, cuit }: Props) {
  const tituloTipo = factura.tipo === 'cliente' ? 'Cliente' : 'Fletero'
  const yaEmitida = !!numero

  return (
    <div>
      {/* Header — dividido en dos columnas: emisor/destinatario izquierda, número/fechas derecha */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Izquierda: tipo + actor + cuit + cantidad de viajes */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: theme.font.family,
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.semibold,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px',
          }}>
            Factura al {tituloTipo}
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: theme.font.family,
            fontSize: theme.font.size.xl,
            fontWeight: theme.font.weight.semibold,
            color: theme.colors.textPrimary,
          }}>
            {factura.actor.nombre}
          </h2>
          {cuit && (
            <div style={{
              fontFamily: theme.font.family,
              fontSize: theme.font.size.sm,
              color: theme.colors.textSecondary,
              marginTop: '4px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              CUIT: {cuit}
            </div>
          )}
          <div style={{
            fontFamily: theme.font.family,
            fontSize: theme.font.size.sm,
            color: theme.colors.textSecondary,
            marginTop: '4px',
          }}>
            {factura.filas.length} {factura.filas.length === 1 ? 'viaje' : 'viajes'}
          </div>
        </div>

        {/* Derecha: número de factura + fechas. Si no hay número, se muestra "Vista previa" */}
        <div style={{
          textAlign: 'right',
          flexShrink: 0,
          minWidth: '180px',
        }}>
          {yaEmitida ? (
            <>
              <div style={{
                fontFamily: theme.font.family,
                fontSize: theme.font.size.xs,
                fontWeight: theme.font.weight.semibold,
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}>
                Factura N°
              </div>
              <div style={{
                fontFamily: theme.font.family,
                fontSize: theme.font.size.lg,
                fontWeight: theme.font.weight.semibold,
                color: theme.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {numero}
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: theme.font.family,
              fontSize: theme.font.size.xs,
              fontWeight: theme.font.weight.semibold,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Vista previa
            </div>
          )}

          {(fechaEmision || vencimiento) && (
            <div style={{
              marginTop: '10px',
              fontFamily: theme.font.family,
              fontSize: theme.font.size.sm,
              color: theme.colors.textSecondary,
              lineHeight: 1.6,
            }}>
              {fechaEmision && (
                <div>Emisión: <span style={{ color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{formatFecha(fechaEmision)}</span></div>
              )}
              {vencimiento && (
                <div>Vence: <span style={{ color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{formatFecha(vencimiento)}</span></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de viajes — scrolleable si hay muchos */}
      <div style={{
        ...tableWrapper,
        marginBottom: '16px',
        maxHeight: '220px',
        overflowY: 'auto',
      }}>
        {factura.tipo === 'cliente'
          ? <TablaCliente filas={factura.filas as FacturaClienteFila[]} />
          : <TablaFletero filas={factura.filas as FacturaFleteroFila[]} />}
      </div>

      {/* Bloque de totales — condicional según incluyeIva.
          Con IVA: Subtotal + IVA + Total.
          Sin IVA: solo Total destacado (las facturas C no discriminan IVA). */}
      <BloqueTotales
        subtotal={factura.subtotal}
        iva={factura.iva}
        total={factura.total}
        incluyeIva={factura.incluyeIva}
      />
    </div>
  )
}
