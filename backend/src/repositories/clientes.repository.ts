// repositories/clientes.repository.ts
import { pool } from '../config/db';
import { Cliente, CreateClienteDTO } from '../types';

const COLUMNS = `id, nombre, email, telefono, cbu, cuit`;

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
    `INSERT INTO clientes (nombre, email, telefono, cbu, cuit)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [data.nombre, data.email ?? null, data.telefono ?? null, data.cbu ?? null, data.cuit ?? null]
  );
  console.log(`[clientes] create — completado | id: ${result.rows[0].id}`);
  return result.rows[0];
}

export async function update(id: number, data: Partial<CreateClienteDTO>): Promise<Cliente | null> {
  console.log(`[clientes] update — request recibido | id: ${id}`);
  const result = await pool.query<Cliente>(
    `UPDATE clientes
     SET nombre   = COALESCE($1, nombre),
         email    = COALESCE($2, email),
         telefono = COALESCE($3, telefono),
         cbu      = COALESCE($4, cbu),
         cuit     = COALESCE($5, cuit)
     WHERE id = $6
     RETURNING ${COLUMNS}`,
    [data.nombre ?? null, data.email ?? null, data.telefono ?? null, data.cbu ?? null, data.cuit ?? null, id]
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