// frontend/src/pages/Viajes/ViajeDetailModal.tsx

import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { theme } from '../../theme'
import type { Viaje, EstadoFactura } from '../../types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ViajeDetailModalProps {
  viaje: Viaje | null
  clienteNombre: string
  fleteroNombre: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const HOY = new Date().toISOString().slice(0, 10)
const DIAS_ALERTA = 7
const LIMITE_POR_VENCER = new Date(Date.now() + DIAS_ALERTA * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10)

// Misma lógica que en ViajesPage — devuelve color y label según estado + vencimiento
function getEstadoVisual(
  estado: EstadoFactura | null,
  vencimiento: string | null
): { color: string; label: string } {
  if (!estado) return { color: theme.colors.textMuted, label: '—' }

  if (estado === 'facturada' && vencimiento) {
    if (vencimiento < HOY)               return { color: theme.colors.danger, label: 'Vencida' }
    if (vencimiento <= LIMITE_POR_VENCER) return { color: '#f39c12',           label: 'Por vencer' }
  }

  switch (estado) {
    case 'sin_facturar': return { color: '#aab5af',                  label: 'Sin facturar' }
    case 'facturada':    return { color: theme.colors.facturada.dot, label: 'Facturada'    }
    case 'pagada':       return { color: theme.colors.pagada.dot,    label: 'Pagada'       }
  }
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

// Botón copiar con feedback visual (cambia a check por 2 segundos)
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[viaje-detail] Error al copiar:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 6px',
        marginLeft: '6px',
        fontSize: theme.font.size.sm,
        color: copied ? theme.colors.primary : theme.colors.textMuted,
        fontFamily: theme.font.family,
        lineHeight: 1,
      }}
    >
      {copied ? '✓' : '⧉'}
    </button>
  )
}

// Fila del detalle: label a la izquierda, valor a la derecha
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${theme.colors.borderLight}`,
    }}>
      <span style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.sm,
        color: theme.colors.textMuted,
        fontWeight: theme.font.weight.medium,
      }}>
        {label}
      </span>
      <div style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.base,
        color: theme.colors.textPrimary,
        display: 'flex',
        alignItems: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

// Indicador de estado: dot + texto
function EstadoIndicator({ estado, vencimiento }: { estado: EstadoFactura | null; vencimiento: string | null }) {
  const { color, label } = getEstadoVisual(estado, vencimiento)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        display: 'inline-block',
        width: '10px', height: '10px',
        borderRadius: '50%',
        background: color,
      }} />
      <span style={{ color, fontWeight: theme.font.weight.medium }}>{label}</span>
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ViajeDetailModal({
  viaje, clienteNombre, fleteroNombre, onClose, onEdit, onDelete,
}: ViajeDetailModalProps) {
  if (!viaje) return null

  const ganancia = viaje.valorCliente - viaje.costoFletero

  return (
    <Modal open={!!viaje} onClose={onClose} title="Detalle del viaje" width="560px">
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <DetailRow label="Fecha">
          {formatFecha(viaje.fecha)}
        </DetailRow>

        {/* Bloque cobranza */}
        <DetailRow label="Cliente">
          {clienteNombre}
        </DetailRow>
        <DetailRow label="Valor del viaje">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(viaje.valorCliente)}</span>
        </DetailRow>
        <DetailRow label="N° Cobranza">
          {viaje.numeroFacturaCobranza ?? '—'}
          {viaje.numeroFacturaCobranza && <CopyButton text={viaje.numeroFacturaCobranza} />}
        </DetailRow>
        <DetailRow label="Estado cobranza">
          <EstadoIndicator estado={viaje.estadoFacturaCobranza} vencimiento={viaje.vencimientoCobranza} />
        </DetailRow>

        {/* Bloque pago fletero */}
        <DetailRow label="Fletero">
          {fleteroNombre}
        </DetailRow>
        <DetailRow label="Costo del fletero">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(viaje.costoFletero)}</span>
        </DetailRow>
        <DetailRow label="N° Pago Fletero">
          {viaje.numeroFacturaPagoFletero ?? '—'}
          {viaje.numeroFacturaPagoFletero && <CopyButton text={viaje.numeroFacturaPagoFletero} />}
        </DetailRow>
        <DetailRow label="Estado pago fletero">
          <EstadoIndicator estado={viaje.estadoFacturaPagoFletero} vencimiento={viaje.vencimientoPagoFletero} />
        </DetailRow>

        {/* Bloque info adicional */}
        <DetailRow label="Destinatario">
          {viaje.destinatario ?? '—'}
        </DetailRow>
        <DetailRow label="N° Remito">
          {viaje.numeroRemito ?? '—'}
          {viaje.numeroRemito && <CopyButton text={viaje.numeroRemito} />}
        </DetailRow>

        {/* Ganancia */}
        <div style={{
          background: theme.colors.primaryLight,
          borderRadius: theme.radius.md,
          padding: '14px 16px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: theme.font.family,
            fontSize: theme.font.size.sm,
            color: theme.colors.primary,
            fontWeight: theme.font.weight.medium,
          }}>
            Ganancia
          </span>
          <span style={{
            fontFamily: theme.font.family,
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: ganancia >= 0 ? theme.colors.primary : theme.colors.danger,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatMoney(ganancia)}
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="danger" onClick={onDelete}>Eliminar</Button>
          <Button onClick={onEdit}>Editar</Button>
        </div>

      </div>
    </Modal>
  )
}