import { viajesRepository } from '../repositories/viajes.repository';
import * as facturasRepository from '../repositories/facturas.repository';
import { Viaje, CreateViajeDTO } from '../types';
import { pool } from '../config/db'; // ✅
function calcularVencimiento(fecha: string): string {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export const viajesService = {
  async getAll(): Promise<Viaje[]> {
    return viajesRepository.getAll();
  },

  async getById(id: number): Promise<Viaje | null> {
    return viajesRepository.getById(id);
  },

  async crear(datos: CreateViajeDTO): Promise<Viaje> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crea el viaje dentro de la transacción — mapRow se aplica en el repository
      const viaje = await viajesRepository.crear(datos, client);

      const vencimiento = calcularVencimiento(viaje.fecha);

      await client.query(
        `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, vencimiento, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'sin_facturar')`,
        ['cobranza', datos.clienteId, null, viaje.id, datos.valorCliente, vencimiento]
      );

      await client.query(
        `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, vencimiento, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'sin_facturar')`,
        ['pago_fletero', null, datos.fleteroId, viaje.id, datos.costoFletero, vencimiento]
      );

      await client.query('COMMIT');
      console.log(`[viajes] crear — completado | id: ${viaje.id}`);
      return viaje;

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async actualizar(id: number, datos: Partial<CreateViajeDTO>): Promise<Viaje | null> {
    return viajesRepository.actualizar(id, datos);
  },

  async eliminar(id: number): Promise<Viaje | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await facturasRepository.eliminarPorViajeId(id, client);
      const viaje = await viajesRepository.eliminar(id, client);
      await client.query('COMMIT');
      return viaje;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};