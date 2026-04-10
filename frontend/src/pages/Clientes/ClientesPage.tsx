import { useState } from 'react'
import { useClientes } from '../../hooks/useClientes'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import type { Cliente } from '../../types'

interface FormState { nombre: string; periodoVencimiento: string }
const emptyForm: FormState = { nombre: '', periodoVencimiento: '30' }

export function ClientesPage() {
  const { clientes, loading, error, crearCliente, editarCliente, eliminarCliente } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const openCrear = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditar = (c: Cliente) => {
    setEditTarget(c)
    setForm({ nombre: c.nombre, periodoVencimiento: String(c.periodoVencimiento) })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es requerido'); return }
    setSaving(true)
    setFormError(null)
    try {
      const dto = { nombre: form.nombre.trim(), periodoVencimiento: Number(form.periodoVencimiento) || 30 }
      if (editTarget) {
        await editarCliente(editTarget.id, dto)
      } else {
        await crearCliente(dto)
      }
      setModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await eliminarCliente(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.textPrimary }}>
          Clientes
        </h1>
        <Button onClick={openCrear}>+ Nuevo cliente</Button>
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
              {['Nombre', 'Período de vencimiento', ''].map(col => (
                <th key={col} style={{ padding: '12px 20px', textAlign: 'left', fontFamily: theme.font.family, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semibold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', background: theme.colors.surfaceHover }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>Cargando...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>No hay clientes cargados</td></tr>
            ) : clientes.map((c, i) => (
              <tr
                key={c.id}
                style={{ borderBottom: i < clientes.length - 1 ? `1px solid ${theme.colors.borderLight}` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.colors.surfaceHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 20px', fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: theme.font.weight.medium, color: theme.colors.textPrimary }}>
                  {c.nombre}
                </td>
                <td style={{ padding: '14px 20px', fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
                  {c.periodoVencimiento} días
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="secondary" onClick={() => openEditar(c)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar cliente' : 'Nuevo cliente'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Nombre" required error={formError || undefined}>
            <input style={inputStyle} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la empresa" autoFocus />
          </FormField>
          <FormField label="Período de vencimiento (días)">
            <input style={inputStyle} type="number" value={form.periodoVencimiento} onChange={e => setForm(p => ({ ...p, periodoVencimiento: e.target.value }))} min={1} />
          </FormField>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={saving}>{editTarget ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar cliente" width="400px">
        <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.base, color: theme.colors.textSecondary, marginBottom: '20px' }}>
          ¿Eliminar a <strong style={{ color: theme.colors.textPrimary }}>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}