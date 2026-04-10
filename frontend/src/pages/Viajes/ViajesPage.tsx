import { useState } from 'react'
import { useViajes } from '../../hooks/useViajes'
import { useClientes } from '../../hooks/useClientes'
import { useFleteros } from '../../hooks/useFleteros'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import type { Viaje } from '../../types'

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

export function ViajesPage() {
  const { viajes, loading, error, crearViaje, eliminarViaje } = useViajes()
  const { clientes } = useClientes()
  const { fleteros } = useFleteros()

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Viaje | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]))
  const fleteroMap = Object.fromEntries(fleteros.map(f => [f.id, f.nombre]))

  const openCrear = () => {
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.fecha) { setFormError('La fecha es requerida'); return }
    if (!form.clienteId) { setFormError('Seleccioná un cliente'); return }
    if (!form.valorCliente || Number(form.valorCliente) <= 0) { setFormError('Ingresá el valor del viaje'); return }
    if (!form.fleteroId) { setFormError('Seleccioná un fletero'); return }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.textPrimary }}>
          Viajes
        </h1>
        <Button onClick={openCrear}>+ Ingresar viaje</Button>
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
                { label: 'Fecha',    align: 'left'  },
                { label: 'Cliente',  align: 'left'  },
                { label: 'Valor',    align: 'right' },
                { label: 'Fletero',  align: 'left'  },
                { label: 'Costo',    align: 'right' },
                { label: 'Ganancia', align: 'right' },
                { label: '',         align: 'right' },
              ].map(col => (
                <th key={col.label} style={{ padding: '12px 20px', textAlign: col.align as 'left' | 'right', fontFamily: theme.font.family, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', background: theme.colors.surfaceHover }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>Cargando...</td></tr>
            ) : viajes.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>No hay viajes cargados</td></tr>
            ) : viajes.map((v, i) => {
              const ganancia = v.valorCliente - v.costoFletero
              return (
                <tr
                  key={v.id}
                  style={{ borderBottom: i < viajes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.colors.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {formatFecha(v.fecha)}
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                    {v.clienteNombre || clienteMap[v.clienteId] || `Cliente ${v.clienteId}`}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(v.valorCliente)}
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary }}>
                    {v.fleteroNombre || fleteroMap[v.fleteroId] || `Fletero ${v.fleteroId}`}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(v.costoFletero)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semibold, color: ganancia >= 0 ? theme.colors.primary : theme.colors.danger, fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(ganancia)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(v)}>Eliminar</Button>
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