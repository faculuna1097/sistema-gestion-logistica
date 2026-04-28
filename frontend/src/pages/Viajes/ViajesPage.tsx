// frontend/src/pages/Viajes/ViajesPage.tsx

import React, { useState, useMemo, useEffect } from 'react'
import { useViajes } from '../../hooks/useViajes'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import MesNavigator from '../../components/MesNavigator'
import OrdenToggle from '../../components/OrdenToggle'
import { theme, SEMANA_ACTUAL } from '../../theme'
import { ViajeForm } from './ViajeForm'
import { ViajeDetailModal } from './ViajeDetailModal'
import { getEstadoVisual, LIMITE_POR_VENCER } from '../../utils/estadoFactura'
import { obtenerSemanasDelMes } from '../../utils/fechas'
import type { SemanaInfo } from '../../utils/fechas'
import type { Viaje, EstadoFactura, CreateViajeDTO } from '../../types'

// ─── Configuración visual ─────────────────────────────────────────────────────

// Opacidad del color de fondo de las filas (0 = sin color, 1 = sólido)
const ROW_COLOR_OPACITY = 0.15

// Oscurecimiento extra al hacer hover sobre una fila (additive)
const ROW_HOVER_DARKEN = 0.05

const GAP_ENTRE_FILAS_HEADER = '32px'    // ← entre las dos filas del header
const GAP_ENTRE_HEADER_Y_TABLA = '8px'  // ← entre el header y la tabla

// ─── Estilos de "semana actual" ───────────────────────────────────────────────
// Constantes compartidas con VencimientosPage. Definidas en theme.ts como SEMANA_ACTUAL.

// ─── Estilos de la fila divisoria entre semanas ───────────────────────────────

const DIVISORIA_BG_DEFAULT = '#fef9ec'
const DIVISORIA_COLOR_DEFAULT = '#92660a'

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

// ─── Agrupamiento por semana real ─────────────────────────────────────────────

interface GrupoSemana {
  semana: SemanaInfo
  viajes: Viaje[]
}

/**
 * Distribuye los viajes en las semanas reales (lunes-domingo) que tocan el mes,
 * recortadas a los bordes. Las semanas vacías se omiten para no generar
 * divisorias inútiles.
 */
function agruparViajesPorSemanaReal(viajes: Viaje[], mes: string): GrupoSemana[] {
  const semanas = obtenerSemanasDelMes(mes)

  return semanas
    .map(semana => {
      const viajesDeEstaSemana = viajes.filter(
        v => v.fecha >= semana.desde && v.fecha <= semana.hasta,
      )
      return { semana, viajes: viajesDeEstaSemana }
    })
    .filter(g => g.viajes.length > 0)
}

// ─── Estado visual de filas ───────────────────────────────────────────────────

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function getRowCellBg(
  estado: EstadoFactura | null,
  vencimiento: string | null,
  hovered: boolean,
): string {
  const { bgHex } = getEstadoVisual(estado, vencimiento)
  const baseColor = bgHex ? hexToRgba(bgHex, ROW_COLOR_OPACITY) : 'transparent'
  if (!hovered) return baseColor
  const overlay = `rgba(0, 0, 0, ${ROW_HOVER_DARKEN})`
  return `linear-gradient(${overlay}, ${overlay}), ${baseColor === 'transparent' ? 'white' : baseColor}`
}

// ─── Leyenda de estados ───────────────────────────────────────────────────────

const LEYENDA: Array<{ estado: EstadoFactura; vencimiento?: string; label: string }> = [
  { estado: 'sin_facturar',                              label: 'Sin facturar' },
  { estado: 'facturada',                                 label: 'Facturada'    },
  { estado: 'facturada', vencimiento: LIMITE_POR_VENCER, label: 'Por vencer'   },
  { estado: 'facturada', vencimiento: '2000-01-01',      label: 'Vencida'      },
  { estado: 'pagada',                                    label: 'Pagada'       },
]

// ─── Columnas con IDs estables ────────────────────────────────────────────────

const COLUMNAS = [
  { id: 'num_viaje',   label: '#',        align: 'left'   },
  { id: 'fecha',       label: 'Fecha',    align: 'left'   },
  { id: 'cliente',     label: 'Cliente',  align: 'left'   },
  { id: 'num_cob',     label: 'N° Cob.',  align: 'left'   },
  { id: 'valor',       label: 'Valor',    align: 'right'  },
  { id: 'fletero',     label: 'Fletero',  align: 'left'   },
  { id: 'num_flet',    label: 'N° Flet.', align: 'left'   },
  { id: 'costo',       label: 'Costo',    align: 'right'  },
  { id: 'ganancia',    label: 'Ganancia', align: 'right'  },
  { id: 'acciones',    label: '',         align: 'right'  },
] as const

// ─── Componente ───────────────────────────────────────────────────────────────

export function ViajesPage() {
  const { viajes, loading, error, crearViaje, editarViaje, eliminarViaje } = useViajes()
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  const [createOpen, setCreateOpen]     = useState(false)
  const [detailTarget, setDetailTarget] = useState<Viaje | null>(null)
  const [editTarget, setEditTarget]     = useState<Viaje | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Viaje | null>(null)
  const [saving, setSaving] = useState(false)

  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7))
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc')

  // Set con los números de semana expandidas. Inicializado en el useEffect de abajo.
  const [semanasExpandidas, setSemanasExpandidas] = useState<Set<number>>(new Set())

  // Al cambiar el mes filtrado, resetear el estado de colapso:
  // todas colapsadas excepto la "semana actual" (la que contiene hoy).
  useEffect(() => {
    const semanas = obtenerSemanasDelMes(mesFiltro)
    const actual = semanas.find(s => s.esActual)
    setSemanasExpandidas(new Set(actual ? [actual.numero] : []))
    setHoveredRowId(null)
  }, [mesFiltro])

  function toggleSemana(numero: number) {
    setSemanasExpandidas(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(numero)) {
        nuevo.delete(numero)
      } else {
        nuevo.add(numero)
      }
      return nuevo
    })
    // Reset del hover: si una fila estaba con hover y se colapsa su semana,
    // queda fantasma en el estado. Limpiarlo evita el flash al re-expandir.
    setHoveredRowId(null)
  }

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]))
  const fleteroMap = Object.fromEntries(fleteros.map(f => [f.id, f.nombre]))

  const viajesFiltrados = useMemo(() => {
    const filtrados = viajes.filter(v => v.fecha.startsWith(mesFiltro))

    // Ordenamiento por fecha. Empate por id para que sea determinístico.
    const sorted = [...filtrados].sort((a, b) => {
      const cmpFecha = a.fecha.localeCompare(b.fecha)
      if (cmpFecha !== 0) return orden === 'asc' ? cmpFecha : -cmpFecha
      return orden === 'asc' ? a.id - b.id : b.id - a.id
    })
    return sorted
  }, [viajes, mesFiltro, orden])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (dto: CreateViajeDTO | Partial<CreateViajeDTO>) => {
    await crearViaje(dto as CreateViajeDTO)
    setCreateOpen(false)
  }

  const handleEdit = async (dto: CreateViajeDTO | Partial<CreateViajeDTO>) => {
    if (!editTarget) return
    const actualizado = await editarViaje(editTarget.id, dto)
    setEditTarget(null)
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
      setDetailTarget(null)
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

      {/* Header — dos filas. Constantes al tope del archivo controlan los gaps. */}

      {/* Fila superior: botón nuevo viaje (izq) + navegador de mes (centro) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: GAP_ENTRE_FILAS_HEADER }}>
        <div>
          <Button onClick={() => setCreateOpen(true)}>+ Nuevo viaje</Button>
        </div>

        <div>
          <MesNavigator
            mes={mesFiltro}
            onChange={(nuevo) => nuevo !== null && setMesFiltro(nuevo)}
          />
        </div>

        <div />
      </div>

      {/* Fila inferior: toggle de orden (izq) + leyenda (der) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: GAP_ENTRE_HEADER_Y_TABLA }}>
        <div>
          <OrdenToggle orden={orden} onChange={setOrden} />
        </div>

        <div />

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
            ) : (() => {
              const gruposBase = agruparViajesPorSemanaReal(viajesFiltrados, mesFiltro)

              // Orden desc: invertir el orden de los grupos para que la última semana
              // del mes aparezca al tope. Los viajes dentro ya están ordenados por
              // viajesFiltrados (sort por fecha+id).
              const grupos = orden === 'desc' ? [...gruposBase].reverse() : gruposBase

              // Calculamos cuántos viajes se renderizan en total para saber cuál
              // es la última fila visible y no ponerle border-bottom.
              const totalViajesVisibles = grupos.reduce(
                (acc, g) => acc + (semanasExpandidas.has(g.semana.numero) ? g.viajes.length : 0),
                0,
              )
              let viajesRenderizados = 0

              return grupos.map(grupo => {
                const expandida = semanasExpandidas.has(grupo.semana.numero)
                const esActual = grupo.semana.esActual
                const caret = expandida ? '▼' : '▶'

                const headerBg = esActual ? SEMANA_ACTUAL.bgDestacado : DIVISORIA_BG_DEFAULT
                const headerColor = esActual ? theme.colors.primary : DIVISORIA_COLOR_DEFAULT

                return (
                  <React.Fragment key={`grupo-${grupo.semana.numero}`}>
                    <tr
                      onClick={() => toggleSemana(grupo.semana.numero)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td
                        colSpan={COLUMNAS.length}
                        style={{
                          background: headerBg,
                          color: headerColor,
                          padding: '10px 16px',
                          fontFamily: theme.font.family,
                          fontSize: theme.font.size.xs,
                          fontWeight: theme.font.weight.semibold,
                          letterSpacing: '0.06em',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ display: 'inline-block', width: '14px', marginRight: '8px' }}>
                          {caret}
                        </span>
                        {grupo.semana.labelHeader}
                        <span style={{ marginLeft: '12px', opacity: 0.7, fontWeight: theme.font.weight.medium }}>
                          ({grupo.viajes.length} {grupo.viajes.length === 1 ? 'viaje' : 'viajes'})
                        </span>
                      </td>
                    </tr>

                    {expandida && grupo.viajes.map(v => {
                      const idx = viajesRenderizados++
                      const ganancia    = v.valorCliente - v.costoFletero
                      const isHovered   = hoveredRowId === v.id
                      const cobBg       = getRowCellBg(v.estadoFacturaCobranza,    v.vencimientoCobranza,    isHovered)
                      const fletBg      = getRowCellBg(v.estadoFacturaPagoFletero, v.vencimientoPagoFletero, isHovered)
                      const borderColor = isHovered ? theme.colors.border : theme.colors.borderLight
                      return (
                        <tr
                          key={v.id}
                          onClick={() => setDetailTarget(v)}
                          onMouseEnter={() => setHoveredRowId(v.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: idx < totalViajesVisibles - 1 ? `1px solid ${borderColor}` : 'none',
                            borderTop: isHovered ? `1px solid ${borderColor}` : 'none',
                          }}
                        >
                          <td style={{ background: cobBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                            {v.id}
                          </td>
                          <td style={{ background: cobBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>
                            {formatFecha(v.fecha)}
                          </td>
                          <td style={{ background: cobBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                            {resolveClienteNombre(v)}
                          </td>
                          <td style={{ background: cobBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>
                            {v.numeroFacturaCobranza ?? '—'}
                          </td>
                          <td style={{ background: cobBg, padding: '14px 16px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                            {formatMoney(v.valorCliente)}
                          </td>
                          <td style={{ background: fletBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary }}>
                            {resolveFleteroNombre(v)}
                          </td>
                          <td style={{ background: fletBg, padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>
                            {v.numeroFacturaPagoFletero ?? '—'}
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
                                e.stopPropagation()
                                setDeleteTarget(v)
                              }}
                            >
                              ×
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })
            })()}
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
          if (detailTarget) {
            setEditTarget(detailTarget)
            setDetailTarget(null)
          }
        }}
        onDelete={() => {
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
