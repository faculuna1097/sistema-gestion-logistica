import * as facturasRepository from '../repositories/facturas.repository';
import { Factura, CreateFacturaDTO } from '../types';

export async function getAll(filtros: {
  tipo?: string;
  estado?: string;
  clienteId?: number;
  fleteroId?: number;
  viajeId?: number;
}): Promise<Factura[]> {
  return facturasRepository.getAll({
    tipo: filtros.tipo,
    estado: filtros.estado,
    cliente_id: filtros.clienteId,
    fletero_id: filtros.fleteroId,
    viaje_id: filtros.viajeId,
  });
}

export async function getById(id: number): Promise<Factura> {
  const factura = await facturasRepository.getById(id);
  if (!factura) throw new Error(`Factura ${id} no encontrada`);
  return factura;
}

export async function crear(datos: CreateFacturaDTO): Promise<Factura> {
  if (datos.tipo !== 'pago_servicio') {
    throw new Error('Solo se pueden crear manualmente facturas de tipo pago_servicio');
  }
  return facturasRepository.crear(datos);
}

export async function actualizar(id: number, datos: Partial<CreateFacturaDTO>): Promise<Factura> {
  const factura = await facturasRepository.actualizar(id, datos);
  if (!factura) throw new Error(`Factura ${id} no encontrada`);
  return factura;
}

export async function facturar(
  id: number,
  datos: { numero: string; fechaEmision: string; vencimiento: string }
): Promise<Factura> {
  const factura = await facturasRepository.facturar(id, datos);
  if (!factura) {
    throw new Error(`Factura ${id} no encontrada o no está en estado sin_facturar`);
  }
  return factura;
}

export async function pagar(id: number): Promise<Factura> {
  const factura = await facturasRepository.pagar(id);
  if (!factura) {
    throw new Error(`Factura ${id} no encontrada o no está en estado facturada`);
  }
  return factura;
}

export async function eliminar(id: number): Promise<void> {
  const eliminada = await facturasRepository.eliminar(id);
  if (!eliminada) throw new Error(`Factura ${id} no encontrada`);
}

export async function revertir(id: number): Promise<Factura> {
  const factura = await facturasRepository.revertir(id);
  if (!factura) {
    throw new Error(`Factura ${id} no encontrada o no está en estado facturada`);
  }
  return factura;
}

export async function facturarLote(
  ids: number[],
  datos: { numero: string; fechaEmision: string; vencimiento: string }
): Promise<Factura[]> {
  const existe = await facturasRepository.existeNumero(datos.numero);
  if (existe) {
    throw new Error(`El número de factura '${datos.numero}' ya existe`);
  }

  const facturas = await facturasRepository.facturarLote(ids, datos);

  if (facturas.length < ids.length) {
    throw new Error(
      `Solo se actualizaron ${facturas.length} de ${ids.length} facturas. Algunas no estaban en estado sin_facturar`
    );
  }

  return facturas;
}