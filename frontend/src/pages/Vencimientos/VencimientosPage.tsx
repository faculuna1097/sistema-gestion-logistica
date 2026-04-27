// frontend/src/pages/Vencimientos/VencimientosPage.tsx

import { useVencimientos } from '../../hooks/useVencimientos'
import type { VencimientoRow, SemanaGroup } from '../../hooks/useVencimientos'
import { theme } from '../../theme'
import MesNavigator from '../../components/MesNavigator'
import OrdenToggle from '../../components/OrdenToggle'

// ──────────────── Estilos de "semana actual" ────────────────

/**
 * Intensidad del verde aplicado a la semana actual. Subir para destacar más,
 * bajar para que sea más sutil. Las filas usan esta intensidad; el subtotal
 * usa una versión amplificada (proporción fija 2.5x) para mantenerse encima.
 *
 * Rango razonable: 0.03 (apenas visible) — 0.15 (saturado).
 */
const INTENSIDAD_VERDE_SEMANA_ACTUAL = 0.09

/** Primario del proyecto en RGB, para componer rgba() sin repetir el valor. */
const PRIMARY_RGB = '26, 122, 74' // theme.colors.primary = #1a7a4a

const BG_FILA_SEMANA_ACTUAL = `rgba(${PRIMARY_RGB}, ${INTENSIDAD_VERDE_SEMANA_ACTUAL})`
const BG_SUBTOTAL_SEMANA_ACTUAL = `rgba(${PRIMARY_RGB}, ${INTENSIDAD_VERDE_SEMANA_ACTUAL * 3})`

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function diasHastaVencimiento(vencimiento: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(vencimiento + 'T12:00:00')
  return Math.round((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

const thStyle: React.CSSProperties = {
  padding: '12px 20px',
  textAlign: 'left',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.xs,
  fontWeight: theme.font.weight.semibold,
  color: theme.colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: theme.colors.surfaceHover,
}

const tdStyle: React.CSSProperties = {
  padding: '14px 20px',
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

function FilaVencimiento({ fila, esActual = false }: { fila: VencimientoRow; esActual?: boolean }) {
  const dias = diasHastaVencimiento(fila.vencimiento)

  if (esActual) {
    // Sin hover: el fondo ya está pintado y no queremos competencia visual.
    return (
      <tr style={{ background: BG_FILA_SEMANA_ACTUAL }}>
        <td style={{ ...tdStyle, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
          {fila.titular}
        </td>
        <td style={tdStyle}>{fila.numero ?? '—'}</td>
        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
          <span>{fila.vencimiento}</span>
          <span style={{ marginLeft: 8, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: dias <= 5 ? theme.colors.danger : theme.colors.textMuted }}>
            {dias < 0 ? `hace ${Math.abs(dias)}d` : `en ${dias}d`}
          </span>
        </td>
        <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
          {formatMonto(fila.monto)}
        </td>
      </tr>
    )
  }

  // Comportamiento original con hover para semanas no actuales.
  return (
    <tr
      style={{ transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = theme.colors.surfaceHover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ ...tdStyle, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
        {fila.titular}
      </td>
      <td style={tdStyle}>{fila.numero ?? '—'}</td>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        <span>{fila.vencimiento}</span>
        <span style={{ marginLeft: 8, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: dias <= 5 ? theme.colors.danger : theme.colors.textMuted }}>
          {dias < 0 ? `hace ${Math.abs(dias)}d` : `en ${dias}d`}
        </span>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
        {formatMonto(fila.monto)}
      </td>
    </tr>
  )
}

function FilaSubtotal({ label, subtotal, esActual }: { label: string; subtotal: number; esActual: boolean }) {
  const bgColor = esActual ? BG_SUBTOTAL_SEMANA_ACTUAL : '#fef9ec'
  const textColor = esActual ? theme.colors.primary : '#92660a'

  return (
    <tr style={{ background: bgColor }}>
      <td colSpan={3} style={{ ...tdStyle, fontWeight: theme.font.weight.semibold, color: textColor }}>
        {label}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: theme.font.weight.semibold, fontVariantNumeric: 'tabular-nums', color: textColor }}>
        {formatMonto(subtotal)}
      </td>
    </tr>
  )
}

function SeccionVencidas({ filas }: { filas: VencimientoRow[] }) {
  if (filas.length === 0) return null
  const total = filas.reduce((acc, f) => acc + f.monto, 0)

  return (
    <>
      <tr>
        <td colSpan={4} style={{ ...tdStyle, color: theme.colors.danger, fontWeight: theme.font.weight.semibold }}>
          Vencidas
        </td>
      </tr>
      {filas.map(f => (
        <tr key={f.id} style={{ background: theme.colors.dangerLight }}>
          <td style={{ ...tdStyle, fontWeight: theme.font.weight.medium }}>{f.titular}</td>
          <td style={tdStyle}>{f.numero ?? '—'}</td>
          <td style={{ ...tdStyle, color: theme.colors.danger, fontWeight: theme.font.weight.medium }}>
            {f.vencimiento}
          </td>
          <td style={{ ...tdStyle, textAlign: 'right', color: theme.colors.danger, fontWeight: theme.font.weight.medium }}>
            {formatMonto(f.monto)}
          </td>
        </tr>
      ))}
      <tr style={{ background: theme.colors.dangerLight }}>
        <td colSpan={3} style={{ ...tdStyle, fontWeight: theme.font.weight.semibold, color: theme.colors.danger }}>
          Subtotal vencidas
        </td>
        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: theme.font.weight.semibold, color: theme.colors.danger }}>
          {formatMonto(total)}
        </td>
      </tr>
    </>
  )
}

function TablaVencimientos({ titulo, vencidas, semanas, total }: {
  titulo: string
  vencidas: VencimientoRow[]
  semanas: SemanaGroup[]
  total: number
}) {
  const hayDatos = vencidas.length > 0 || semanas.length > 0

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{
        margin: '0 0 12px 0',
        fontFamily: theme.font.family,
        fontSize: theme.font.size.lg,
        fontWeight: theme.font.weight.semibold,
        color: theme.colors.textPrimary,
        textAlign: 'center'
      }}>
        {titulo}
      </h2>

      <div style={tableWrapper}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {['Titular', 'N° Factura', 'Vencimiento', 'Monto'].map(col => (
                <th key={col} style={col === 'Monto' ? { ...thStyle, textAlign: 'right' } : thStyle}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <SeccionVencidas filas={vencidas} />

            {!hayDatos && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: theme.colors.textMuted }}>
                  Sin vencimientos
                </td>
              </tr>
            )}

            {semanas.map(semana => (
              <>
                {semana.filas.map(f => (
                  <FilaVencimiento key={f.id} fila={f} esActual={semana.esActual} />
                ))}
                <FilaSubtotal
                  key={`sub-${semana.label}`}
                  label={semana.label}
                  subtotal={semana.subtotal}
                  esActual={semana.esActual}
                />
              </>
            ))}

            {hayDatos && (
              <tr style={{ background: '#f0b429' }}>
                <td colSpan={3} style={{ ...tdStyle, fontWeight: theme.font.weight.semibold, color: '#1a1f1c' }}>
                  Total del mes
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: theme.font.weight.semibold, color: '#1a1f1c' }}>
                  {formatMonto(total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function VencimientosPage() {
  const {
    mes, setMes,
    orden, setOrden,
    loading, error,
    vencidasCobranza, vencidasPagos,
    semanasCobranza, semanasPagos,
    totalCobranza, totalPagos
  } = useVencimientos()

  return (
    <div style={{ padding: '32px' }}>

      {/* Header: grid 3 columnas — izquierda vacía, centro navegador, derecha toggle de orden */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '24px' }}>

        {/* Izquierda: toggle de orden */}
        <div >
          <OrdenToggle orden={orden} onChange={setOrden} />
        </div>

        {/* Centro: navegador de mes */}
        <MesNavigator mes={mes} onChange={(nuevo) => nuevo !== null && setMes(nuevo)} />

        {/* Derecha: vacio */}
        <div />
      </div>
      

      {loading && <div style={{ color: theme.colors.textMuted }}>Cargando...</div>}
      {error && <div style={{ color: theme.colors.danger }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <TablaVencimientos titulo="Cobranza" vencidas={vencidasCobranza} semanas={semanasCobranza} total={totalCobranza} />
          <TablaVencimientos titulo="Pagos" vencidas={vencidasPagos} semanas={semanasPagos} total={totalPagos} />
        </div>
      )}
    </div>
  )
}