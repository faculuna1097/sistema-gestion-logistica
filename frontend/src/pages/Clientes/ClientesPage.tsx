// src/pages/Clientes/ClientesPage.tsx

import { useState } from 'react'
import { useClientes } from '../../hooks/useClientes'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import { CopyButton } from '../../components/CopyButton'
import { validateContactForm, hasErrors } from '../../utils/validation' 

import type { ContactFormErrors } from '../../utils/validation'
import type { Cliente } from '../../types'

// — Fila en el modal de detalle —
function DetailRow({ label, value, copiable = false }: { label: string; value: string | null; copiable?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${theme.colors.borderLight}`,
    }}>
      <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted, minWidth: '80px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{
          fontFamily: theme.font.family, fontSize: theme.font.size.base,
          color: value ? theme.colors.textPrimary : theme.colors.textMuted,
          fontStyle: value ? 'normal' : 'italic',
        }}>
          {value ?? 'Sin datos'}
        </span>
        {copiable && value && <CopyButton text={value} />}
      </div>
    </div>
  )
}

// — Tipos de formulario —
interface FormState { nombre: string; email: string; telefono: string; cbu: string; cuit: string }
const emptyForm: FormState = { nombre: '', email: '', telefono: '', cbu: '', cuit: '' }

function clienteToForm(c: Cliente): FormState {
  return {
    nombre:   c.nombre,
    email:    c.email    ?? '',
    telefono: c.telefono ?? '',
    cbu:      c.cbu      ?? '',
    cuit:     c.cuit     ?? '',
  }
}

// — Página —
export function ClientesPage() {
  const { clientes, loading, error, crearCliente, editarCliente, eliminarCliente } = useClientes()

  // Cada modal tiene su propio estado, sin solapamiento
  const [createOpen,   setCreateOpen]   = useState(false)
  const [detailTarget, setDetailTarget] = useState<Cliente | null>(null)
  const [editTarget,   setEditTarget]   = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)

  const [form,      setForm]      = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<ContactFormErrors>({})
  const [saving,    setSaving]    = useState(false)

  const openCrear = () => {
    setForm(emptyForm)
    setFormErrors({})
    setCreateOpen(true)
  }

  const openEditar = (c: Cliente) => {
    setDetailTarget(null)
    setForm(clienteToForm(c))
    setFormErrors({})
    setEditTarget(c)
  }

  const handleSubmit = async () => {
    const errors = validateContactForm(form)
    if (hasErrors(errors)) { setFormErrors(errors); return }

    setSaving(true)
    setFormErrors({})
    try {
      const dto = {
        nombre:   form.nombre.trim(),
        email:    form.email.trim()    || null,
        telefono: form.telefono.trim() || null,
        cbu:      form.cbu.trim()      || null,
        cuit:     form.cuit.trim()     || null,
      }
      if (editTarget) {
        const actualizado = await editarCliente(editTarget.id, dto)
        setEditTarget(null)
        setDetailTarget(actualizado)
      } else {
        await crearCliente(dto)
        setCreateOpen(false)
      }
    } catch (err: unknown) {
      setFormErrors({ nombre: err instanceof Error ? err.message : 'Error al guardar' })
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
      setDetailTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const formModal = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <FormField label="Nombre" required error={formErrors.nombre}>
        <input style={inputStyle} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la empresa" autoFocus />
      </FormField>
      <FormField label="Email" error={formErrors.email}>
        <input style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" />
      </FormField>
      <FormField label="Teléfono" error={formErrors.telefono}>
        <input style={inputStyle} value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="11 1234 5678" />
      </FormField>
      <FormField label="CBU" error={formErrors.cbu}>
        <input style={inputStyle} value={form.cbu} onChange={e => setForm(p => ({ ...p, cbu: e.target.value }))} placeholder="22 dígitos" />
      </FormField>
      <FormField label="CUIT" error={formErrors.cuit}>
        <input style={inputStyle} value={form.cuit} onChange={e => setForm(p => ({ ...p, cuit: e.target.value }))} placeholder="XX-XXXXXXXX-X" />
      </FormField>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <Button variant="secondary" onClick={() => { setCreateOpen(false); setEditTarget(null); setFormErrors({}) }}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={saving}>{editTarget ? 'Guardar cambios' : 'Crear cliente'}</Button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px' }}>

      {/* — Header — */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontFamily: theme.font.family, fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.textPrimary }}>
          Clientes
        </h1>
        <Button onClick={openCrear}>+ Nuevo cliente</Button>
      </div>

      {error && (
        <div style={{ background: theme.colors.dangerLight, color: theme.colors.danger, padding: '12px 16px', borderRadius: theme.radius.md, marginBottom: '20px', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
          {error}
        </div>
      )}

      {/* — Grid — */}
      {loading ? (
        <p style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>Cargando...</p>
      ) : clientes.length === 0 ? (
        <p style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>No hay clientes cargados</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {clientes.map(c => (
            <div
              key={c.id}
              onClick={() => setDetailTarget(c)}
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: '20px',
                cursor: 'pointer',
                boxShadow: theme.shadow.sm,
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = theme.shadow.md
                e.currentTarget.style.borderColor = theme.colors.primary
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = theme.shadow.sm
                e.currentTarget.style.borderColor = theme.colors.border
              }}
            >
              {/* Inicial */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: theme.colors.cliente.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px',
                fontFamily: theme.font.family, fontSize: theme.font.size.md,
                fontWeight: theme.font.weight.bold, color: theme.colors.cliente.text,
              }}>
                {c.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Nombre */}
              <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semibold, color: theme.colors.textPrimary, marginBottom: '10px' }}>
                {c.nombre}
              </div>

              {/* Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: c.telefono ? theme.colors.textSecondary : theme.colors.textMuted, fontStyle: c.telefono ? 'normal' : 'italic' }}>
                  {c.telefono ?? 'Sin teléfono'}
                </span>
                <span style={{ fontFamily: theme.font.family, fontSize: theme.font.size.sm, color: c.email ? theme.colors.textSecondary : theme.colors.textMuted, fontStyle: c.email ? 'normal' : 'italic' }}>
                  {c.email ?? 'Sin email'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* — Modal: detalle — */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title={detailTarget?.nombre ?? ''} width="440px">
        {detailTarget && (
          <div>
            <DetailRow label="Email"    value={detailTarget.email} />
            <DetailRow label="Teléfono" value={detailTarget.telefono} />
            <DetailRow label="CBU"      value={detailTarget.cbu}  copiable />
            <DetailRow label="CUIT"     value={detailTarget.cuit} copiable />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="danger"    onClick={() => setDeleteTarget(detailTarget)}>Eliminar</Button>
              <Button variant="secondary" onClick={() => openEditar(detailTarget)}>Editar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* — Modal: crear — */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setFormErrors({}) }} title="Nuevo cliente">
        {formModal}
      </Modal>

      {/* — Modal: editar — */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); setFormErrors({}) }} title="Editar cliente">
        {formModal}
      </Modal>

      {/* — Modal: confirmar eliminación — */}
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