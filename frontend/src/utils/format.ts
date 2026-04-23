// frontend/src/utils/format.ts

/**
 * Formatea una fecha YYYY-MM-DD al formato dd/mm/yyyy (es-AR).
 *
 * Acepta null/undefined para ergonomía: muchos campos del dominio
 * (vencimiento, fechaEmision, etc.) pueden ser nulos y forzar al caller
 * a hacer `fecha ?? null` sería ruido.
 *
 * Usa T00:00:00 para evitar el corrimiento UTC-3 al parsear.
 */
export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/**
 * Formatea un monto como moneda ARS con 2 decimales.
 * Usar en contextos donde importan los centavos: previews de factura,
 * facturación editable, bloques de totales de un documento fiscal.
 */
export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 2,
  }).format(n)
}

/**
 * Formatea un monto como moneda ARS sin decimales (redondeado).
 * Usar en listados y tablas donde los decimales son ruido visual:
 * columnas de valor/monto en tablas de resumen, filtros, etc.
 */
export function formatMoneyRound(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Formatea un timestamp ISO (ej: createdAt de la DB) al formato dd/mm/yyyy.
 * A diferencia de formatFecha, NO antepone 'T00:00:00' porque el input
 * ya incluye hora y zona. Usar para campos tipo `created_at`.
 */
export function formatFechaCreacion(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}