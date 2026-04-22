// backend/src/services/informes.service.ts

import { pool } from '../config/db';
import { PoolClient } from 'pg';
import * as informesRepository from '../repositories/informes.repository';
import { viajesRepository } from '../repositories/viajes.repository';
import { Informe, CreateInformeDTO, InformeFilters } from '../types';

// ============================================================
// Helpers
// ============================================================

/**
 * Formatea el código humano del informe.
 * Ejemplo: formatearCodigo(2026, 42) → "INF-2026-000042"
 */
function formatearCodigo(anio: number, correlativo: number): string {
  return `INF-${anio}-${String(correlativo).padStart(6, '0')}`;
}

/**
 * Verifica que un string tenga formato YYYY-MM-DD (solo estructura, no valida día real).
 */
function esFechaValida(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

/**
 * Valida el DTO de creación. Lanza Error con mensaje descriptivo si algo está mal.
 * El prefijo del mensaje se usa en el controller para mapear al status HTTP.
 */
function validarDTO(dto: CreateInformeDTO): void {
  // Tipo
  if (dto.tipo !== 'cliente' && dto.tipo !== 'fletero') {
    throw new Error('DTO inválido: tipo debe ser "cliente" o "fletero"');
  }

  // Coherencia tipo / titular
  if (dto.tipo === 'cliente') {
    if (dto.clienteId === null || dto.clienteId === undefined) {
      throw new Error('DTO inválido: clienteId es requerido cuando tipo es "cliente"');
    }
    if (dto.fleteroId !== null) {
      throw new Error('DTO inválido: fleteroId debe ser null cuando tipo es "cliente"');
    }
  } else {
    if (dto.fleteroId === null || dto.fleteroId === undefined) {
      throw new Error('DTO inválido: fleteroId es requerido cuando tipo es "fletero"');
    }
    if (dto.clienteId !== null) {
      throw new Error('DTO inválido: clienteId debe ser null cuando tipo es "fletero"');
    }
  }

  // Rango de fechas
  if (!esFechaValida(dto.rangoDesde)) {
    throw new Error('DTO inválido: rangoDesde debe tener formato YYYY-MM-DD');
  }
  if (!esFechaValida(dto.rangoHasta)) {
    throw new Error('DTO inválido: rangoHasta debe tener formato YYYY-MM-DD');
  }
  if (dto.rangoDesde > dto.rangoHasta) {
    throw new Error('DTO inválido: rangoDesde no puede ser posterior a rangoHasta');
  }

// Viajes
  if (!Array.isArray(dto.viajeIds) || dto.viajeIds.length === 0) {
    throw new Error('DTO inválido: viajeIds debe contener al menos un viaje');
  }
  for (const id of dto.viajeIds) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`DTO inválido: viajeIds contiene un valor no válido (${id})`);
    }
  }
}

/**
 * Valida que todos los viajes del DTO correspondan al titular del informe.
 * Consulta los viajes en la base y compara cliente_id o fletero_id según el tipo.
 *
 * Esta validación complementa al CHECK del schema: el schema garantiza la coherencia
 * tipo/titular del informe, pero no puede verificar que los viajes asociados
 * correspondan a ese titular (CHECK no puede hacer queries).
 *
 * Si un viaje no existe, no aparece en el resultado de la query y será reportado
 * como "no coincide con el titular" (caso extremo que solo ocurre con POSTs manuales
 * con IDs inventados — el frontend nunca permite seleccionar IDs inexistentes).
 */
async function validarViajesCoincidenConTitular(dto: CreateInformeDTO): Promise<void> {
  const viajes = await viajesRepository.getClienteFleteroPorIds(dto.viajeIds);

  const viajesQueNoCoinciden: number[] = [];

  for (const viajeId of dto.viajeIds) {
    const viaje = viajes.find((v) => v.id === viajeId);

    // Si el viaje no existe en el resultado, o su titular no matchea, lo marcamos.
    if (!viaje) {
      viajesQueNoCoinciden.push(viajeId);
      continue;
    }

    if (dto.tipo === 'cliente' && viaje.clienteId !== dto.clienteId) {
      viajesQueNoCoinciden.push(viajeId);
    } else if (dto.tipo === 'fletero' && viaje.fleteroId !== dto.fleteroId) {
      viajesQueNoCoinciden.push(viajeId);
    }
  }

  if (viajesQueNoCoinciden.length > 0) {
    const actor = dto.tipo === 'cliente' ? 'cliente' : 'fletero';
    throw new Error(
      `No se puede crear: los viajes [${viajesQueNoCoinciden.join(', ')}] no corresponden al ${actor} seleccionado`
    );
  }
}

// ============================================================
// Operaciones públicas
// ============================================================

export async function getAll(filtros: InformeFilters): Promise<Informe[]> {
  console.log('[informes] service.getAll — request recibido');
  const informes = await informesRepository.getAll(filtros);
  console.log(`[informes] service.getAll — completado | registros: ${informes.length}`);
  return informes;
}

export async function getById(id: number): Promise<Informe | null> {
  console.log(`[informes] service.getById — request recibido | id: ${id}`);
  const informe = await informesRepository.getById(id);
  console.log(`[informes] service.getById — completado | encontrado: ${informe !== null}`);
  return informe;
}

export async function crear(dto: CreateInformeDTO): Promise<Informe> {
  console.log(`[informes] service.crear — request recibido | tipo: ${dto.tipo}, viajes: ${dto.viajeIds?.length ?? 0}`);

  // Validación de negocio
  validarDTO(dto);
  await validarViajesCoincidenConTitular(dto);

  // Deduplicación defensiva de viajeIds (evita 23505 en la PK compuesta de informes_viajes)
  const viajeIdsUnicos = [...new Set(dto.viajeIds)];

  // Año del momento de creación (no del rango del informe)
  const anio = new Date().getFullYear();

  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    const correlativo = await informesRepository.obtenerProximoCorrelativo(anio, client);
    const codigo = formatearCodigo(anio, correlativo);

    const informe = await informesRepository.crear(
      { ...dto, codigo, anio, correlativo },
      client
    );

    await informesRepository.vincularViajes(informe.id, viajeIdsUnicos, client);

    await client.query('COMMIT');

    // Re-fetch fuera de la transacción para devolver el informe con sus viajeIds poblados.
    // Podríamos construirlo en memoria combinando el resultado de crear() + viajeIdsUnicos,
    // pero getById nos garantiza que lo que devolvemos es exactamente lo que quedó persistido.
    const completo = await informesRepository.getById(informe.id);
    if (!completo) {
      // Caso imposible: acabamos de committear. Lo tratamos como bug interno.
      throw new Error('Inconsistencia: informe recién creado no se pudo recuperar');
    }

    console.log(`[informes] service.crear — completado | codigo: ${completo.codigo}, id: ${completo.id}`);
    return completo;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function eliminar(id: number): Promise<Informe | null> {
  console.log(`[informes] service.eliminar — request recibido | id: ${id}`);
  const eliminado = await informesRepository.eliminar(id);
  console.log(`[informes] service.eliminar — completado | encontrado: ${eliminado !== null}`);
  return eliminado;
}