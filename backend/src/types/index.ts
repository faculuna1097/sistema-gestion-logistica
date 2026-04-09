// CLIENTES
export interface Cliente {
  id: number
  nombre: string
  periodoVencimiento: number
}

export interface CreateClienteDTO {
  nombre: string
  periodoVencimiento?: number
}

// FLETEROS
export interface Fletero {
  id: number
  nombre: string
  periodoVencimiento: number
}

export interface CreateFleteroDTO {
  nombre: string
  periodoVencimiento?: number
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