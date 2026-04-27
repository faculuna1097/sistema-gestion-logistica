// frontend/src/components/MesNavigator.tsx

import { theme } from '../theme'
import { MESES } from '../utils/fechas'

interface MesNavigatorProps {
  /** Mes actual en formato YYYY-MM, o null cuando incluirTodos=true y se eligió "todos los meses". */
  mes: string | null
  /** Callback con el nuevo valor. Recibe null cuando se cambia a "todos los meses". */
  onChange: (mes: string | null) => void
  /** Si es true, agrega un botón para alternar entre mes específico y "todos los meses". */
  incluirTodos?: boolean
}

/**
 * Navegador de mes: flechas ← → con el nombre del mes en el centro.
 * Opcionalmente permite alternar a "Todos los meses" mediante un botón al costado.
 *
 * Componente "tonto": no maneja estado interno, todo pasa por props/onChange.
 */
export default function MesNavigator({ mes, onChange, incluirTodos = false }: MesNavigatorProps) {
  // Cuando estamos en "todos", las flechas vuelven al mes actual ± 1 (sin perder navegabilidad).
  function navegar(direccion: -1 | 1) {
    if (mes === null) {
      // Desde "todos los meses", arrancamos navegando desde el mes actual.
      const hoy = new Date()
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + direccion, 1)
      onChange(formatearMes(fecha))
      return
    }

    const [anio, mesNum] = mes.split('-').map(Number)
    const fecha = new Date(anio, mesNum - 1 + direccion, 1)
    onChange(formatearMes(fecha))
  }

  function toggleTodos() {
    if (mes === null) {
      // Volver al mes actual.
      const hoy = new Date()
      onChange(formatearMes(hoy))
    } else {
      onChange(null)
    }
  }

  const labelCentro = mes === null ? 'Todos los meses' : formatMesLabel(mes)
  const labelBotonTodos = mes === null ? 'Mes actual' : 'Todos'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        type="button"
        onClick={() => navegar(-1)}
        style={flechaStyle}
        title="Mes anterior"
      >
        ←
      </button>

      <span style={labelStyle}>{labelCentro}</span>

      <button
        type="button"
        onClick={() => navegar(1)}
        style={flechaStyle}
        title="Mes siguiente"
      >
        →
      </button>

      {incluirTodos && (
        <button
          type="button"
          onClick={toggleTodos}
          style={botonTodosStyle}
          title={labelBotonTodos}
        >
          {labelBotonTodos}
        </button>
      )}
    </div>
  )
}

// ──────────────── Helpers ────────────────

function formatearMes(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${a}-${m}`
}

function formatMesLabel(mes: string): string {
  const [anio, mesNum] = mes.split('-').map(Number)
  return `${MESES[mesNum - 1]} ${anio}`
}

// ──────────────── Estilos ────────────────

const flechaStyle: React.CSSProperties = {
  fontFamily: theme.font.family,
  fontSize: theme.font.size.md,
  color: theme.colors.textSecondary,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: theme.font.family,
  fontSize: theme.font.size.md,
  fontWeight: theme.font.weight.semibold,
  color: theme.colors.textPrimary,
  minWidth: '140px',
  textAlign: 'center',
}

const botonTodosStyle: React.CSSProperties = {
  fontFamily: theme.font.family,
  fontSize: theme.font.size.sm,
  color: theme.colors.textSecondary,
  background: 'none',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  padding: '6px 12px',
  marginLeft: '8px',
}