// frontend/src/components/OrdenToggle.tsx

import { theme } from '../theme'

export type Orden = 'asc' | 'desc'

interface OrdenToggleProps {
  orden: Orden
  onChange: (nuevo: Orden) => void
}

/**
 * Botón compacto que alterna entre orden ascendente y descendente.
 * El ícono refleja el orden actual; al apretarlo se invierte.
 *
 * Componente "tonto": sin estado interno.
 */
export default function OrdenToggle({ orden, onChange }: OrdenToggleProps) {
  const icono = orden === 'desc' ? '↓' : '↑'
  const titulo = orden === 'desc' ? 'Orden descendente (cambiar a ascendente)' : 'Orden ascendente (cambiar a descendente)'

  function toggle() {
    onChange(orden === 'desc' ? 'asc' : 'desc')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={titulo}
      style={{
        fontFamily: theme.font.family,
        fontSize: theme.font.size.md,
        fontWeight: theme.font.weight.semibold,
        color: theme.colors.textSecondary,
        background: 'none',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        padding: '6px 12px',
        minWidth: '40px',
      }}
    >
      {icono}
    </button>
  )
}