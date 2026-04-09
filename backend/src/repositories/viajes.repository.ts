import { pool } from '../config/db';
import { PoolClient } from 'pg';
import { Viaje, CreateViajeDTO } from '../types';

const TZ = 'America/Argentina/Buenos_Aires';

export const viajesRepository = {
  async getAll(): Promise<Viaje[]> {
    console.log('[viajes] getAll — request recibido');
    const result = await pool.query<Viaje>(
      `SELECT id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at
       FROM viajes
       ORDER BY fecha DESC`
    );
    console.log(`[viajes] getAll — completado | registros: ${result.rows.length}`);
    return result.rows;
  },

  async getById(id: number): Promise<Viaje | null> {
    console.log(`[viajes] getById — request recibido | id: ${id}`);
    const result = await pool.query<Viaje>(
      `SELECT id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at
       FROM viajes
       WHERE id = $1`,
      [id]
    );
    console.log(`[viajes] getById — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ?? null;
  },

  async crear(datos: CreateViajeDTO): Promise<Viaje> {
    console.log(`[viajes] crear — request recibido | cliente_id: ${datos.clienteId}, fletero_id: ${datos.fleteroId}`);
    const result = await pool.query<Viaje>(
      `INSERT INTO viajes (fecha, cliente_id, valor_cliente, fletero_id, costo_fletero)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at`,
      [datos.fecha, datos.clienteId, datos.valorCliente, datos.fleteroId, datos.costoFletero]
    );
    console.log(`[viajes] crear — completado | id: ${result.rows[0].id}`);
    return result.rows[0];
  },

  async actualizar(id: number, datos: Partial<CreateViajeDTO>): Promise<Viaje | null> {
    console.log(`[viajes] actualizar — request recibido | id: ${id}`);
    const result = await pool.query<Viaje>(
      `UPDATE viajes SET
        fecha          = COALESCE($1, fecha),
        cliente_id     = COALESCE($2, cliente_id),
        valor_cliente  = COALESCE($3, valor_cliente),
        fletero_id     = COALESCE($4, fletero_id),
        costo_fletero  = COALESCE($5, costo_fletero)
       WHERE id = $6
       RETURNING id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at`,
      [datos.fecha, datos.clienteId, datos.valorCliente, datos.fleteroId, datos.costoFletero, id]
    );
    console.log(`[viajes] actualizar — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ?? null;
  },

  async eliminar(id: number, client?: PoolClient): Promise<Viaje | null> {
    console.log(`[viajes] eliminar — request recibido | id: ${id}`);
    const executor = client ?? pool;
    const result = await executor.query<Viaje>(
      `DELETE FROM viajes WHERE id = $1
      RETURNING id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at`,
      [id]
    );
    console.log(`[viajes] eliminar — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ?? null;
  },
};