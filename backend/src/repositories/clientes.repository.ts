// src/repositories/clientes.repository.ts

import { pool } from '../config/db';
import { Cliente, CreateClienteDTO } from '../types';

export async function getAll(): Promise<Cliente[]> {
  console.log('[clientes] getAll — request recibido');

  const result = await pool.query<Cliente>(
    'SELECT id, nombre, periodo_vencimiento FROM clientes ORDER BY nombre ASC'
  );

  console.log(`[clientes] getAll — completado | cantidad: ${result.rows.length}`);
  return result.rows;
}

export async function getById(id: number): Promise<Cliente | null> {
  console.log(`[clientes] getById — request recibido | id: ${id}`);

  const result = await pool.query<Cliente>(
    'SELECT id, nombre, periodo_vencimiento FROM clientes WHERE id = $1',
    [id]
  );

  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] getById — completado | encontrado: ${cliente !== null}`);
  return cliente;
}

export async function create(data: CreateClienteDTO): Promise<Cliente> {
  console.log(`[clientes] create — request recibido | nombre: ${data.nombre}`);

  const result = await pool.query<Cliente>(
    `INSERT INTO clientes (nombre, periodo_vencimiento)
     VALUES ($1, $2)
     RETURNING id, nombre, periodo_vencimiento`,
    [data.nombre, data.periodoVencimiento]
  );

  console.log(`[clientes] create — completado | id: ${result.rows[0].id}`);
  return result.rows[0];
}

export async function update(id: number, data: Partial<CreateClienteDTO>): Promise<Cliente | null> {
  console.log(`[clientes] update — request recibido | id: ${id}`);

  const result = await pool.query<Cliente>(
    `UPDATE clientes
     SET nombre = COALESCE($1, nombre),
         periodo_vencimiento = COALESCE($2, periodo_vencimiento)
     WHERE id = $3
     RETURNING id, nombre, periodo_vencimiento`,
    [data.nombre ?? null, data.periodoVencimiento ?? null, id]
  );

  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] update — completado | encontrado: ${cliente !== null}`);
  return cliente;
}

export async function remove(id: number): Promise<Cliente | null> {
  console.log(`[clientes] remove — request recibido | id: ${id}`);

  const result = await pool.query<Cliente>(
    `DELETE FROM clientes WHERE id = $1
     RETURNING id, nombre, periodo_vencimiento`,
    [id]
  );

  const cliente = result.rows[0] ?? null;
  console.log(`[clientes] remove — completado | encontrado: ${cliente !== null}`);
  return cliente;
}