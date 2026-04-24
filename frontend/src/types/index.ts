// frontend/src/types/index.ts

// TIPOS DE ESTADO
export type TipoFactura = 'cobranza' | 'pago_fletero' | 'pago_servicio'
export type EstadoFactura = 'sin_facturar' | 'facturada' | 'pagada'
export type TipoInforme = 'cliente' | 'fletero'

// CLIENTES
export interface Cliente {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  cbu: string | null
  cuit: string | null
}

export interface CreateClienteDTO {
  nombre: string
  email?: string | null
  telefono?: string | null
  cbu?: string | null
  cuit?: string | null
}

// FLETEROS
export interface Fletero {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  cbu: string | null
  cuit: string | null
}

export interface CreateFleteroDTO {
  nombre: string
  email?: string | null
  telefono?: string | null
  cbu?: string | null
  cuit?: string | null
}

// VIAJES
// clienteNombre y fleteroNombre: no los devuelve el backend, los resuelve la página
// por cross-reference con el listado de clientes/fleteros. Deuda técnica anotada
// (resolver cuando haya shared types backend-frontend).
export interface Viaje {
  id: number
  fecha: string
  clienteId: number
  clienteNombre?: string
  valorCliente: number
  fleteroId: number
  fleteroNombre?: string
  costoFletero: number
  createdAt: string
  numeroRemito: string | null
  destinatario: string | null
  numeroFacturaCobranza: string | null
  estadoFacturaCobranza: EstadoFactura | null
  vencimientoCobranza: string | null
  numeroFacturaPagoFletero: string | null
  estadoFacturaPagoFletero: EstadoFactura | null
  vencimientoPagoFletero: string | null
}

export interface CreateViajeDTO {
  fecha: string
  clienteId: number
  valorCliente: number
  fleteroId: number
  costoFletero: number
  numeroRemito?: string | null
  destinatario?: string | null
}

export interface ViajeFilters {
  clienteId?: number
  fleteroId?: number
  desde?: string   // YYYY-MM-DD
  hasta?: string   // YYYY-MM-DD
}

// FACTURAS
// Nota de dominio: `monto` es neto. El total con IVA se calcula al vuelo como
// monto * 1.21 cuando `incluyeIva = true`. Documentado en convenciones_tecnicas.
export interface Factura {
  id: number
  tipo: TipoFactura
  clienteId: number | null
  fleteroId: number | null
  viajeId: number | null
  monto: number
  descripcion: string | null
  numero: string | null
  fechaEmision: string | null
  vencimiento: string | null
  estado: EstadoFactura
  incluyeIva: boolean
}

// Ajuste de monto de una factura específica al emitir un lote.
// El `id` debe pertenecer al array `ids` del FacturarDTO (validado en backend).
export interface AjusteMontoFactura {
  id: number
  monto: number
}

// FacturarDTO se usa para PATCH /facturas/:id/facturar (individual) y
// PATCH /facturas/facturar-lote (lote). Los campos `ajustesMonto` e `incluyeIva`
// solo los procesa el endpoint de lote; el individual los ignora.
export interface FacturarDTO {
  numero: string
  fechaEmision: string
  vencimiento: string
  ajustesMonto?: AjusteMontoFactura[]
  incluyeIva?: boolean
}

// INFORMES
// Fila del informe cuando el titular es un Cliente
export interface InformeClienteFila {
  viajeId: number
  fecha: string                // YYYY-MM-DD
  numeroRemito: string | null
  destinatario: string | null
  valor: number                // valor_cliente del viaje
}

// Fila del informe cuando el titular es un Fletero
export interface InformeFleteroFila {
  viajeId: number
  fecha: string                // YYYY-MM-DD
  clienteNombre: string
  valor: number                // costo_fletero del viaje
}

// Informe renderizable — el objeto que consume la UI y la exportación a PDF.
// Distinto de `Informe` (la entidad persistida que solo tiene IDs y metadata).
export interface InformeData {
  tipo: TipoInforme
  actor: { id: number; nombre: string }
  rango: { desde: string; hasta: string }
  filas: InformeClienteFila[] | InformeFleteroFila[]
  subtotal: number
  iva: number                  // 21% del subtotal
  total: number                // subtotal + iva
}

// Entidad persistida (tabla `informes` en la DB).
// Debe mantenerse sincronizado con backend/src/types/index.ts
export interface Informe {
  id: number
  codigo: string               // "INF-2026-000042"
  anio: number
  correlativo: number
  tipo: TipoInforme
  clienteId: number | null
  fleteroId: number | null
  rangoDesde: string           // YYYY-MM-DD
  rangoHasta: string           // YYYY-MM-DD
  createdAt: string            // ISO string
  viajeIds: number[]
}

export interface CreateInformeDTO {
  tipo: TipoInforme
  clienteId: number | null
  fleteroId: number | null
  rangoDesde: string
  rangoHasta: string
  viajeIds: number[]
}

export interface InformeFilters {
  tipo?: TipoInforme
  clienteId?: number
  fleteroId?: number
  anio?: number
}