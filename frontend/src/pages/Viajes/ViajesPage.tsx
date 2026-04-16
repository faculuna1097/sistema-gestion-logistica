// frontend/src/pages/Viajes/ViajesPage.tsx

import { useState, useMemo } from 'react'
import { useViajes } from '../../hooks/useViajes'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import type { Viaje, EstadoFactura } from '../../types'

// ─── Configuración visual ─────────────────────────────────────────────────────

// Días restantes para considerar una factura "por vencer"
const DIAS_ALERTA = 7

// Opacidad del color de fondo de las filas (0 = sin color, 1 = sólido)
const ROW_COLOR_OPACITY = 0.1

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const HOY = new Date().toISOString().slice(0, 10)

const LIMITE_POR_VENCER = new Date(Date.now() + DIAS_ALERTA * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10)

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
function getEstadoVisual(
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

// Convierte un hex a rgba aplicando la opacidad configurada
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Devuelve el color de fondo para una celda según el estado de su factura
function getRowCellBg(estado: EstadoFactura | null, vencimiento: string | null): string {
  const { bgHex } = getEstadoVisual(estado, vencimiento)
  return bgHex ? hexToRgba(bgHex, ROW_COLOR_OPACITY) : 'transparent'
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

// ─── Formulario ───────────────────────────────────────────────────────────────

interface FormState {
  fecha: string
  clienteId: string
  valorCliente: string
  fleteroId: string
  costoFletero: string
}

const emptyForm: FormState = {
  fecha: new Date().toISOString().slice(0, 10),
  clienteId: '',
  valorCliente: '',
  fleteroId: '',
  costoFletero: '',
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ViajesPage() {
  const { viajes, loading, error, crearViaje, eliminarViaje } = useViajes()
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Viaje | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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

  const openCrear = () => {
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.fecha)                                          { setFormError('La fecha es requerida');         return }
    if (!form.clienteId)                                      { setFormError('Seleccioná un cliente');         return }
    if (!form.valorCliente || Number(form.valorCliente) <= 0) { setFormError('Ingresá el valor del viaje');    return }
    if (!form.fleteroId)                                      { setFormError('Seleccioná un fletero');         return }
    if (!form.costoFletero || Number(form.costoFletero) <= 0) { setFormError('Ingresá el costo del fletero'); return }

    setSaving(true)
    setFormError(null)
    try {
      await crearViaje({
        fecha: form.fecha,
        clienteId: Number(form.clienteId),
        valorCliente: Number(form.valorCliente),
        fleteroId: Number(form.fleteroId),
        costoFletero: Number(form.costoFletero),
      })
      setModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear el viaje')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await eliminarViaje(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const gananciaPreview = form.valorCliente && form.costoFletero
    ? Number(form.valorCliente) - Number(form.costoFletero)
    : null

  return (
    <div style={{ padding: '32px' }}>

      {/* Header: grid 3 columnas para centrado exacto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '24px' }}>

        {/* Izquierda: botón nuevo viaje */}
        <div>
          <Button onClick={openCrear}>+ Nuevo viaje</Button>
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
              const ganancia = v.valorCliente - v.costoFletero
              const cobBg    = getRowCellBg(v.estadoFacturaCobranza,    v.vencimientoCobranza)
              const fletBg   = getRowCellBg(v.estadoFacturaPagoFletero, v.vencimientoPagoFletero)
              return (
                <tr
                  key={v.id}
                  style={{ borderBottom: i < viajesFiltrados.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none' }}
                >
                  <td style={{ background: cobBg,  padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {formatFecha(v.fecha)}
                  </td>
                  <td style={{ background: cobBg,  padding: '14px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                    {v.clienteNombre || clienteMap[v.clienteId] || `Cliente ${v.clienteId}`}
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
                    {v.fleteroNombre || fleteroMap[v.fleteroId] || `Fletero ${v.fleteroId}`}
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
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(v)}>×</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo viaje */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ingresar viaje" width="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Fecha" required>
            <input style={inputStyle} type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Cliente" required>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.clienteId} onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Valor del viaje" required>
              <input style={inputStyle} type="number" min={0} placeholder="0" value={form.valorCliente} onChange={e => setForm(p => ({ ...p, valorCliente: e.target.value }))} />
            </FormField>
          </div>

          <div style={{ borderTop: `1px solid ${theme.colors.borderLight}` }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Fletero" required>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.fleteroId} onChange={e => setForm(p => ({ ...p, fleteroId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {fleteros.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Costo del fletero" required>
              <input style={inputStyle} type="number" min={0} placeholder="0" value={form.costoFletero} onChange={e => setForm(p => ({ ...p, costoFletero: e.target.value }))} />
            </FormField>
          </div>

          {gananciaPreview !== null && (
            <div style={{ background: theme.colors.primaryLight, borderRadius: theme.radius.md, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.primary, fontWeight: theme.font.weight.medium }}>
                Ganancia estimada
              </span>
              <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: gananciaPreview >= 0 ? theme.colors.primary : theme.colors.danger }}>
                {formatMoney(gananciaPreview)}
              </span>
            </div>
          )}

          {formError && (
            <div style={{ color: theme.colors.danger, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={saving}>Ingresar viaje</Button>
          </div>
        </div>
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