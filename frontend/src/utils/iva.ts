// frontend/src/utils/iva.ts

/**
 * Alícuota del IVA aplicada en el sistema.
 *
 * Se usa en dos contextos:
 *  - Cálculo del total de un informe (siempre con IVA, al 21%).
 *  - Cálculo del total de una factura con `incluyeIva = true`.
 *
 * Vive en utils/ (y no dentro de un hook) porque es una constante de dominio
 * pura, sin dependencias de React ni de ninguna capa específica. Cualquier
 * módulo que necesite el porcentaje la importa directo desde acá.
 *
 * Si el día de mañana la alícuota deja de ser 21% (cambio de ley, régimen
 * especial), se modifica en un solo lugar.
 */
export const IVA_ALICUOTA = 0.21