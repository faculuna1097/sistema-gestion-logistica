// src/repositories/fleteros.repository.ts
import { pool } from '../config/db';
import { Fletero, CreateFleteroDTO } from '../types';

const COLUMNS = `id, nombre`;

export async function getAll(): Promise<Fletero[]> {
  console.log('[fleteros] getAll — request recibido');
  const result = await pool.query<Fletero>(
    `SELECT ${COLUMNS} FROM fleteros ORDER BY nombre ASC`
  );
  console.log(`[fleteros] getAll — completado | cantidad: ${result.rows.length}`);
  return result.rows;
}

export async function getById(id: number): Promise<Fletero | null> {
  console.log(`[fleteros] getById — request recibido | id: ${id}`);
  const result = await pool.query<Fletero>(
    `SELECT ${COLUMNS} FROM fleteros WHERE id = $1`, [id]
  );
  const fletero = result.rows[0] ?? null;
  console.log(`[fleteros] getById — completado | encontrado: ${fletero !== null}`);
  return fletero;
}

export async function create(data: CreateFleteroDTO): Promise<Fletero> {
  console.log(`[fleteros] create — request recibido | nombre: ${data.nombre}`);
  const result = await pool.query<Fletero>(
    `INSERT INTO fleteros (nombre)
     VALUES ($1)
     RETURNING ${COLUMNS}`,
    [data.nombre]
  );
  console.log(`[fleteros] create — completado | id: ${result.rows[0].id}`);
  return result.rows[0];
}

export async function update(id: number, data: Partial<CreateFleteroDTO>): Promise<Fletero | null> {
  console.log(`[fleteros] update — request recibido | id: ${id}`);
  const result = await pool.query<Fletero>(
    `UPDATE fleteros
     SET nombre = COALESCE($1, nombre)
     WHERE id = $2
     RETURNING ${COLUMNS}`,
    [data.nombre ?? null, id]
  );
  const fletero = result.rows[0] ?? null;
  console.log(`[fleteros] update — completado | encontrado: ${fletero !== null}`);
  return fletero;
}

export async function remove(id: number): Promise<Fletero | null> {
  console.log(`[fleteros] remove — request recibido | id: ${id}`);
  const result = await pool.query<Fletero>(
    `DELETE FROM fleteros WHERE id = $1 RETURNING ${COLUMNS}`, [id]
  );
  const fletero = result.rows[0] ?? null;
  console.log(`[fleteros] remove — completado | encontrado: ${fletero !== null}`);
  return fletero;
}