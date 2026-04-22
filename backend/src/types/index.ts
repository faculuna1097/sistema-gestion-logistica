// backend/src/types/index.ts 

// reemplazá el bloque de FACTURAS — tipos de estado
export type TipoFactura = 'cobranza' | 'pago_fletero' | 'pago_servicio'
export type EstadoFactura = 'sin_facturar' | 'facturada' | 'pagada'
export type TipoInforme = 'cliente' | 'fletero';


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
export interface Viaje {
  id: number
  fecha: string
  clienteId: number
  valorCliente: number
  fleteroId: number
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

// FACTURAS
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
}

export interface CreateFacturaDTO {
  tipo: TipoFactura
  clienteId?: number | null
  fleteroId?: number | null
  viajeId?: number
  monto: number
  descripcion?: string
  numero: string | null
  fechaEmision: string | null
  vencimiento?: string
}

// FILTROS DE VIAJES
export interface ViajeFilters {
  clienteId?: number
  fleteroId?: number
  desde?: string   // formato YYYY-MM-DD
  hasta?: string   // formato YYYY-MM-DD
}

export interface Informe {
  id: number;
  codigo: string;              // "INF-2026-000042"
  anio: number;
  correlativo: number;
  tipo: TipoInforme;
  clienteId: number | null;
  fleteroId: number | null;
  rangoDesde: string;          // YYYY-MM-DD
  rangoHasta: string;          // YYYY-MM-DD
  createdAt: string;           // ISO string
  viajeIds: number[];
}

export interface CreateInformeDTO {
  tipo: TipoInforme;
  clienteId: number | null;
  fleteroId: number | null;
  rangoDesde: string;
  rangoHasta: string;
  viajeIds: number[];
}

export interface InformeFilters {
  tipo?: TipoInforme;
  clienteId?: number;
  fleteroId?: number;
  anio?: number;
}