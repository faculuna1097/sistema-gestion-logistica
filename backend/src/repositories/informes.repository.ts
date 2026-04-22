// backend/src/repositories/informes.repository.ts

import { pool } from '../config/db';
import { PoolClient } from 'pg';
import { Informe, CreateInformeDTO, InformeFilters, TipoInforme } from '../types';

const SELECT_CON_VIAJES = `
  i.id, i.codigo, i.anio, i.correlativo, i.tipo,
  i.cliente_id, i.fletero_id,
  i.rango_desde, i.rango_hasta, i.created_at,
  COALESCE(
    array_agg(iv.viaje_id ORDER BY iv.viaje_id) FILTER (WHERE iv.viaje_id IS NOT NULL),
    ARRAY[]::integer[]
  ) AS viaje_ids
`;

function mapRow(row: Record<string, unknown>): Informe {
  return {
    id:          Number(row.id),
    codigo:      row.codigo as string,
    anio:        Number(row.anio),
    correlativo: Number(row.correlativo),
    tipo:        row.tipo as TipoInforme,
    clienteId:   row.cliente_id as number | null,
    fleteroId:   row.fletero_id as number | null,
    rangoDesde:  new Date(row.rango_desde as string).toISOString().slice(0, 10),
    rangoHasta:  new Date(row.rango_hasta as string).toISOString().slice(0, 10),
    createdAt:   (row.created_at as Date).toISOString(),
    viajeIds:    (row.viaje_ids as number[]).map(Number),
  };
}

export async function getAll(filtros: InformeFilters): Promise<Informe[]> {
  const filtrosLog = Object.keys(filtros).length > 0 ? ` | filtros: ${JSON.stringify(filtros)}` : '';
  console.log(`[informes] getAll — request recibido${filtrosLog}`);

  const where: string[] = [];
  const values: unknown[] = [];

  if (filtros.tipo !== undefined) {
    values.push(filtros.tipo);
    where.push(`i.tipo = $${values.length}`);
  }
  if (filtros.clienteId !== undefined) {
    values.push(filtros.clienteId);
    where.push(`i.cliente_id = $${values.length}`);
  }
  if (filtros.fleteroId !== undefined) {
    values.push(filtros.fleteroId);
    where.push(`i.fletero_id = $${values.length}`);
  }
  if (filtros.anio !== undefined) {
    values.push(filtros.anio);
    where.push(`i.anio = $${values.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const result = await pool.query(`
    SELECT ${SELECT_CON_VIAJES}
    FROM informes i
    LEFT JOIN informes_viajes iv ON iv.informe_id = i.id
    ${whereClause}
    GROUP BY i.id
    ORDER BY i.created_at DESC, i.id DESC
  `, values);

  console.log(`[informes] getAll — completado | registros: ${result.rows.length}`);
  return result.rows.map(mapRow);
}

export async function getById(id: number): Promise<Informe | null> {
  console.log(`[informes] getById — request recibido | id: ${id}`);
  const result = await pool.query(`
    SELECT ${SELECT_CON_VIAJES}
    FROM informes i
    LEFT JOIN informes_viajes iv ON iv.informe_id = i.id
    WHERE i.id = $1
    GROUP BY i.id
  `, [id]);
  console.log(`[informes] getById — completado | encontrado: ${result.rows.length > 0}`);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

/**
 * Devuelve el próximo correlativo para el año indicado.
 * Pensado para usarse dentro de una transacción (requiere PoolClient).
 */
export async function obtenerProximoCorrelativo(anio: number, client: PoolClient): Promise<number> {
  console.log(`[informes] obtenerProximoCorrelativo — request recibido | anio: ${anio}`);
  const result = await client.query(
    `SELECT COALESCE(MAX(correlativo), 0) + 1 AS siguiente FROM informes WHERE anio = $1`,
    [anio]
  );
  const siguiente = Number(result.rows[0].siguiente);
  console.log(`[informes] obtenerProximoCorrelativo — completado | siguiente: ${siguiente}`);
  return siguiente;
}

/**
 * Crea el informe. No vincula viajes — eso lo hace vincularViajes por separado.
 * Requiere PoolClient: siempre se invoca dentro de una transacción.
 */
export async function crear(
  datos: CreateInformeDTO & { codigo: string; anio: number; correlativo: number },
  client: PoolClient
): Promise<Informe> {
  console.log(`[informes] crear — request recibido | codigo: ${datos.codigo}, tipo: ${datos.tipo}`);
  const result = await client.query(
    `INSERT INTO informes (codigo, anio, correlativo, tipo, cliente_id, fletero_id, rango_desde, rango_hasta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, codigo, anio, correlativo, tipo, cliente_id, fletero_id, rango_desde, rango_hasta, created_at`,
    [datos.codigo, datos.anio, datos.correlativo, datos.tipo,
     datos.clienteId, datos.fleteroId, datos.rangoDesde, datos.rangoHasta]
  );

  // RETURNING no incluye viaje_ids (esta query no toca informes_viajes).
  // Los agregamos como array vacío para cumplir con el tipo Informe.
  const row = { ...result.rows[0], viaje_ids: [] };
  console.log(`[informes] crear — completado | id: ${row.id}`);
  return mapRow(row);
}

/**
 * Vincula viajes a un informe con bulk insert.
 * Requiere PoolClient: siempre se invoca dentro de una transacción.
 */
export async function vincularViajes(
  informeId: number,
  viajeIds: number[],
  client: PoolClient
): Promise<void> {
  console.log(`[informes] vincularViajes — request recibido | informeId: ${informeId}, viajes: ${viajeIds.length}`);

  if (viajeIds.length === 0) {
    console.log(`[informes] vincularViajes — sin viajes a vincular, skip`);
    return;
  }

  // Armamos los placeholders: ($1, $2), ($1, $3), ($1, $4)...
  // El informe_id se repite en todas las filas.
  const placeholders = viajeIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
  const values = [informeId, ...viajeIds];

  await client.query(
    `INSERT INTO informes_viajes (informe_id, viaje_id) VALUES ${placeholders}`,
    values
  );
  console.log(`[informes] vincularViajes — completado | informeId: ${informeId}, vinculados: ${viajeIds.length}`);
}

export async function eliminar(id: number): Promise<Informe | null> {
  console.log(`[informes] eliminar — request recibido | id: ${id}`);

  // Leemos primero (con el array de viajes) para poder devolverlo.
  // El DELETE después usa ON DELETE CASCADE para limpiar informes_viajes.
  const existente = await getById(id);
  if (!existente) {
    console.log(`[informes] eliminar — completado | encontrado: false`);
    return null;
  }

  await pool.query(`DELETE FROM informes WHERE id = $1`, [id]);
  console.log(`[informes] eliminar — completado | id: ${id}`);
  return existente;
}