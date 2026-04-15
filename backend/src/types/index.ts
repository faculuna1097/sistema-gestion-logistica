// src/types/index.ts

// CLIENTES
export interface Cliente {
  id: number
  nombre: string
}

export interface CreateClienteDTO {
  nombre: string
}

// FLETEROS
export interface Fletero {
  id: number
  nombre: string
}

export interface CreateFleteroDTO {
  nombre: string
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
  numeroFacturaCobranza: string | null
  numeroFacturaPagoFletero: string | null
}

export interface CreateViajeDTO {
  fecha: string
  clienteId: number
  valorCliente: number
  fleteroId: number
  costoFletero: number
}

// FACTURAS
export interface Factura {
  id: number
  tipo: 'cobranza' | 'pago_fletero' | 'pago_servicio'
  clienteId: number | null
  fleteroId: number | null
  viajeId: number | null
  monto: number
  descripcion: string | null
  numero: string | null
  fechaEmision: string | null
  vencimiento: string | null
  estado: 'sin_facturar' | 'facturada' | 'pagada'
}

export interface CreateFacturaDTO {
  tipo: 'cobranza' | 'pago_fletero' | 'pago_servicio'
  clienteId?: number | null
  fleteroId?: number | null
  viajeId?: number
  monto: number
  descripcion?: string
  numero: string | null
  fechaEmision: string | null
  vencimiento?: string
}