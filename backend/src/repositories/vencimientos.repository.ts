// src/repositories/vencimientos.repository.ts

import { pool } from '../config/db';

const TZ = 'America/Argentina/Buenos_Aires';

export interface VencimientoRow {
  id: number;
  tipo: 'cobranza' | 'pago_fletero';
  titular: string;
  numero: string | null;
  monto: number;
  vencimiento: string;
  fechaViaje: string | null;
}

function mapRow(row: any): VencimientoRow {
  return {
    id: Number(row.id),
    tipo: row.tipo,
    titular: row.titular,
    numero: row.numero ?? null,
    monto: Number(row.monto),
    vencimiento: new Date(row.vencimiento).toISOString().slice(0, 10),
    fechaViaje: row.fecha_viaje
      ? new Date(row.fecha_viaje).toISOString().slice(0, 10)
      : null,
  };
}

// Base compartida para las dos queries
const BASE_SELECT = `
  SELECT
    f.id,
    f.tipo,
    COALESCE(c.nombre, fl.nombre) AS titular,
    f.numero,
    f.monto,
    f.vencimiento,
    v.fecha AS fecha_viaje
  FROM facturas f
  LEFT JOIN clientes c  ON f.cliente_id = c.id
  LEFT JOIN fleteros fl ON f.fletero_id = fl.id
  LEFT JOIN viajes v    ON f.viaje_id   = v.id
  WHERE f.estado = 'facturada'
    AND f.tipo IN ('cobranza', 'pago_fletero')
`;

// Facturas vencidas (vencimiento anterior a hoy), sin filtro de mes
export async function getVencidas(): Promise<VencimientoRow[]> {
  console.log('[vencimientos] getVencidas — request recibido');
  const result = await pool.query(`
    ${BASE_SELECT}
    AND f.vencimiento < (NOW() AT TIME ZONE '${TZ}')::date
    ORDER BY f.vencimiento ASC
  `);
  console.log('[vencimientos] getVencidas — completado | filas:', result.rows.length);
  return result.rows.map(mapRow);
}

// Facturas con vencimiento dentro del mes pedido (formato YYYY-MM)
export async function getDelMes(mes: string): Promise<VencimientoRow[]> {
  console.log('[vencimientos] getDelMes — request recibido | mes:', mes);
  const result = await pool.query(`
    ${BASE_SELECT}
      AND DATE_TRUNC('month', f.vencimiento) = $1::date
      AND f.vencimiento >= (NOW() AT TIME ZONE '${TZ}')::date
      ORDER BY f.vencimiento ASC
  `, [`${mes}-01`]);
  console.log('[vencimientos] getDelMes — completado | filas:', result.rows.length);
  return result.rows.map(mapRow);
}