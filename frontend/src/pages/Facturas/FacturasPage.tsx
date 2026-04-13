import { useState, useMemo } from 'react'
import { useFacturas } from '../../hooks/useFacturas'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { TipoBadge } from '../../components/Badge'
import { theme } from '../../theme'
import type { Factura, FacturarDTO } from '../../types'

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

type FiltroTitular = 'clientes' | 'fleteros' | null

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
}

const tdBaseStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textSecondary,
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <h2 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.semibold, color: theme.colors.textPrimary }}>
        {title}
      </h2>
      {action}
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

export function FacturasPage() {
  const [filtroTitular, setFiltroTitular] = useState<FiltroTitular>(null)
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [modalFacturar, setModalFacturar] = useState(false)
  const [facturarForm, setFacturarForm] = useState<FacturarDTO>({
    numero: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    vencimiento: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pagarTarget, setPagarTarget] = useState<{ numero: string; items: Factura[] } | null>(null)
  const [revertirTarget, setRevertirTarget] = useState<{ numero: string; items: Factura[] } | null>(null)

  const { facturas, loading, error, facturarLote, pagar, revertir } = useFacturas()
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

  const getNombre = (f: Factura) => {
    if (f.clienteId) return clienteMap[f.clienteId] ?? `Cliente ${f.clienteId}`
    if (f.fleteroId) return fleteroMap[f.fleteroId] ?? `Fletero ${f.fleteroId}`
    return '—'
  }

  // Excluye pago_servicio siempre. Aplica filtro de titular.
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      if (f.tipo === 'pago_servicio') return false
      if (filtroTitular === 'clientes') return f.tipo === 'cobranza'
      if (filtroTitular === 'fleteros') return f.tipo === 'pago_fletero'
      return true
    })
  }, [facturas, filtroTitular])

  const pendientes = useMemo(
    () => facturasFiltradas.filter(f => f.estado === 'sin_facturar'),
    [facturasFiltradas]
  )

  const emitidas = useMemo(
    () => facturasFiltradas.filter(f => f.estado === 'facturada'),
    [facturasFiltradas]
  )

  const historial = useMemo(
    () => facturasFiltradas.filter(f => f.estado === 'pagada'),
    [facturasFiltradas]
  )

  // Agrupa emitidas por número de factura
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
  }, [emitidas])

  // Validación de selección: todos deben tener el mismo titular
  const facturasSeleccionadas = pendientes.filter(f => seleccionados.has(f.id))
  const titularesUnicos = new Set(facturasSeleccionadas.map(f => f.clienteId ?? f.fleteroId))
  const seleccionValida = seleccionados.size > 0 && titularesUnicos.size === 1

  const cancelarModoSeleccion = () => {
    setModoSeleccion(false)
    setSeleccionados(new Set())
  }

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAbrirModalFacturar = () => {
    setFacturarForm({
      numero: '',
      fechaEmision: new Date().toISOString().slice(0, 10),
      vencimiento: '',
    })
    setFormError(null)
    setModalFacturar(true)
  }

  const handleConfirmarFacturar = async () => {
    if (!facturarForm.numero.trim()) { setFormError('El número es requerido'); return }
    if (!facturarForm.vencimiento)   { setFormError('El vencimiento es requerido'); return }
    setSaving(true)
    setFormError(null)
    try {
      await facturarLote(Array.from(seleccionados), facturarForm)
      setModalFacturar(false)
      cancelarModoSeleccion()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al facturar')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarRevertir = async () => {
    if (!revertirTarget) return
    setSaving(true)
    try {
      for (const f of revertirTarget.items) {
        await revertir(f.id)
      }
      setRevertirTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const handlePagar = async () => {
    if (!pagarTarget) return
    setSaving(true)
    try {
      for (const f of pagarTarget.items) {
        await pagar(f.id)
      }
      setPagarTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const filtroBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: theme.font.family,
    fontSize: theme.font.size.sm,
    fontWeight: active ? theme.font.weight.semibold : theme.font.weight.regular,
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    background: active ? theme.colors.primary : 'transparent',
    color: active ? '#fff' : theme.colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const tableWrapper: React.CSSProperties = {
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
    overflow: 'hidden',
    boxShadow: theme.shadow.sm,
    marginBottom: '40px',
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', fontFamily: theme.font.family, color: theme.colors.textMuted }}>
        Cargando...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        {/*<h1 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.textPrimary }}>
          Facturas
        </h1>
        */}
        {/* Filtro titular */}
        <div style={{ display: 'flex', gap: '4px', background: theme.colors.surfaceHover, borderRadius: '10px', padding: '4px' }}>
          <button style={filtroBtn(filtroTitular === 'clientes')} onClick={() => setFiltroTitular(prev => prev === 'clientes' ? null : 'clientes')}>
            Clientes
          </button>
          <button style={filtroBtn(filtroTitular === 'fleteros')} onClick={() => setFiltroTitular(prev => prev === 'fleteros' ? null : 'fleteros')}>
            Fleteros
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: theme.colors.dangerLight, color: theme.colors.danger, padding: '12px 16px', borderRadius: theme.radius.md, marginBottom: '24px', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
          {error}
        </div>
      )}

      {/* ── Sección 1: Pendientes ── */}
      <SectionHeader
        title="Pendientes de facturar"
        action={
          modoSeleccion ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {seleccionados.size > 0 && !seleccionValida && (
                <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.danger }}>
                  Titulares distintos
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={cancelarModoSeleccion}>Cancelar</Button>
              <Button size="sm" onClick={handleAbrirModalFacturar} disabled={!seleccionValida}>
                Confirmar ({seleccionados.size})
              </Button>
            </div>
          ) : (
            <Button onClick={() => setModoSeleccion(true)}>Facturar</Button>
          )
        }
      />
      <div style={tableWrapper}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {modoSeleccion && <th style={{ ...thStyle, width: '40px' }} />}
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Titular</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
              <th style={thStyle}>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.length === 0 ? (
              <EmptyRow colSpan={modoSeleccion ? 5 : 4} />
            ) : pendientes.map((f, i) => {
              const seleccionada = seleccionados.has(f.id)
              return (
                <tr
                  key={f.id}
                  style={{
                    borderBottom: i < pendientes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none',
                    background: seleccionada ? theme.colors.primaryLight : 'transparent',
                    cursor: modoSeleccion ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => { if (modoSeleccion) toggleSeleccion(f.id) }}
                  onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = theme.colors.surfaceHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = seleccionada ? theme.colors.primaryLight : 'transparent' }}
                >
                  {modoSeleccion && (
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={seleccionada}
                        onChange={() => toggleSeleccion(f.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer', accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '12px 16px' }}><TipoBadge tipo={f.tipo} /></td>
                  <td style={{ ...tdBaseStyle, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                    {getNombre(f)}
                  </td>
                  <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>
                    {formatMoney(f.monto)}
                  </td>
                  <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>
                    {formatFecha(f.vencimiento)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Sección 2: Emitidas ── */}
      <SectionHeader title="Facturas emitidas" />
      <div style={tableWrapper}>
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
                style={{ borderBottom: i < gruposEmitidas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none', transition: 'background 0.1s' }}
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
                  {formatMoney(grupo.montoTotal)}
                </td>
                <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(grupo.vencimiento)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="secondary" onClick={() => setRevertirTarget({ numero: grupo.numero, items: grupo.items })}>
                      Revertir
                    </Button>
                    <Button size="sm" onClick={() => setPagarTarget({ numero: grupo.numero, items: grupo.items })}>
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
      <div style={{ ...tableWrapper, opacity: 0.85 }}>
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
            {historial.length === 0 ? (
              <EmptyRow colSpan={5} />
            ) : historial.map((f, i) => (
              <tr
                key={f.id}
                style={{ borderBottom: i < historial.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = theme.colors.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...tdBaseStyle, fontVariantNumeric: 'tabular-nums' }}>{f.numero ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}><TipoBadge tipo={f.tipo} /></td>
                <td style={tdBaseStyle}>{getNombre(f)}</td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(f.monto)}</td>
                <td style={{ ...tdBaseStyle, whiteSpace: 'nowrap' }}>{formatFecha(f.vencimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: emitir factura */}
      <Modal open={modalFacturar} onClose={() => setModalFacturar(false)} title="Emitir factura" width="420px">
        <div style={{ marginBottom: '16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
          Se aplicará a{' '}
          <strong style={{ color: theme.colors.textPrimary }}>
            {seleccionados.size} {seleccionados.size === 1 ? 'viaje' : 'viajes'}
          </strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Número de factura" required error={formError || undefined}>
            <input
              style={inputStyle}
              value={facturarForm.numero}
              onChange={e => setFacturarForm(p => ({ ...p, numero: e.target.value }))}
              placeholder="Ej: 0001-00001234"
              autoFocus
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Fecha de emisión" required>
              <input
                style={inputStyle}
                type="date"
                value={facturarForm.fechaEmision}
                onChange={e => setFacturarForm(p => ({ ...p, fechaEmision: e.target.value }))}
              />
            </FormField>
            <FormField label="Vencimiento" required>
              <input
                style={inputStyle}
                type="date"
                value={facturarForm.vencimiento}
                onChange={e => setFacturarForm(p => ({ ...p, vencimiento: e.target.value }))}
              />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="secondary" onClick={() => setModalFacturar(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarFacturar} loading={saving}>Confirmar</Button>
          </div>
        </div>
      </Modal>

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
            {pagarTarget && formatMoney(pagarTarget.items.reduce((sum, f) => sum + f.monto, 0))}
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