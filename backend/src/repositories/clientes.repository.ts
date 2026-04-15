// repositories/clientes.repository.ts
import { pool } from '../config/db';
import { Cliente, CreateClienteDTO } from '../types';

const COLUMNS = `id, nombre`;

export async function getAll(): Promise<Cliente[]> {
  console.log('[clientes] getAll — request recibido');
  const result = await pool.query<Cliente>(
    `SELECT ${COLUMNS} FROM clientes ORDER BY nombre ASC`
  );
  console.log(`[clientes] getAll — completado | cantidad: ${result.rows.length}`);
  return result.rows;
}

export async function getById(id: number): Promise<Cliente | null> {
  console.log(`[clientes] getById — request recibido | id: ${id}`);
  const result = await pool.query<Cliente>(
    `SELECT ${COLUMNS} FROM clientes WHERE id = $1`, [id]
  );
  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] getById — completado | encontrado: ${cliente !== null}`);
  return cliente;
}

export async function create(data: CreateClienteDTO): Promise<Cliente> {
  console.log(`[clientes] create — request recibido | nombre: ${data.nombre}`);
  const result = await pool.query<Cliente>(
    `INSERT INTO clientes (nombre)
     VALUES ($1)
     RETURNING ${COLUMNS}`,
    [data.nombre]
  );
  console.log(`[clientes] create — completado | id: ${result.rows[0].id}`);
  return result.rows[0];
}

export async function update(id: number, data: Partial<CreateClienteDTO>): Promise<Cliente | null> {
  console.log(`[clientes] update — request recibido | id: ${id}`);
  const result = await pool.query<Cliente>(
    `UPDATE clientes
     SET nombre = COALESCE($1, nombre)
     WHERE id = $2
     RETURNING ${COLUMNS}`,
    [data.nombre ?? null, id]
  );
  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] update — completado | encontrado: ${cliente !== null}`);
  return cliente;
}

export async function remove(id: number): Promise<Cliente | null> {
  console.log(`[clientes] remove — request recibido | id: ${id}`);
  const result = await pool.query<Cliente>(
    `DELETE FROM clientes WHERE id = $1 RETURNING ${COLUMNS}`, [id]
  );
  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] remove — completado | encontrado: ${cliente !== null}`);
  return cliente;
}