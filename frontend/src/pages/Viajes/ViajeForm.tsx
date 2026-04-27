// frontend/src/pages/Viajes/ViajeForm.tsx

import { useState } from 'react'
import { Button } from '../../components/Button'
import { FormField, inputStyle } from '../../components/FormFields'
import { theme } from '../../theme'
import { validateViajeForm } from '../../utils/validation'
import type { Viaje, CreateViajeDTO, Cliente, Fletero, EstadoFactura } from '../../types'

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

// Mensaje según el estado de una factura (null = sin factura asociada, no debería pasar en edición real)
function mensajeBloqueo(estado: EstadoFactura | null): string | null {
  if (estado === 'facturada') return 'Factura emitida — revertí desde la sección de Facturas para editar.'
  if (estado === 'pagada')    return 'Factura cobrada — estos campos quedan congelados.'
  return null
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ViajeForm({ viaje, clientes, fleteros, onSubmit, onCancel }: ViajeFormProps) {
  const isEdit = !!viaje
  const [form, setForm] = useState<FormState>(viaje ? viajeToForm(viaje) : emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Flags de edición condicional según el estado de cada factura
  // En modo creación, todo editable. En edición, depende del estado de cada factura.
  const puedeEditarCobranza    = !isEdit || viaje!.estadoFacturaCobranza    === 'sin_facturar'
  const puedeEditarPagoFletero = !isEdit || viaje!.estadoFacturaPagoFletero === 'sin_facturar'

  const mensajeCobranza    = isEdit ? mensajeBloqueo(viaje!.estadoFacturaCobranza)    : null
  const mensajePagoFletero = isEdit ? mensajeBloqueo(viaje!.estadoFacturaPagoFletero) : null

  const handleSubmit = async () => {
    const errors = validateViajeForm(
      form,
      !isEdit || puedeEditarCobranza,
      !isEdit || puedeEditarPagoFletero
    )

    const primerError = Object.values(errors)[0]
    if (primerError) {
      setFormError(primerError)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (isEdit) {
        // Solo mando los campos que el usuario efectivamente puede editar.
        // Construimos el dto incrementalmente.
        const dto: Partial<CreateViajeDTO> = {
          fecha:        form.fecha,
          numeroRemito: form.numeroRemito || null,
          destinatario: form.destinatario || null,
        }

        if (puedeEditarCobranza) {
          dto.clienteId    = Number(form.clienteId)
          dto.valorCliente = Number(form.valorCliente)
        }

        if (puedeEditarPagoFletero) {
          dto.fleteroId    = Number(form.fleteroId)
          dto.costoFletero = Number(form.costoFletero)
        }

        await onSubmit(dto)
      } else {
        await onSubmit({
          fecha:        form.fecha,
          clienteId:    Number(form.clienteId),
          valorCliente: Number(form.valorCliente),
          fleteroId:    Number(form.fleteroId),
          costoFletero: Number(form.costoFletero),
          numeroRemito: form.numeroRemito || null,
          destinatario: form.destinatario || null,
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

  // Estilos
  const lockedInputStyle = { ...inputStyle, background: theme.colors.surfaceHover, color: theme.colors.textMuted, cursor: 'not-allowed' }

  // Componente local para mensajes informativos de bloqueo
  const InfoMessage = ({ text }: { text: string }) => (
    <div style={{ fontFamily: theme.font.family, fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: '4px', lineHeight: 1.4 }}>
      {text}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <FormField label="Fecha" required>
        <input style={inputStyle} type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
      </FormField>

      {/* ─── Bloque cobranza (cliente + valor) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Cliente" required>
          <select
            style={!puedeEditarCobranza ? lockedInputStyle : { ...inputStyle, cursor: 'pointer' }}
            value={form.clienteId}
            onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}
            disabled={!puedeEditarCobranza}
          >
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Valor del viaje" required>
          <input
            style={!puedeEditarCobranza ? lockedInputStyle : inputStyle}
            type="number" min={0} placeholder="0"
            value={form.valorCliente}
            onChange={e => setForm(p => ({ ...p, valorCliente: e.target.value }))}
            disabled={!puedeEditarCobranza}
          />
        </FormField>
      </div>
      {mensajeCobranza && <InfoMessage text={mensajeCobranza} />}

      <div style={{ borderTop: `1px solid ${theme.colors.borderLight}` }} />

      {/* ─── Bloque pago_fletero (fletero + costo) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Fletero" required>
          <select
            style={!puedeEditarPagoFletero ? lockedInputStyle : { ...inputStyle, cursor: 'pointer' }}
            value={form.fleteroId}
            onChange={e => setForm(p => ({ ...p, fleteroId: e.target.value }))}
            disabled={!puedeEditarPagoFletero}
          >
            <option value="">Seleccionar...</option>
            {fleteros.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Costo del fletero" required>
          <input
            style={!puedeEditarPagoFletero ? lockedInputStyle : inputStyle}
            type="number" min={0} placeholder="0"
            value={form.costoFletero}
            onChange={e => setForm(p => ({ ...p, costoFletero: e.target.value }))}
            disabled={!puedeEditarPagoFletero}
          />
        </FormField>
      </div>
      {mensajePagoFletero && <InfoMessage text={mensajePagoFletero} />}

      <div style={{ borderTop: `1px solid ${theme.colors.borderLight}` }} />

      {/* ─── Bloque siempre editable (datos administrativos) ─── */}
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