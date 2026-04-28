// frontend/src/components/PillButton.tsx

import { theme } from '../theme'

interface PillButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

/**
 * Botón tipo "chip" / "pill" reutilizable. Usado para:
 * - Selección de tipo (Cliente/Fletero) en wizards (NuevoInformeModal, NuevaFacturaModal).
 * - Filtros de listado (FacturasPage).
 *
 * Estilo único, sin variantes — si en el futuro se necesita otro tamaño o color,
 * agregar una prop `variant` o `size` antes de duplicar el componente.
 */
export function PillButton({ label, active, onClick }: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.base,
        fontWeight: active ? theme.font.weight.semibold : theme.font.weight.medium,
        padding: '10px 32px',
        borderRadius: theme.radius.md,
        border: `2px solid ${active ? theme.colors.primary : theme.colors.border}`,
        background: active ? theme.colors.primary : theme.colors.surface,
        color: active ? '#fff' : theme.colors.textSecondary,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
