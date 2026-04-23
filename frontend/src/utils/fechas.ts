// frontend/src/utils/fechas.ts

/**
 * Devuelve el rango default para wizards: del día 1 del mes actual hasta hoy.
 *
 * `hoy` se expone aparte porque algunos callers lo usan directamente como
 * fechaEmision inicial en un paso posterior del wizard, donde la semántica
 * "hoy" es más clara que "hasta del rango".
 */
export function getRangoDefault(): { desde: string; hasta: string; hoy: string } {
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  return {
    desde: `${yyyy}-${mm}-01`,
    hasta: `${yyyy}-${mm}-${dd}`,
    hoy:   `${yyyy}-${mm}-${dd}`,
  }
}

/**
 * Suma N días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD.
 *
 * Usa T12:00:00 (mediodía) para evitar el corrimiento UTC-3:
 * si parseáramos con T00:00:00 y el usuario está en Argentina, el objeto
 * Date interno apuntaría al día anterior a las 21:00 UTC del día anterior,
 * y .setDate + .getDate podrían cruzar de día dos veces por el dst/offset.
 * T12:00:00 garantiza que siempre estemos bien adentro del día objetivo.
 */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}