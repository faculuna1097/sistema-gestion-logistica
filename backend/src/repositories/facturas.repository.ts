import { pool } from '../config/db';
import { Factura, CreateFacturaDTO } from '../types';

const TZ = 'America/Argentina/Buenos_Aires';

// ─── Filtros para getAll ──────────────────────────────────────────────────────

interface FiltrosFactura {
  tipo?: string;
  estado?: string;
  cliente_id?: number;
  fletero_id?: number;
  viaje_id?: number;
}

// ─── Funciones ────────────────────────────────────────────────────────────────

export async function getAll(filtros: FiltrosFactura): Promise<Factura[]> {
  console.log('[facturas] getAll — request recibido | filtros:', filtros);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  let idx = 1;

  if (filtros.tipo) {
    condiciones.push(`tipo = $${idx++}`);
    valores.push(filtros.tipo);
  }
  if (filtros.estado) {
    condiciones.push(`estado = $${idx++}`);
    valores.push(filtros.estado);
  }
  if (filtros.cliente_id) {
    condiciones.push(`cliente_id = $${idx++}`);
    valores.push(filtros.cliente_id);
  }
  if (filtros.fletero_id) {
    condiciones.push(`fletero_id = $${idx++}`);
    valores.push(filtros.fletero_id);
  }
  if (filtros.viaje_id) {
    condiciones.push(`viaje_id = $${idx++}`);
    valores.push(filtros.viaje_id);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const query = `
    SELECT id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
           numero, fecha_emision, vencimiento, estado
    FROM facturas
    ${where}
    ORDER BY id DESC
  `;

  const result = await pool.query(query, valores);

  const facturas = result.rows.map(row => ({
    ...row,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento).toISOString().slice(0, 10)
      : null,
    fecha_emision: undefined,
  }));

  console.log(`[facturas] getAll — completado | resultados: ${result.rows.length}`);
  return facturas;
}

export async function getById(id: number): Promise<Factura | null> {
  console.log(`[facturas] getById — request recibido | id: ${id}`);

  const result = await pool.query(
    `SELECT id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
            numero, fecha_emision, vencimiento, estado
     FROM facturas
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    console.log(`[facturas] getById — no encontrado | id: ${id}`);
    return null;
  }

  const row = result.rows[0];
  const factura = {
    ...row,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento).toISOString().slice(0, 10)
      : null,
    fecha_emision: undefined,
  };

  console.log(`[facturas] getById — completado | id: ${id}`);
  return factura;
}

export async function crear(datos: CreateFacturaDTO): Promise<Factura> {
  console.log('[facturas] crear — request recibido | tipo:', datos.tipo);

  const result = await pool.query(
    `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, descripcion, numero, fecha_emision, vencimiento, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'sin_facturar')
     RETURNING id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
               numero, fecha_emision, vencimiento, estado`,
    [
      datos.tipo,
      datos.clienteId ?? null,
      datos.fleteroId ?? null,
      datos.viajeId ?? null,
      datos.monto,
      datos.descripcion ?? null,
      datos.numero ?? null,
      datos.fechaEmision ?? null,
      datos.vencimiento ?? null,
    ]
  );

  const row = result.rows[0];
  console.log(`[facturas] crear — completado | id: ${row.id}`);
  return {
    ...row,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento).toISOString().slice(0, 10)
      : null,
    fecha_emision: undefined,
  };
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
     RETURNING id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
               numero, fecha_emision, vencimiento, estado`,
    [
      datos.monto ?? null,
      datos.descripcion ?? null,
      datos.numero ?? null,
      datos.vencimiento ?? null,
      id,
    ]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  console.log(`[facturas] actualizar — completado | id: ${id}`);
  return {
    ...row,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento).toISOString().slice(0, 10)
      : null,
    fecha_emision: undefined,
  };
}

export async function facturar(
  id: number,
  datos: { numero: string; fechaEmision: string; vencimiento: string }
): Promise<Factura | null> {
  console.log(`[facturas] facturar — request recibido | id: ${id}`);

  const result = await pool.query(
    `UPDATE facturas SET
       estado       = 'facturada',
       numero       = $1,
       fecha_emision = $2,
       vencimiento  = $3
     WHERE id = $4 AND estado = 'sin_facturar'
     RETURNING id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
               numero, fecha_emision, vencimiento, estado`,
    [datos.numero, datos.fechaEmision, datos.vencimiento, id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  console.log(`[facturas] facturar — completado | id: ${id}`);
  return {
    ...row,
    fechaEmision: new Date(row.fecha_emision).toISOString().slice(0, 10),
    vencimiento: new Date(row.vencimiento).toISOString().slice(0, 10),
    fecha_emision: undefined,
  };
}

export async function pagar(id: number): Promise<Factura | null> {
  console.log(`[facturas] pagar — request recibido | id: ${id}`);

  const result = await pool.query(
    `UPDATE facturas SET estado = 'pagada'
     WHERE id = $1 AND estado = 'facturada'
     RETURNING id, tipo, cliente_id, fletero_id, viaje_id, monto, descripcion,
               numero, fecha_emision, vencimiento, estado`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  console.log(`[facturas] pagar — completado | id: ${id}`);
  return {
    ...row,
    fechaEmision: row.fecha_emision
      ? new Date(row.fecha_emision).toISOString().slice(0, 10)
      : null,
    vencimiento: row.vencimiento
      ? new Date(row.vencimiento).toISOString().slice(0, 10)
      : null,
    fecha_emision: undefined,
  };
}

export async function eliminar(id: number): Promise<boolean> {
  console.log(`[facturas] eliminar — request recibido | id: ${id}`);

  const result = await pool.query(
    `DELETE FROM facturas WHERE id = $1 RETURNING id`,
    [id]
  );

  console.log(`[facturas] eliminar — completado | id: ${id}`);
  return result.rows.length > 0;
}

export async function eliminarPorViajeId(viajeId: number, client: any): Promise<void> {
  console.log(`[facturas] eliminarPorViajeId — request recibido | viajeId: ${viajeId}`);
  await client.query(`DELETE FROM facturas WHERE viaje_id = $1`, [viajeId]);
  console.log(`[facturas] eliminarPorViajeId — completado | viajeId: ${viajeId}`);
}