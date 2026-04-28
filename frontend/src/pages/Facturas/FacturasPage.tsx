// frontend/src/pages/Facturas/FacturasPage.tsx

import { useState, useMemo } from 'react'
import { useFacturas } from '../../hooks/useFacturas'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { useViajes } from '../../hooks/useViajes'
import { armarPreviewDesdeFacturas } from '../../hooks/useFacturaWizard'
import type { FacturaPreviewData } from '../../hooks/useFacturaWizard'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { TipoBadge } from '../../components/Badge'
import { PillButton } from '../../components/PillButton'
import { NuevaFacturaModal } from './NuevaFacturaModal'
import { FacturaDetailModal } from './FacturaDetailModal'
import { theme } from '../../theme'
import { formatFecha, formatMoneyRound } from '../../utils/format'
import { thStyle, tdBaseStyle, tableWrapper } from '../../components/tableStyles'
import type { Factura } from '../../types'

type FiltroTitular = 'clientes' | 'fleteros' | null

interface DetailTarget {
  preview: FacturaPreviewData
  numero: string | null
  fechaEmision: string | null
  vencimiento: string | null
  cuit: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calcula cuántos días han pasado desde una fecha YYYY-MM-DD hasta hoy.
 * Usa T12:00:00 para evitar el corrimiento UTC-3 que podría cruzar de día.
 */
function diasDesde(fecha: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const d = new Date(fecha + 'T12:00:00')
  d.setHours(0, 0, 0, 0)
  return Math.floor((hoy.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

const UMBRAL_DIAS_ALERTA = 20

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        {action}
      </div>
      <h2 style={{
        margin: 0,
        fontFamily: theme.font.family,
        fontSize: theme.font.size.lg,
        fontWeight: theme.font.weight.semibold,
        color: theme.colors.textPrimary,
      }}>
        {title}
      </h2>
      <div style={{ flex: 1 }} />
    </div>
  )
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
        No hay registros
      </td>
    </tr>
  )
}

const sectionTableWrapper: React.CSSProperties = {
  ...tableWrapper,
  marginBottom: '40px',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FacturasPage() {
  // ── Estado ───────────────────────────────────────────────────────────────
  const [filtroTitular, setFiltroTitular] = useState<FiltroTitular>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null)
  const [pagarTarget, setPagarTarget] = useState<{ numero: string; items: Factura[] } | null>(null)
  const [revertirTarget, setRevertirTarget] = useState<{ numero: string; items: Factura[] } | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Datos externos ───────────────────────────────────────────────────────
  const { facturas, loading, error, facturarLote, pagar, revertir } = useFacturas()
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()
  const { viajes } = useViajes()

  // Mapas auxiliares
  const clienteMap = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c.nombre])),
    [clientes]
  )
  const fleteroMap = useMemo(
    () => Object.fromEntries(fleteros.map(f => [f.id, f.nombre])),
    [fleteros]
  )
  const clienteByIdMap = useMemo(
    () => Object.fromEntries(clientes.map(c => [c.id, c])),
    [clientes]
  )
  const fleteroByIdMap = useMemo(
    () => Object.fromEntries(fleteros.map(f => [f.id, f])),
    [fleteros]
  )

  // Mapa de viajes por id — para el cruce de fechas en gruposPendientes.
  const viajesPorId = useMemo(
    () => new Map(viajes.map(v => [v.id, v])),
    [viajes]
  )

  const getNombre = (f: Factura) => {
    if (f.clienteId) return clienteMap[f.clienteId] ?? `Cliente ${f.clienteId}`
    if (f.fleteroId) return fleteroMap[f.fleteroId] ?? `Fletero ${f.fleteroId}`
    return '—'
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      if (f.tipo === 'pago_servicio') return false
      if (filtroTitular === 'clientes') return f.tipo === 'cobranza'
      if (filtroTitular === 'fleteros') return f.tipo === 'pago_fletero'
      return true
    })
  }, [facturas, filtroTitular])

  const pendientes = useMemo(() => facturasFiltradas.filter(f => f.estado === 'sin_facturar'), [facturasFiltradas])
  const emitidas   = useMemo(() => facturasFiltradas.filter(f => f.estado === 'facturada'),    [facturasFiltradas])
  const historial  = useMemo(() => facturasFiltradas.filter(f => f.estado === 'pagada'),       [facturasFiltradas])

  // ── Agrupamiento de pendientes por titular ───────────────────────────────
  //
  // Clave: `tipo|titularId` — garantiza que cobranza y pago_fletero del mismo
  // actor aparezcan como filas separadas (son documentos distintos).
  //
  // fechaMasAntigua: mínimo de viaje.fecha entre los viajes del grupo.
  // Si un viajeId no está en viajesPorId (caso defensivo), se ignora para
  // el cálculo de fecha — el grupo puede quedar sin fecha (null).
  const gruposPendientes = useMemo(() => {
    const map = new Map<string, {
      tipo: Factura['tipo']
      titularId: number
      titular: string
      montoTotal: number
      facturas: Factura[]
      fechas: string[]   // fechas de viajes del grupo, para calcular la más antigua
    }>()

    for (const f of pendientes) {
      const titularId = f.clienteId ?? f.fleteroId
      if (titularId === null) continue
      const key = `${f.tipo}|${titularId}`

      if (!map.has(key)) {
        map.set(key, {
          tipo: f.tipo,
          titularId,
          titular: getNombre(f),
          montoTotal: 0,
          facturas: [],
          fechas: [],
        })
      }

      const grupo = map.get(key)!
      grupo.montoTotal += f.monto
      grupo.facturas.push(f)

      // Cruzar con viaje para obtener la fecha
      if (f.viajeId !== null) {
        const viaje = viajesPorId.get(f.viajeId)
        if (viaje) grupo.fechas.push(viaje.fecha)
      }
    }

    return Array.from(map.values()).map(g => ({
      tipo:             g.tipo,
      titular:          g.titular,
      cantidadViajes:   g.facturas.length,
      montoTotal:       g.montoTotal,
      // El mínimo de strings YYYY-MM-DD funciona con comparación lexicográfica
      // directa — mismo resultado que comparar Date objects.
      fechaMasAntigua:  g.fechas.length > 0
        ? g.fechas.reduce((min, f) => f < min ? f : min)
        : null,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendientes, viajesPorId, clienteMap, fleteroMap])

  // ── Agrupamiento de emitidas e historial ─────────────────────────────────
  const gruposEmitidas = useMemo(() => {
    const map = new Map<string, Factura[]>()
    for (const f of emitidas) {
      const key = f.numero ?? `__${f.id}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries()).map(([numero, items]) => ({
      numero,
      items,
      titular: getNombre(items[0]),
      tipo: items[0].tipo,
      montoTotal: items.reduce((sum, f) => sum + f.monto, 0),
      vencimiento: items[0].vencimiento,
      count: items.length,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emitidas, clienteMap, fleteroMap])

  const gruposHistorial = useMemo(() => {
    const map = new Map<string, Factura[]>()
    for (const f of historial) {
      const key = f.numero ?? `__${f.id}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries()).map(([numero, items]) => ({
      numero,
      items,
      titular: getNombre(items[0]),
      tipo: items[0].tipo,
      montoTotal: items.reduce((sum, f) => sum + f.monto, 0),
      vencimiento: items[0].vencimiento,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historial, clienteMap, fleteroMap])

  // ── Handlers de detail ───────────────────────────────────────────────────
  const handleAbrirDetail = (items: Factura[]) => {
    if (items.length === 0) return
    const primera = items[0]
    const tipo = primera.tipo === 'cobranza' ? 'cliente'
              : primera.tipo === 'pago_fletero' ? 'fletero'
              : null
    if (tipo === null) return

    let actorId: number | null = null
    let actorNombre = '—'
    let cuit: string | null = null

    if (tipo === 'cliente' && primera.clienteId !== null) {
      actorId = primera.clienteId
      const cliente = clienteByIdMap[primera.clienteId]
      if (cliente) { actorNombre = cliente.nombre; cuit = cliente.cuit }
    } else if (tipo === 'fletero' && primera.fleteroId !== null) {
      actorId = primera.fleteroId
      const fletero = fleteroByIdMap[primera.fleteroId]
      if (fletero) { actorNombre = fletero.nombre; cuit = fletero.cuit }
    }

    if (actorId === null) return

    const preview = armarPreviewDesdeFacturas(
      tipo,
      { id: actorId, nombre: actorNombre },
      items,
      viajes,
      primera.incluyeIva,
      clienteMap
    )

    setDetailTarget({ preview, numero: primera.numero, fechaEmision: primera.fechaEmision, vencimiento: primera.vencimiento, cuit })
  }

  // ── Handlers de revertir / pagar ─────────────────────────────────────────
  const handleConfirmarRevertir = async () => {
    if (!revertirTarget) return
    setSaving(true)
    try {
      for (const f of revertirTarget.items) await revertir(f.id)
      setRevertirTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const handlePagar = async () => {
    if (!pagarTarget) return
    setSaving(true)
    try {
      for (const f of pagarTarget.items) await pagar(f.id)
      setPagarTarget(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '32px', fontFamily: theme.font.family, color: theme.colors.textMuted }}>Cargando...</div>
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Header: filtro Clientes/Fleteros centrado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '32px' }}>
        <div />
        <div style={{ display: 'flex', gap: '8px' }}>
          <PillButton
            label="Clientes"
            active={filtroTitular === 'clientes'}
            onClick={() => setFiltroTitular(prev => prev === 'clientes' ? null : 'clientes')}
          />
          <PillButton
            label="Fleteros"
            active={filtroTitular === 'fleteros'}
            onClick={() => setFiltroTitular(prev => prev === 'fleteros' ? null : 'fleteros')}
          />
        </div>
        <div />
      </div>

      {error && (
        <div style={{ background: theme.colors.dangerLight, color: theme.colors.danger, padding: '12px 16px', borderRadius: theme.radius.md, marginBottom: '24px', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
          {error}
        </div>
      )}

      {/* ── Sección 1: Pendientes ── */}
      <SectionHeader
        title="Pendientes de facturar"
        action={<Button onClick={() => setWizardOpen(true)}>+ Nueva factura</Button>}
      />
      <div style={sectionTableWrapper}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Titular</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Viajes</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Monto total</th>
              <th style={thStyle}>Desde</th>
            </tr>
          </thead>
          <tbody>
            {gruposPendientes.length === 0 ? (
              <EmptyRow colSpan={5} />
            ) : gruposPendientes.map((grupo, i) => {
              const dias = grupo.fechaMasAntigua !== null ? diasDesde(grupo.fechaMasAntigua) : null
              const colorFecha = dias !== null && dias > UMBRAL_DIAS_ALERTA
                ? theme.colors.danger
                : theme.colors.textSecondary

              return (
                <tr
                  key={`${grupo.tipo}|${grupo.titular}`}
                  style={{
                    borderBottom: i < gruposPendientes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <TipoBadge tipo={grupo.tipo} />
                  </td>
                  <td style={{ ...tdBaseStyle, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                    {grupo.titular}
                  </td>
                  <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {grupo.cantidadViajes}
                  </td>
                  <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                    {formatMoneyRound(grupo.montoTotal)}
                  </td>
                  <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap', color: colorFecha }}>
                    {grupo.fechaMasAntigua !== null ? formatFecha(grupo.fechaMasAntigua) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Sección 2: Emitidas ── */}
      <SectionHeader title="Facturas emitidas" />
      <div style={sectionTableWrapper}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <th style={thStyle}>N° Factura</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Titular</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Viajes</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Vencimiento</th>
              <th style={{ ...thStyle, textAlign: 'right' }} />
            </tr>
          </thead>
          <tbody>
            {gruposEmitidas.length === 0 ? (
              <EmptyRow colSpan={7} />
            ) : gruposEmitidas.map((grupo, i) => (
              <tr
                key={grupo.numero}
                onClick={() => handleAbrirDetail(grupo.items)}
                style={{
                  borderBottom: i < gruposEmitidas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                  transition: 'background 0.1s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.colors.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...tdBaseStyle, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                  {grupo.numero}
                </td>
                <td style={{ padding: '12px 16px' }}><TipoBadge tipo={grupo.tipo} /></td>
                <td style={{ ...tdBaseStyle, color: theme.colors.textPrimary }}>{grupo.titular}</td>
                <td style={{ ...tdBaseStyle, textAlign: 'right' }}>{grupo.count}</td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                  {formatMoneyRound(grupo.montoTotal)}
                </td>
                <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(grupo.vencimiento)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => {
                        e.stopPropagation()
                        setRevertirTarget({ numero: grupo.numero, items: grupo.items })
                      }}
                    >
                      Revertir
                    </Button>
                    <Button
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        setPagarTarget({ numero: grupo.numero, items: grupo.items })
                      }}
                    >
                      Registrar pago
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sección 3: Historial ── */}
      <SectionHeader title="Historial" />
      <div style={{ ...sectionTableWrapper, opacity: 0.85 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <th style={thStyle}>N° Factura</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Titular</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {gruposHistorial.length === 0 ? (
              <EmptyRow colSpan={5} />
            ) : gruposHistorial.map((grupo, i) => (
              <tr
                key={grupo.numero}
                onClick={() => handleAbrirDetail(grupo.items)}
                style={{
                  borderBottom: i < gruposHistorial.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                  transition: 'background 0.1s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.colors.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums' }}>{grupo.numero}</td>
                <td style={{ padding: '12px 16px' }}><TipoBadge tipo={grupo.tipo} /></td>
                <td style={tdBaseStyle}>{grupo.titular}</td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatMoneyRound(grupo.montoTotal)}</td>
                <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(grupo.vencimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wizard de nueva factura */}
      <NuevaFacturaModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onEmitir={facturarLote}
      />

      {/* Detail modal */}
      <FacturaDetailModal
        preview={detailTarget?.preview ?? null}
        numero={detailTarget?.numero ?? null}
        fechaEmision={detailTarget?.fechaEmision ?? null}
        vencimiento={detailTarget?.vencimiento ?? null}
        cuit={detailTarget?.cuit ?? null}
        onClose={() => setDetailTarget(null)}
      />

      {/* Modal: confirmar revertir */}
      <Modal open={!!revertirTarget} onClose={() => setRevertirTarget(null)} title="Revertir factura" width="400px">
        <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary, marginBottom: '20px', lineHeight: 1.6 }}>
          ¿Revertir la factura{' '}
          <strong style={{ color: theme.colors.textPrimary }}>{revertirTarget?.numero}</strong>?
          {revertirTarget && revertirTarget.items.length > 1 && (
            <> Incluye <strong style={{ color: theme.colors.textPrimary }}>{revertirTarget.items.length} viajes</strong>.</>
          )}{' '}
          Los viajes volverán al estado <strong style={{ color: theme.colors.textPrimary }}>sin facturar</strong>.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setRevertirTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmarRevertir} loading={saving}>Revertir</Button>
        </div>
      </Modal>

      {/* Modal: confirmar pago */}
      <Modal open={!!pagarTarget} onClose={() => setPagarTarget(null)} title="Registrar pago" width="400px">
        <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary, marginBottom: '20px', lineHeight: 1.6 }}>
          ¿Confirmar el pago de la factura{' '}
          <strong style={{ color: theme.colors.textPrimary }}>{pagarTarget?.numero}</strong>{' '}
          por{' '}
          <strong style={{ color: theme.colors.textPrimary }}>
            {pagarTarget && formatMoneyRound(pagarTarget.items.reduce((sum, f) => sum + f.monto, 0))}
          </strong>?
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setPagarTarget(null)}>Cancelar</Button>
          <Button onClick={handlePagar} loading={saving}>Confirmar pago</Button>
        </div>
      </Modal>

    </div>
  )
}