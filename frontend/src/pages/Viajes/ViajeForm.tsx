// frontend/src/pages/Viajes/ViajeForm.tsx

import { useState } from 'react'
import { Button } from '../../components/Button'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import type { Viaje, CreateViajeDTO, Cliente, Fletero } from '../../types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  fecha: string
  clienteId: string
  valorCliente: string
  fleteroId: string
  costoFletero: string
  numeroRemito: string
  destinatario: string
}

interface ViajeFormProps {
  viaje?: Viaje | null              // si viene, modo edición; si no, modo creación
  clientes: Cliente[]
  fleteros: Fletero[]
  onSubmit: (dto: CreateViajeDTO | Partial<CreateViajeDTO>) => Promise<void>
  onCancel: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

const emptyForm: FormState = {
  fecha: new Date().toISOString().slice(0, 10),
  clienteId: '',
  valorCliente: '',
  fleteroId: '',
  costoFletero: '',
  numeroRemito: '',
  destinatario: '',
}

// Convierte un viaje existente a estado de formulario
function viajeToForm(v: Viaje): FormState {
  return {
    fecha:         v.fecha,
    clienteId:     String(v.clienteId),
    valorCliente:  String(v.valorCliente),
    fleteroId:     String(v.fleteroId),
    costoFletero:  String(v.costoFletero),
    numeroRemito:  v.numeroRemito ?? '',
    destinatario:  v.destinatario ?? '',
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ViajeForm({ viaje, clientes, fleteros, onSubmit, onCancel }: ViajeFormProps) {
  const isEdit = !!viaje
  const [form, setForm] = useState<FormState>(viaje ? viajeToForm(viaje) : emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // En modo edición, campos bloqueados — ver decisión 5.B y bloqueo de montos
  const lockedHelpText = 'Para modificar este campo, eliminá el viaje y volvé a cargarlo. Para corregir montos, primero revertí las facturas asociadas desde el módulo de Facturas.'

  const handleSubmit = async () => {
    if (!form.fecha) { setFormError('La fecha es requerida'); return }

    if (!isEdit) {
      // Validaciones que solo aplican al crear (en edición están bloqueados)
      if (!form.clienteId)                                      { setFormError('Seleccioná un cliente');         return }
      if (!form.valorCliente || Number(form.valorCliente) <= 0) { setFormError('Ingresá el valor del viaje');    return }
      if (!form.fleteroId)                                      { setFormError('Seleccioná un fletero');         return }
      if (!form.costoFletero || Number(form.costoFletero) <= 0) { setFormError('Ingresá el costo del fletero'); return }
    }

    setSaving(true)
    setFormError(null)
    try {
      if (isEdit) {
        // En edición solo mandamos los campos que el usuario puede tocar
        await onSubmit({
          fecha: form.fecha,
          numeroRemito: form.numeroRemito || null,
          destinatario: form.destinatario || null,
        })
      } else {
        await onSubmit({
          fecha:         form.fecha,
          clienteId:     Number(form.clienteId),
          valorCliente:  Number(form.valorCliente),
          fleteroId:     Number(form.fleteroId),
          costoFletero:  Number(form.costoFletero),
          numeroRemito:  form.numeroRemito || null,
          destinatario:  form.destinatario || null,
        })
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el viaje')
    } finally {
      setSaving(false)
    }
  }

  const gananciaPreview = form.valorCliente && form.costoFletero
    ? Number(form.valorCliente) - Number(form.costoFletero)
    : null

  // Estilo para inputs/selects bloqueados
  const lockedInputStyle = { ...inputStyle, background: theme.colors.surfaceHover, color: theme.colors.textMuted, cursor: 'not-allowed' }

  // Texto de ayuda chico para campos bloqueados
  const HelpText = () => (
    <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: '4px', lineHeight: 1.4 }}>
      {lockedHelpText}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <FormField label="Fecha" required>
        <input style={inputStyle} type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Cliente" required>
          <select
            style={isEdit ? lockedInputStyle : { ...inputStyle, cursor: 'pointer' }}
            value={form.clienteId}
            onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}
            disabled={isEdit}
          >
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Valor del viaje" required>
          <input
            style={isEdit ? lockedInputStyle : inputStyle}
            type="number" min={0} placeholder="0"
            value={form.valorCliente}
            onChange={e => setForm(p => ({ ...p, valorCliente: e.target.value }))}
            disabled={isEdit}
          />
        </FormField>
      </div>

      <div style={{ borderTop: `1px solid ${theme.colors.borderLight}` }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Fletero" required>
          <select
            style={isEdit ? lockedInputStyle : { ...inputStyle, cursor: 'pointer' }}
            value={form.fleteroId}
            onChange={e => setForm(p => ({ ...p, fleteroId: e.target.value }))}
            disabled={isEdit}
          >
            <option value="">Seleccionar...</option>
            {fleteros.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Costo del fletero" required>
          <input
            style={isEdit ? lockedInputStyle : inputStyle}
            type="number" min={0} placeholder="0"
            value={form.costoFletero}
            onChange={e => setForm(p => ({ ...p, costoFletero: e.target.value }))}
            disabled={isEdit}
          />
        </FormField>
      </div>

      {isEdit && <HelpText />}

      <div style={{ borderTop: `1px solid ${theme.colors.borderLight}` }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="N° Remito">
          <input
            style={inputStyle}
            type="text" placeholder="Opcional"
            value={form.numeroRemito}
            onChange={e => setForm(p => ({ ...p, numeroRemito: e.target.value }))}
          />
        </FormField>
        <FormField label="Destinatario">
          <input
            style={inputStyle}
            type="text" placeholder="Opcional"
            value={form.destinatario}
            onChange={e => setForm(p => ({ ...p, destinatario: e.target.value }))}
          />
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
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={saving}>{isEdit ? 'Guardar cambios' : 'Ingresar viaje'}</Button>
      </div>

    </div>
  )
}