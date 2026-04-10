import { useState } from 'react'
import { useFacturas } from '../../hooks/useFacturas'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { EstadoBadge, TipoBadge } from '../../components/Badge'
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

export function FacturasPage() {
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const { facturas, loading, error, facturar, pagar } = useFacturas({
    estado: filtroEstado || undefined,
    tipo: filtroTipo || undefined,
  })
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  const [facturarTarget, setFacturarTarget] = useState<Factura | null>(null)
  const [pagarTarget, setPagarTarget] = useState<Factura | null>(null)
  const [facturarForm, setFacturarForm] = useState<FacturarDTO>({
    numero: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    vencimiento: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]))
  const fleteroMap = Object.fromEntries(fleteros.map(f => [f.id, f.nombre]))

  const getTitular = (f: Factura) => {
    if (f.clienteId) return clienteMap[f.clienteId] || `Cliente ${f.clienteId}`
    if (f.fleteroId) return fleteroMap[f.fleteroId] || `Fletero ${f.fleteroId}`
    return f.descripcion || '—'
  }

  const openFacturar = (f: Factura) => {
    setFacturarTarget(f)
    setFacturarForm({ numero: '', fechaEmision: new Date().toISOString().slice(0, 10), vencimiento: '' })
    setFormError(null)
  }

  const handleFacturar = async () => {
    if (!facturarForm.numero.trim()) { setFormError('El número es requerido'); return }
    if (!facturarForm.vencimiento) { setFormError('El vencimiento es requerido'); return }
    setSaving(true)
    setFormError(null)
    try {
      await facturar(facturarTarget!.id, facturarForm)
      setFacturarTarget(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al facturar')
    } finally {
      setSaving(false)
    }
  }

  const handlePagar = async () => {
    if (!pagarTarget) return
    setSaving(true)
    try {
      await pagar(pagarTarget.id)
      setPagarTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: theme.font.family,
    fontSize: theme.font.size.sm,
    fontWeight: active ? theme.font.weight.medium : theme.font.weight.regular,
    padding: '6px 14px',
    borderRadius: '20px',
    border: active ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
    background: active ? theme.colors.primaryLight : theme.colors.surface,
    color: active ? theme.colors.primary : theme.colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.textPrimary }}>
          Facturas
        </h1>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginRight: '2px' }}>Estado</span>
          {[
            { value: '',             label: 'Todos' },
            { value: 'sin_facturar', label: 'Sin facturar' },
            { value: 'facturada',    label: 'Facturada' },
            { value: 'pagada',       label: 'Pagada' },
          ].map(opt => (
            <button key={opt.value} style={filterBtn(filtroEstado === opt.value)} onClick={() => setFiltroEstado(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ width: '1px', background: theme.colors.border, height: '24px' }} />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginRight: '2px' }}>Tipo</span>
          {[
            { value: '',             label: 'Todos' },
            { value: 'cobranza',     label: 'Cobranza' },
            { value: 'pago_fletero', label: 'Pago fletero' },
          ].map(opt => (
            <button key={opt.value} style={filterBtn(filtroTipo === opt.value)} onClick={() => setFiltroTipo(opt.value)}>
              {opt.label}
            </button>
          ))}
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
              {[
                { label: 'Tipo',        align: 'left'  },
                { label: 'Titular',     align: 'left'  },
                { label: 'Monto',       align: 'right' },
                { label: 'N° Factura',  align: 'left'  },
                { label: 'Emisión',     align: 'left'  },
                { label: 'Vencimiento', align: 'left'  },
                { label: 'Estado',      align: 'left'  },
                { label: '',            align: 'right' },
              ].map(col => (
                <th key={col.label} style={{ padding: '12px 16px', textAlign: col.align as 'left' | 'right', fontFamily: theme.font.family, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', background: theme.colors.surfaceHover, whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>Cargando...</td></tr>
            ) : facturas.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>No hay facturas</td></tr>
            ) : facturas.map((f, i) => (
              <tr
                key={f.id}
                style={{ borderBottom: i < facturas.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.colors.surfaceHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}><TipoBadge tipo={f.tipo} /></td>
                <td style={{ padding: '12px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>{getTitular(f)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, fontVariantNumeric: 'tabular-nums', color: theme.colors.textPrimary }}>{formatMoney(f.monto)}</td>
                <td style={{ padding: '12px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: f.numero ? theme.colors.textPrimary : theme.colors.textMuted }}>{f.numero || '—'}</td>
                <td style={{ padding: '12px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>{formatFecha(f.fechaEmision)}</td>
                <td style={{ padding: '12px 16px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>{formatFecha(f.vencimiento)}</td>
                <td style={{ padding: '12px 16px' }}><EstadoBadge estado={f.estado} /></td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {f.estado === 'sin_facturar' && (
                      <Button size="sm" variant="secondary" onClick={() => openFacturar(f)}>Facturar</Button>
                    )}
                    {f.estado === 'facturada' && (
                      <Button size="sm" variant="secondary" onClick={() => setPagarTarget(f)}>Registrar pago</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal facturar */}
      <Modal open={!!facturarTarget} onClose={() => setFacturarTarget(null)} title="Facturar" width="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Número de factura" required error={formError || undefined}>
            <input style={inputStyle} value={facturarForm.numero} onChange={e => setFacturarForm(p => ({ ...p, numero: e.target.value }))} placeholder="Ej: 0001-00001234" autoFocus />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Fecha de emisión" required>
              <input style={inputStyle} type="date" value={facturarForm.fechaEmision} onChange={e => setFacturarForm(p => ({ ...p, fechaEmision: e.target.value }))} />
            </FormField>
            <FormField label="Vencimiento" required>
              <input style={inputStyle} type="date" value={facturarForm.vencimiento} onChange={e => setFacturarForm(p => ({ ...p, vencimiento: e.target.value }))} />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="secondary" onClick={() => setFacturarTarget(null)}>Cancelar</Button>
            <Button onClick={handleFacturar} loading={saving}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar pago */}
      <Modal open={!!pagarTarget} onClose={() => setPagarTarget(null)} title="Registrar pago" width="400px">
        <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary, marginBottom: '20px', lineHeight: 1.6 }}>
          ¿Confirmar el pago de la factura <strong style={{ color: theme.colors.textPrimary }}>{pagarTarget?.numero}</strong> por <strong style={{ color: theme.colors.textPrimary }}>{pagarTarget && formatMoney(pagarTarget.monto)}</strong>?
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setPagarTarget(null)}>Cancelar</Button>
          <Button onClick={handlePagar} loading={saving}>Confirmar pago</Button>
        </div>
      </Modal>
    </div>
  )
}