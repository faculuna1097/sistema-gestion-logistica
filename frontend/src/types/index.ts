// frontend/src/types/index.ts - TypeScript types

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
  createdAt?: string
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