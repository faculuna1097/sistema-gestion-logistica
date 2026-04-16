// frontend/src/pages/Viajes/ViajesPage.tsx

import { useState, useMemo } from 'react'
import { useViajes } from '../../hooks/useViajes'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import { ViajeForm } from './ViajeForm'
import { ViajeDetailModal } from './ViajeDetailModal'
import { getEstadoVisual, LIMITE_POR_VENCER } from '../../utils/estadoFactura'
import type { Viaje, EstadoFactura, CreateViajeDTO } from '../../types'

// ─── Configuración visual ─────────────────────────────────────────────────────

// Opacidad del color de fondo de las filas (0 = sin color, 1 = sólido)
const ROW_COLOR_OPACITY = 0.15

// Oscurecimiento extra al hacer hover sobre una fila (additive)
const ROW_HOVER_DARKEN = 0.05

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

// ─── Estado visual ────────────────────────────────────────────────────────────

// Cada estado tiene un color de punto (dot) y un color de fondo de celda (bgHex).
// sin_facturar no colorea la celda — bgHex: null.
// "vencida" y "por vencer" son estados derivados, no existen en la DB.


// Convierte un hex a rgba aplicando la opacidad indicada
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Devuelve el color de fondo para una celda según el estado de su factura.
// Si hovered=true, suma una capa oscura adicional (gris) para feedback visual.
function getRowCellBg(
  estado: EstadoFactura | null,
  vencimiento: string | null,
  hovered: boolean,
): string {
  const { bgHex } = getEstadoVisual(estado, vencimiento)
  const baseColor = bgHex ? hexToRgba(bgHex, ROW_COLOR_OPACITY) : 'transparent'
  if (!hovered) return baseColor
  // Capa oscura adicional al hacer hover. Como CSS no permite "sumar" rgbas
  // directamente, usamos un linear-gradient con un overlay negro semitransparente.
  const overlay = `rgba(0, 0, 0, ${ROW_HOVER_DARKEN})`
  return `linear-gradient(${overlay}, ${overlay}), ${baseColor === 'transparent' ? 'white' : baseColor}`
}

function EstadoDot({ estado, vencimiento }: { estado: EstadoFactura | null; vencimiento: string | null }) {
  const { color } = getEstadoVisual(estado, vencimiento)
  return (
    <span style={{
      display: 'inline-block',
      width: '10px', height: '10px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }} />
  )
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

// Cada entrada fuerza un escenario específico de getEstadoVisual para obtener
// el color correcto sin duplicar la lógica.
const LEYENDA: Array<{ estado: EstadoFactura; vencimiento?: string; label: string }> = [
  { estado: 'sin_facturar',                              label: 'Sin facturar' },
  { estado: 'facturada',                                 label: 'Facturada'    },
  { estado: 'facturada', vencimiento: LIMITE_POR_VENCER, label: 'Por vencer'  },
  { estado: 'facturada', vencimiento: '2000-01-01',      label: 'Vencida'      },
  { estado: 'pagada',                                    label: 'Pagada'       },
]

// ─── Columnas con IDs estables ────────────────────────────────────────────────

const COLUMNAS = [
  { id: 'fecha',       label: 'Fecha',    align: 'left'   },
  { id: 'cliente',     label: 'Cliente',  align: 'left'   },
  { id: 'num_cob',     label: 'N° Cob.', align: 'left'   },
  { id: 'estado_cob',  label: 'Estado',   align: 'center' },
  { id: 'valor',       label: 'Valor',    align: 'right'  },
  { id: 'fletero',     label: 'Fletero',  align: 'left'   },
  { id: 'num_flet',    label: 'N° Flet.', align: 'left'  },
  { id: 'estado_flet', label: 'Estado',   align: 'center' },
  { id: 'costo',       label: 'Costo',    align: 'right'  },
  { id: 'ganancia',    label: 'Ganancia', align: 'right'  },
  { id: 'acciones',    label: '',         align: 'right'  },
] as const

// ─── Componente ───────────────────────────────────────────────────────────────

export function ViajesPage() {
  const { viajes, loading, error, crearViaje, editarViaje, eliminarViaje } = useViajes()
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  // 4 modales independientes (mismo patrón que ClientesPage):
  //   createOpen   — modal de creación
  //   detailTarget — viaje cuyo detalle se está mostrando
  //   editTarget   — viaje que se está editando
  //   deleteTarget — viaje a confirmar eliminación
  const [createOpen, setCreateOpen]     = useState(false)
  const [detailTarget, setDetailTarget] = useState<Viaje | null>(null)
  const [editTarget, setEditTarget]     = useState<Viaje | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Viaje | null>(null)
  const [saving, setSaving] = useState(false)

  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7))

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]))
  const fleteroMap = Object.fromEntries(fleteros.map(f => [f.id, f.nombre]))

  const mesesDisponibles = useMemo(() => {
    const meses = [...new Set(viajes.map(v => v.fecha.slice(0, 7)))].sort().reverse()
    return meses
  }, [viajes])

  const viajesFiltrados = mesFiltro === 'todos'
    ? viajes
    : viajes.filter(v => v.fecha.startsWith(mesFiltro))

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (dto: CreateViajeDTO | Partial<CreateViajeDTO>) => {
    await crearViaje(dto as CreateViajeDTO)
    setCreateOpen(false)
  }

  const handleEdit = async (dto: CreateViajeDTO | Partial<CreateViajeDTO>) => {
    if (!editTarget) return
    const actualizado = await editarViaje(editTarget.id, dto)
    setEditTarget(null)
    // Si veníamos del modal de detalle, refrescamos el detalle con los datos nuevos
    if (detailTarget && detailTarget.id === actualizado.id) {
      setDetailTarget(actualizado)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await eliminarViaje(deleteTarget.id)
      setDeleteTarget(null)
      setDetailTarget(null) // si se eliminó desde el detalle, también lo cerramos
    } finally {
      setSaving(false)
    }
  }

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

  const resolveClienteNombre = (v: Viaje) =>
    v.clienteNombre || clienteMap[v.clienteId] || `Cliente ${v.clienteId}`

  const resolveFleteroNombre = (v: Viaje) =>
    v.fleteroNombre || fleteroMap[v.fleteroId] || `Fletero ${v.fleteroId}`

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px' }}>

      {/* Header: grid 3 columnas para centrado exacto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '24px' }}>

        {/* Izquierda: botón nuevo viaje */}
        <div>
          <Button onClick={() => setCreateOpen(true)}>+ Nuevo viaje</Button>
        </div>

        {/* Centro: selector de mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={mesFiltro}
            onChange={e => setMesFiltro(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', minWidth: '160px' }}
          >
            <option value="todos">Todos los meses</option>
              {mesesDisponibles.map(mes => {
                const label = new Date(mes + '-02').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                const labelFormateado = label.replace(' de ', ' ').replace(/^./, c => c.toUpperCase())
                return (
                  <option key={mes} value={mes}>{labelFormateado}</option>
                )
              })}
          </select>
        </div>

        {/* Derecha: leyenda de estados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
          {LEYENDA.map(item => {
            const { color, label } = getEstadoVisual(item.estado, item.vencimiento ?? null)
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div style={{ background: theme.colors.dangerLight, color: theme.colors.danger, padding: '12px 16px', borderRadius: theme.radius.md, marginBottom: '16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
          {error}
        </div>
      )}

      <div style={{ background: theme.colors.surface, borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {COLUMNAS.map(col => (
                <th key={col.id} style={{ padding: '12px 16px', textAlign: col.align, fontFamily: theme.font.family, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', background: theme.colors.surfaceHover }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNAS.length} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>Cargando...</td></tr>
            ) : viajesFiltrados.length === 0 ? (
              <tr><td colSpan={COLUMNAS.length} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>No hay viajes cargados</td></tr>
            ) : viajesFiltrados.map((v, i) => {
              const ganancia   = v.valorCliente - v.costoFletero
              const isHovered  = hoveredRowId === v.id
              const cobBg      = getRowCellBg(v.estadoFacturaCobranza,    v.vencimientoCobranza,    isHovered)
              const fletBg     = getRowCellBg(v.estadoFacturaPagoFletero, v.vencimientoPagoFletero, isHovered)
              const borderColor = isHovered ? theme.colors.border : theme.colors.borderLight
              return (
                <tr
                  key={v.id}
                  onClick={() => setDetailTarget(v)}
                  onMouseEnter={() => setHoveredRowId(v.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: i < viajesFiltrados.length - 1 ? `1px solid ${borderColor}` : 'none',
                    borderTop: isHovered ? `1px solid ${borderColor}` : 'none',
                  }}
                >
                  <td style={{ background: cobBg,  padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {formatFecha(v.fecha)}
                  </td>
                  <td style={{ background: cobBg,  padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                    {resolveClienteNombre(v)}
                  </td>
                  <td style={{ background: cobBg,  padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>
                    {v.numeroFacturaCobranza ?? '—'}
                  </td>
                  <td style={{ background: cobBg,  padding: '14px 16px', textAlign: 'center' }}>
                    <EstadoDot estado={v.estadoFacturaCobranza} vencimiento={v.vencimientoCobranza} />
                  </td>
                  <td style={{ background: cobBg,  padding: '14px 16px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(v.valorCliente)}
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary }}>
                    {resolveFleteroNombre(v)}
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>
                    {v.numeroFacturaPagoFletero ?? '—'}
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', textAlign: 'center' }}>
                    <EstadoDot estado={v.estadoFacturaPagoFletero} vencimiento={v.vencimientoPagoFletero} />
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(v.costoFletero)}
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semibold, color: ganancia >= 0 ? theme.colors.primary : theme.colors.danger, fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(ganancia)}
                    </span>
                  </td>
                  <td style={{ background: fletBg, padding: '14px 16px', textAlign: 'right' }}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation()  // evita que se dispare el onClick de la fila
                        setDeleteTarget(v)
                      }}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Ingresar viaje" width="520px">
        <ViajeForm
          clientes={clientes}
          fleteros={fleteros}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Modal detalle (read-only) */}
      <ViajeDetailModal
        viaje={detailTarget}
        clienteNombre={detailTarget ? resolveClienteNombre(detailTarget) : ''}
        fleteroNombre={detailTarget ? resolveFleteroNombre(detailTarget) : ''}
        onClose={() => setDetailTarget(null)}
        onEdit={() => {
          // Cerramos detalle y abrimos edición con el mismo viaje
          if (detailTarget) {
            setEditTarget(detailTarget)
            setDetailTarget(null)
          }
        }}
        onDelete={() => {
          // Disparamos modal de confirmación; el detalle se cierra al confirmar/cancelar
          if (detailTarget) setDeleteTarget(detailTarget)
        }}
      />

      {/* Modal editar */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar viaje" width="520px">
        <ViajeForm
          viaje={editTarget}
          clientes={clientes}
          fleteros={fleteros}
          onSubmit={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar viaje" width="400px">
        <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary, marginBottom: '20px', lineHeight: 1.6 }}>
          ¿Eliminar el viaje del <strong style={{ color: theme.colors.textPrimary }}>{deleteTarget && formatFecha(deleteTarget.fecha)}</strong>? Se eliminarán también las facturas asociadas. Esta acción no se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Eliminar</Button>
        </div>
      </Modal>

    </div>
  )
}