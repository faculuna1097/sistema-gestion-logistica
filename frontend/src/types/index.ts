// frontend/src/types/index.ts 

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
  numeroRemito: string | null              // ← nuevo
  destinatario: string | null              // ← nuevo
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
  numeroRemito?: string | null             // ← nuevo
  destinatario?: string | null             // ← nuevo
}

export type TipoFactura = 'cobranza' | 'pago_fletero' | 'pago_servicio'
export type EstadoFactura = 'sin_facturar' | 'facturada' | 'pagada'

export interface Factura {
  id: number
  tipo: TipoFactura
  clienteId: number | null
  fleteroId: number | null
  viajeId: number | null
  monto: number                // monto NETO. Para total con IVA: monto * 1.21 si incluyeIva = true
  descripcion: string | null
  numero: string | null
  fechaEmision: string | null
  vencimiento: string | null
  estado: EstadoFactura
  incluyeIva: boolean          // columna NOT NULL DEFAULT true en DB
}

// Ajuste opcional de monto al emitir un lote.
// Permite editar el monto de una factura específica antes de la transición sin_facturar → facturada.
// El `id` debe pertenecer al array `ids` del FacturarDTO. El backend valida esto.
export interface AjusteMontoFactura {
  id: number
  monto: number
}

// FacturarDTO se usa para dos endpoints distintos:
//   - PATCH /facturas/:id/facturar   (individual)
//   - PATCH /facturas/facturar-lote  (lote, con ajustesMonto e incluyeIva opcionales)
//
// Los dos campos nuevos (ajustesMonto, incluyeIva) son opcionales y solo se usan
// desde el wizard del rediseño. El endpoint individual los ignora — si en el futuro
// hace falta soportar IVA desde un punto de entrada individual, se amplía el service
// del backend (hoy solo facturar-lote los procesa).
//
// Nota de naming: en el backend este DTO se llama FacturarLoteDTO. La asimetría está
// anotada como deuda técnica chica para un pase de unificación futuro.
export interface FacturarDTO {
  numero: string
  fechaEmision: string
  vencimiento: string
  ajustesMonto?: AjusteMontoFactura[]   // solo aplicable a facturar-lote
  incluyeIva?: boolean                  // solo aplicable a facturar-lote; aplica a todo el lote
}

// FILTROS
// Debe mantenerse sincronizado con backend/src/types/index.ts
export interface ViajeFilters {
  clienteId?: number
  fleteroId?: number
  desde?: string   // formato YYYY-MM-DD
  hasta?: string   // formato YYYY-MM-DD
}

// INFORMES
export type TipoInforme = 'cliente' | 'fletero'

// Una fila del informe cuando el titular es un Cliente
export interface InformeClienteFila {
  viajeId: number
  fecha: string                // YYYY-MM-DD
  numeroRemito: string | null
  destinatario: string | null
  valor: number                // equivale a valor_cliente
}

// Una fila del informe cuando el titular es un Fletero
export interface InformeFleteroFila {
  viajeId: number
  fecha: string                // YYYY-MM-DD
  clienteNombre: string        // a qué cliente se le hizo el viaje
  valor: number                // equivale a costo_fletero
}

// Informe completo — el objeto que se muestra en pantalla y eventualmente se exporta a PDF
export interface InformeData {
  tipo: TipoInforme
  actor: { id: number; nombre: string }
  rango: { desde: string; hasta: string }
  filas: InformeClienteFila[] | InformeFleteroFila[]
  subtotal: number
  iva: number                  // 21% del subtotal
  total: number                // subtotal + iva
}

// ============================================================
// Informes persistidos (tabla `informes` en la DB)
// Debe mantenerse sincronizado con backend/src/types/index.ts
// ============================================================

// La entidad persistida tal como la devuelve el backend.
// Distinta de InformeData (que es el informe ya renderizado con filas + totales).
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