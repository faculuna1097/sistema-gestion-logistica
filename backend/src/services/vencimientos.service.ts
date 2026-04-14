// src/services/vencimientos.service.ts

import * as vencimientosRepository from '../repositories/vencimientos.repository';
import { VencimientoRow } from '../repositories/vencimientos.repository';

export interface VencimientosResponse {
  vencidas: VencimientoRow[];
  delMes: VencimientoRow[];
}

export async function getVencimientos(mes: string): Promise<VencimientosResponse> {
  console.log('[vencimientos] getVencimientos — request recibido | mes:', mes);

  // Validar formato YYYY-MM antes de ir a la base
  const mesRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!mesRegex.test(mes)) {
    throw new Error('El parámetro mes debe tener formato YYYY-MM');
  }

  const [vencidas, delMes] = await Promise.all([
    vencimientosRepository.getVencidas(),
    vencimientosRepository.getDelMes(mes),
  ]);

  console.log('[vencimientos] getVencimientos — completado');
  return { vencidas, delMes };
}