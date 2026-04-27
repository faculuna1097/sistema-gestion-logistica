// frontend/src/utils/fechas.ts


/**
 * Nombres de meses en castellano. Indexado por número de mes 0-based
 * (igual que Date.getMonth()).
 */
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const


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

/**
 * Información de una semana (lunes a domingo) recortada a los bordes del mes
 * que la contiene parcial o totalmente.
 */
export interface SemanaInfo {
  /** Número de la semana dentro del mes filtrado (1-based). */
  numero: number
  /** Inicio del rango efectivo dentro del mes filtrado (YYYY-MM-DD). */
  desde: string
  /** Fin del rango efectivo dentro del mes filtrado (YYYY-MM-DD). */
  hasta: string
  /** True si la semana arranca antes del primer día del mes (recortada por izquierda). */
  recortadaInicio: boolean
  /** True si la semana termina después del último día del mes (recortada por derecha). */
  recortadaFin: boolean
  /** True si la fecha de hoy cae dentro del rango efectivo recortado. */
  esActual: boolean
  /** Header listo para renderizar, ej: "Semana 5 · 27/04 – 30/04 · continúa en mayo". */
  labelHeader: string
}

/**
 * Genera la lista de semanas reales (lunes-domingo) que tocan un mes,
 * recortadas a los bordes del mes. Cada semana incluye metadatos de
 * recorte y un label formateado para el header de tablas agrupadas.
 *
 * Convención del proyecto: todas las fechas se manejan en zona local con
 * mediodía implícito para evitar el bug de UTC-3 que cruza días con DST.
 *
 * El flag `esActual` está disponible en SemanaInfo pero NO aparece en el
 * label — la diferenciación visual de la semana actual queda a cargo del
 * caller (típicamente con styling distintivo del header de fila).
 *
 * @param mes Mes en formato YYYY-MM (ej: '2026-04').
 * @returns Array de SemanaInfo en orden cronológico ascendente.
 */
export function obtenerSemanasDelMes(mes: string): SemanaInfo[] {
  const [anio, mesNum] = mes.split('-').map(Number)

  // Bordes del mes (zona local, mediodía).
  const primerDiaMes = new Date(anio, mesNum - 1, 1, 12, 0, 0)
  const ultimoDiaMes = new Date(anio, mesNum, 0, 12, 0, 0)

  const hoy = new Date()
  hoy.setHours(12, 0, 0, 0)

  // Lunes de la semana que contiene el día 1 del mes.
  const diasARetroceder = (primerDiaMes.getDay() + 6) % 7
  const primerLunes = new Date(primerDiaMes)
  primerLunes.setDate(primerDiaMes.getDate() - diasARetroceder)

  const semanas: SemanaInfo[] = []
  const cursorLunes = new Date(primerLunes)
  let numero = 1

  while (cursorLunes <= ultimoDiaMes) {
    const lunes = new Date(cursorLunes)
    const domingo = new Date(cursorLunes)
    domingo.setDate(cursorLunes.getDate() + 6)

    const desdeFecha = lunes < primerDiaMes ? primerDiaMes : lunes
    const hastaFecha = domingo > ultimoDiaMes ? ultimoDiaMes : domingo

    const recortadaInicio = lunes < primerDiaMes
    const recortadaFin = domingo > ultimoDiaMes

    const esActual = hoy >= lunes && hoy <= domingo

    semanas.push({
      numero,
      desde: formatearISO(desdeFecha),
      hasta: formatearISO(hastaFecha),
      recortadaInicio,
      recortadaFin,
      esActual,
      labelHeader: armarLabel(numero, desdeFecha, hastaFecha, recortadaInicio, recortadaFin, mesNum),
    })

    cursorLunes.setDate(cursorLunes.getDate() + 7)
    numero++
  }

  return semanas
}

/**
 * Arma el header de una semana con formato:
 *   "Semana N · DD/MM – DD/MM · continúa de X" / "· continúa en X"
 *
 * El sufijo "semana actual" NO se incluye — la diferenciación es visual,
 * no textual.
 */
function armarLabel(
  numero: number,
  desde: Date,
  hasta: Date,
  recortadaInicio: boolean,
  recortadaFin: boolean,
  mesFiltrado: number,
): string {
  const partes: string[] = [
    `Semana #${numero}`,
    `${formatearDDMM(desde)} – ${formatearDDMM(hasta)}`,
  ]

  if (recortadaInicio) {
    const mesAnterior = mesFiltrado === 1 ? 12 : mesFiltrado - 1
    partes.push(`(empieza en ${MESES[mesAnterior - 1].toLowerCase()})`)
  }

  if (recortadaFin) {
    const mesSiguiente = mesFiltrado === 12 ? 1 : mesFiltrado + 1
    partes.push(`(continúa en ${MESES[mesSiguiente - 1].toLowerCase()})`)
  }

  return partes.join(' · ')
}

// ──────────────── Helpers internos ────────────────

/** Serializa una Date local a YYYY-MM-DD sin pasar por toISOString (evita corrimiento UTC). */
function formatearISO(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** Formatea una Date como dd/MM (sin año) para el header de la semana. */
function formatearDDMM(fecha: Date): string {
  const d = String(fecha.getDate()).padStart(2, '0')
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}`
}

