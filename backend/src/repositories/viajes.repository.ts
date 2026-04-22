// src/repositories/viajes.repository.ts

import { pool } from '../config/db';
import { PoolClient } from 'pg';
import { Viaje, CreateViajeDTO, EstadoFactura, ViajeFilters } from '../types';

const SELECT = `
  id, fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, created_at,
  numero_remito, destinatario
`;

const SELECT_CON_FACTURAS = `
  v.id, v.fecha, v.cliente_id, v.valor_cliente, v.fletero_id, v.costo_fletero, v.created_at,
  v.numero_remito, v.destinatario,
  fc.numero  AS numero_factura_cobranza,
  fc.estado  AS estado_factura_cobranza,
  fc.vencimiento AS vencimiento_cobranza,
  fp.numero  AS numero_factura_pago_fletero,
  fp.estado  AS estado_factura_pago_fletero,
  fp.vencimiento AS vencimiento_pago_fletero
`;


function mapRow(row: Record<string, unknown>): Viaje {
  return {
    id:                          Number(row.id),
    fecha:                       new Date(row.fecha as string).toISOString().slice(0, 10),
    clienteId:                   Number(row.cliente_id),
    valorCliente:                Number(row.valor_cliente),
    fleteroId:                   Number(row.fletero_id),
    costoFletero:                Number(row.costo_fletero),
    createdAt:                   row.created_at as string,
    numeroRemito:                (row.numero_remito  as string) ?? null,
    destinatario:                (row.destinatario   as string) ?? null,
    numeroFacturaCobranza:       (row.numero_factura_cobranza    as string)  ?? null,
    estadoFacturaCobranza:       (row.estado_factura_cobranza    as EstadoFactura) ?? null,
    vencimientoCobranza:         row.vencimiento_cobranza
                                   ? new Date(row.vencimiento_cobranza as string).toISOString().slice(0, 10)
                                   : null,
    numeroFacturaPagoFletero:    (row.numero_factura_pago_fletero as string)  ?? null,
    estadoFacturaPagoFletero:    (row.estado_factura_pago_fletero as EstadoFactura) ?? null,
    vencimientoPagoFletero:      row.vencimiento_pago_fletero
                                   ? new Date(row.vencimiento_pago_fletero as string).toISOString().slice(0, 10)
                                   : null,
  };
}

export const viajesRepository = {
  async getAll(filtros?: ViajeFilters): Promise<Viaje[]> {
    const filtrosLog = filtros && Object.keys(filtros).length > 0 ? ` | filtros: ${JSON.stringify(filtros)}` : '';
    console.log(`[viajes] getAll — request recibido${filtrosLog}`);

    const where: string[] = [];
    const values: unknown[] = [];

    if (filtros?.clienteId !== undefined) {
      values.push(filtros.clienteId);
      where.push(`v.cliente_id = $${values.length}`);
    }
    if (filtros?.fleteroId !== undefined) {
      values.push(filtros.fleteroId);
      where.push(`v.fletero_id = $${values.length}`);
    }
    if (filtros?.desde !== undefined) {
      values.push(filtros.desde);
      where.push(`v.fecha >= $${values.length}`);
    }
    if (filtros?.hasta !== undefined) {
      values.push(filtros.hasta);
      where.push(`v.fecha <= $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT ${SELECT_CON_FACTURAS}
      FROM viajes v
      LEFT JOIN facturas fc ON fc.viaje_id = v.id AND fc.tipo = 'cobranza'
      LEFT JOIN facturas fp ON fp.viaje_id = v.id AND fp.tipo = 'pago_fletero'
      ${whereClause}
      ORDER BY v.fecha DESC
    `, values);

    console.log(`[viajes] getAll — completado | registros: ${result.rows.length}`);
    return result.rows.map(mapRow);
  },

  async getById(id: number): Promise<Viaje | null> {
    console.log(`[viajes] getById — request recibido | id: ${id}`);
    const result = await pool.query(`
      SELECT ${SELECT_CON_FACTURAS}
      FROM viajes v
      LEFT JOIN facturas fc ON fc.viaje_id = v.id AND fc.tipo = 'cobranza'
      LEFT JOIN facturas fp ON fp.viaje_id = v.id AND fp.tipo = 'pago_fletero'
      WHERE v.id = $1
    `, [id]);
    console.log(`[viajes] getById — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async crear(datos: CreateViajeDTO, client?: PoolClient): Promise<Viaje> {
    console.log(`[viajes] crear — request recibido | cliente_id: ${datos.clienteId}, fletero_id: ${datos.fleteroId}`);
    const executor = client ?? pool;
    const result = await executor.query(
      `INSERT INTO viajes (fecha, cliente_id, valor_cliente, fletero_id, costo_fletero, numero_remito, destinatario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${SELECT}`,
      [datos.fecha, datos.clienteId, datos.valorCliente, datos.fleteroId, datos.costoFletero, datos.numeroRemito ?? null, datos.destinatario ?? null]
    );
    console.log(`[viajes] crear — completado | id: ${result.rows[0].id}`);
    return mapRow(result.rows[0]);
  },

  async actualizar(id: number, datos: Partial<CreateViajeDTO>, client?: PoolClient): Promise<Viaje | null> {
    console.log(`[viajes] actualizar — request recibido | id: ${id}`);
    const executor = client ?? pool;
    const result = await executor.query(
      `UPDATE viajes SET
        fecha          = COALESCE($1, fecha),
        cliente_id     = COALESCE($2, cliente_id),
        valor_cliente  = COALESCE($3, valor_cliente),
        fletero_id     = COALESCE($4, fletero_id),
        costo_fletero  = COALESCE($5, costo_fletero),
        numero_remito  = COALESCE($6, numero_remito),
        destinatario   = COALESCE($7, destinatario)
      WHERE id = $8
      RETURNING ${SELECT}`,
      [datos.fecha, datos.clienteId, datos.valorCliente, datos.fleteroId, datos.costoFletero, datos.numeroRemito, datos.destinatario, id]
    );
    console.log(`[viajes] actualizar — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async eliminar(id: number, client?: PoolClient): Promise<Viaje | null> {
    console.log(`[viajes] eliminar — request recibido | id: ${id}`);
    const executor = client ?? pool;
    const result = await executor.query(
      `DELETE FROM viajes WHERE id = $1 RETURNING ${SELECT}`,
      [id]
    );
    console.log(`[viajes] eliminar — completado | encontrado: ${result.rows.length > 0}`);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  /**
   * Devuelve el titular (cliente_id y fletero_id) de cada viaje pedido.
   * Pensado para validaciones de coherencia — no usa mapRow porque no
   * necesitamos el viaje completo, solo saber a quién pertenece.
   *
   * Los viajes que no existan simplemente no aparecen en el resultado.
   */
  async getClienteFleteroPorIds(
    ids: number[]
  ): Promise<{ id: number; clienteId: number; fleteroId: number }[]> {
    console.log(`[viajes] getClienteFleteroPorIds — request recibido | ids: ${ids.length}`);

    if (ids.length === 0) {
      console.log(`[viajes] getClienteFleteroPorIds — sin ids, skip`);
      return [];
    }

    const result = await pool.query(
      `SELECT id, cliente_id, fletero_id FROM viajes WHERE id = ANY($1)`,
      [ids]
    );

    console.log(`[viajes] getClienteFleteroPorIds — completado | encontrados: ${result.rows.length}`);
    return result.rows.map((row) => ({
      id: Number(row.id),
      clienteId: Number(row.cliente_id),
      fleteroId: Number(row.fletero_id),
    }));
  },
};

