import { pool } from '../config/db';
import { PoolClient } from 'pg';
import { Factura, CreateFacturaDTO } from '../types';

interface FiltrosFactura {
  tipo?: string;
  estado?: string;
  cliente_id?: number;
  fletero_id?: number;
  viaje_id?: number;
}

function mapRow(row: Record<string, unknown>): Factura {
  return {
    id:           row.id as number,
    tipo:         row.tipo as Factura['tipo'],
    clienteId:    row.cliente_id as number | null,
    fleteroId:    row.fletero_id as number | null,
    viajeId:      row.viaje_id as number | null,
    monto:        Number(row.monto),
    descripcion:  row.descripcion as string | null,
    numero:       row.numero as string | null,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision as string).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento as string).toISOString().slice(0, 10)
      : null,
    estado: row.estado as Factura['estado'],
  };
}

const SELECT = `
  id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
  numero, fecha_emision, vencimiento, estado
`;

export async function getAll(filtros: FiltrosFactura): Promise<Factura[]> {
  console.log('[facturas] getAll — request recibido | filtros:', filtros);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  let idx = 1;

  if (filtros.tipo)       { condiciones.push(`tipo = $${idx++}`);       valores.push(filtros.tipo); }
  if (filtros.estado)     { condiciones.push(`estado = $${idx++}`);     valores.push(filtros.estado); }
  if (filtros.cliente_id) { condiciones.push(`cliente_id = $${idx++}`); valores.push(filtros.cliente_id); }
  if (filtros.fletero_id) { condiciones.push(`fletero_id = $${idx++}`); valores.push(filtros.fletero_id); }
  if (filtros.viaje_id)   { condiciones.push(`viaje_id = $${idx++}`);   valores.push(filtros.viaje_id); }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const result = await pool.query(`SELECT ${SELECT} FROM facturas ${where} ORDER BY id DESC`, valores);

  console.log(`[facturas] getAll — completado | resultados: ${result.rows.length}`);
  return result.rows.map(mapRow);
}

export async function getById(id: number): Promise<Factura | null> {
  console.log(`[facturas] getById — request recibido | id: ${id}`);
  const result = await pool.query(`SELECT ${SELECT} FROM facturas WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;
  console.log(`[facturas] getById — completado | id: ${id}`);
  return mapRow(result.rows[0]);
}

export async function crear(datos: CreateFacturaDTO): Promise<Factura> {
  console.log('[facturas] crear — request recibido | tipo:', datos.tipo);
  const result = await pool.query(
    `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, descripcion, numero, fecha_emision, vencimiento, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'sin_facturar')
     RETURNING ${SELECT}`,
    [datos.tipo, datos.clienteId ?? null, datos.fleteroId ?? null, datos.viajeId ?? null,
     datos.monto, datos.descripcion ?? null, datos.numero ?? null, datos.fechaEmision ?? null, datos.vencimiento ?? null]
  );
  console.log(`[facturas] crear — completado | id: ${result.rows[0].id}`);
  return mapRow(result.rows[0]);
}

export async function actualizar(id: number, datos: Partial<CreateFacturaDTO>): Promise<Factura | null> {
  console.log(`[facturas] actualizar — request recibido | id: ${id}`);
  const result = await pool.query(
    `UPDATE facturas SET
       monto       = COALESCE($1, monto),
       descripcion = COALESCE($2, descripcion),
       numero      = COALESCE($3, numero),
       vencimiento = COALESCE($4, vencimiento)
     WHERE id = $5
     RETURNING ${SELECT}`,
    [datos.monto ?? null, datos.descripcion ?? null, datos.numero ?? null, datos.vencimiento ?? null, id]
  );
  if (result.rows.length === 0) return null;
  console.log(`[facturas] actualizar — completado | id: ${id}`);
  return mapRow(result.rows[0]);
}

export async function facturar(
  id: number,
  datos: { numero: string; fechaEmision: string; vencimiento: string }
): Promise<Factura | null> {
  console.log(`[facturas] facturar — request recibido | id: ${id}`);
  const result = await pool.query(
    `UPDATE facturas SET
       estado        = 'facturada',
       numero        = $1,
       fecha_emision = $2,
       vencimiento   = $3
     WHERE id = $4 AND estado = 'sin_facturar'
     RETURNING ${SELECT}`,
    [datos.numero, datos.fechaEmision, datos.vencimiento, id]
  );
  if (result.rows.length === 0) return null;
  console.log(`[facturas] facturar — completado | id: ${id}`);
  return mapRow(result.rows[0]);
}

export async function pagar(id: number): Promise<Factura | null> {
  console.log(`[facturas] pagar — request recibido | id: ${id}`);
  const result = await pool.query(
    `UPDATE facturas SET estado = 'pagada'
     WHERE id = $1 AND estado = 'facturada'
     RETURNING ${SELECT}`,
    [id]
  );
  if (result.rows.length === 0) return null;
  console.log(`[facturas] pagar — completado | id: ${id}`);
  return mapRow(result.rows[0]);
}

export async function eliminar(id: number): Promise<boolean> {
  console.log(`[facturas] eliminar — request recibido | id: ${id}`);
  const result = await pool.query(`DELETE FROM facturas WHERE id = $1 RETURNING id`, [id]);
  console.log(`[facturas] eliminar — completado | id: ${id}`);
  return result.rows.length > 0;
}

export async function revertir(id: number): Promise<Factura | null> {
  console.log(`[facturas] revertir — request recibido | id: ${id}`);
  const result = await pool.query(
    `UPDATE facturas SET
       estado        = 'sin_facturar',
       numero        = NULL,
       fecha_emision = NULL,
       vencimiento   = NULL
     WHERE id = $1 AND estado = 'facturada'
     RETURNING ${SELECT}`,
    [id]
  );
  if (result.rows.length === 0) return null;
  console.log(`[facturas] revertir — completado | id: ${id}`);
  return mapRow(result.rows[0]);
}


/**
 * Elimina todas las facturas asociadas a un viaje.
 * @param viajeId - El id del viaje.
 * @param client - El cliente de la base de datos.
 * @returns Una promesa que se resuelve cuando se completa la eliminación.
 */
export async function eliminarPorViajeId(viajeId: number, client: PoolClient): Promise<void> {
  console.log(`[facturas] eliminarPorViajeId — request recibido | viajeId: ${viajeId}`);
  await client.query(`DELETE FROM facturas WHERE viaje_id = $1`, [viajeId]);
  console.log(`[facturas] eliminarPorViajeId — completado | viajeId: ${viajeId}`);
}


export async function existeNumero(numero: string): Promise<boolean> {
  console.log(`[facturas] existeNumero — request recibido | numero: ${numero}`);
  const result = await pool.query(
    `SELECT 1 FROM facturas WHERE numero = $1 LIMIT 1`,
    [numero]
  );
  console.log(`[facturas] existeNumero — completado | existe: ${result.rows.length > 0}`);
  return result.rows.length > 0;
}

export async function facturarLote(
  ids: number[],
  datos: { numero: string; fechaEmision: string; vencimiento: string }
): Promise<Factura[]> {
  console.log(`[facturas] facturarLote — request recibido | ids: ${ids.length}`);
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE facturas SET
         estado        = 'facturada',
         numero        = $1,
         fecha_emision = $2,
         vencimiento   = $3
       WHERE estado = 'sin_facturar' AND id = ANY($4)
       RETURNING ${SELECT}`,
      [datos.numero, datos.fechaEmision, datos.vencimiento, ids]
    );
    await client.query('COMMIT');
    console.log(`[facturas] facturarLote — completado | actualizadas: ${result.rows.length}`);
    return result.rows.map(mapRow);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}