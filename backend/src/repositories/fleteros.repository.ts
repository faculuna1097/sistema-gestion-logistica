// src/repositories/fleteros.repository.ts
import { pool } from '../config/db';
import { Fletero, CreateFleteroDTO } from '../types';
import { buildDynamicUpdate } from '../utils/dynamicUpdate';


const FLETEROS_FIELD_MAP: Partial<Record<keyof CreateFleteroDTO, string>> = {
  nombre:   'nombre',
  email:    'email',
  telefono: 'telefono',
  cbu:      'cbu',
  cuit:     'cuit',
};

const COLUMNS = `id, nombre, email, telefono, cbu, cuit`;

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
    `INSERT INTO fleteros (nombre, email, telefono, cbu, cuit)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [data.nombre, data.email ?? null, data.telefono ?? null, data.cbu ?? null, data.cuit ?? null]
  );
  console.log(`[fleteros] create — completado | id: ${result.rows[0].id}`);
  return result.rows[0];
}

export async function update(id: number, data: Partial<CreateFleteroDTO>): Promise<Fletero | null> {
  console.log(`[fleteros] update — request recibido | id: ${id}`);

  const { setClause, values, nextIndex } = buildDynamicUpdate(data, FLETEROS_FIELD_MAP);

  if (!setClause) {
    console.log(`[fleteros] update — payload vacío, devolviendo registro sin tocar la DB | id: ${id}`);
    return getById(id);
  }

  const result = await pool.query<Fletero>(
    `UPDATE fleteros SET ${setClause} WHERE id = $${nextIndex} RETURNING ${COLUMNS}`,
    [...values, id]
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