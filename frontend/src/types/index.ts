export interface Cliente {
  id: number
  nombre: string
  periodoVencimiento: number
}

export interface CreateClienteDTO {
  nombre: string
  periodoVencimiento?: number
}

export interface Fletero {
  id: number
  nombre: string
  periodoVencimiento: number
}

export interface CreateFleteroDTO {
  nombre: string
  periodoVencimiento?: number
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
  createdAt?: string
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

export type TipoFactura = 'cobranza' | 'pago_fletero' | 'pago_servicio'
export type EstadoFactura = 'sin_facturar' | 'facturada' | 'pagada'

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

export interface FacturarDTO {
  numero: string
  fechaEmision: string
  vencimiento: string
}