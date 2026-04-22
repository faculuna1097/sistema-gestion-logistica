// backend/src/services/facturas.service.ts

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
  datos: {
    numero: string;
    fechaEmision: string;
    vencimiento: string;
    ajustesMonto?: { id: number; monto: number }[];
    incluyeIva?: boolean;
  }
): Promise<Factura[]> {
  // --- Validaciones semánticas de los campos nuevos ---

  if (datos.incluyeIva !== undefined && typeof datos.incluyeIva !== 'boolean') {
    throw new Error(`DTO inválido: incluyeIva debe ser boolean`);
  }

  if (datos.ajustesMonto !== undefined) {
    const idsSet = new Set(ids);
    const idsAjustadosVistos = new Set<number>();

    for (const ajuste of datos.ajustesMonto) {
      if (!idsSet.has(ajuste.id)) {
        throw new Error(
          `DTO inválido: ajuste de monto apunta a id ${ajuste.id} que no está en el lote`
        );
      }
      if (idsAjustadosVistos.has(ajuste.id)) {
        throw new Error(
          `DTO inválido: ajuste de monto duplicado para id ${ajuste.id}`
        );
      }
      if (typeof ajuste.monto !== 'number' || !Number.isFinite(ajuste.monto) || ajuste.monto <= 0) {
        throw new Error(
          `DTO inválido: monto de ajuste para id ${ajuste.id} debe ser un número positivo`
        );
      }
      idsAjustadosVistos.add(ajuste.id);
    }
  }

  // --- Chequeo de número duplicado (best-effort, sin constraint UNIQUE en DB) ---

  const existe = await facturasRepository.existeNumero(datos.numero);
  if (existe) {
    throw new Error(`El número de factura '${datos.numero}' ya existe`);
  }

  // --- Delegación al repository ---
  // El repository valida atómicamente que los ids estén en sin_facturar
  // y hace ROLLBACK si alguno no matchea. No necesita revalidación posterior.
  return facturasRepository.facturarLote(ids, datos);
}