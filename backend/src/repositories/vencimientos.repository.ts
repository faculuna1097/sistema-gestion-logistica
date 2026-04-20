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
}

function mapRow(row: any): VencimientoRow {
  return {
    id: Number(row.id),
    tipo: row.tipo,
    titular: row.titular,
    numero: row.numero ?? null,
    monto: Number(row.monto),
    vencimiento: new Date(row.vencimiento).toISOString().slice(0, 10),
  };
}

// Facturas vencidas (vencimiento anterior a hoy), sin filtro de mes
export async function getVencidas(): Promise<VencimientoRow[]> {
  console.log('[vencimientos] getVencidas — request recibido');
  const result = await pool.query(`
    SELECT
      MIN(f.id) AS id,
      f.tipo,
      COALESCE(c.nombre, fl.nombre) AS titular,
      f.numero,
      SUM(f.monto) AS monto,
      f.vencimiento
    FROM facturas f
    LEFT JOIN clientes c  ON f.cliente_id = c.id
    LEFT JOIN fleteros fl ON f.fletero_id = fl.id
    WHERE f.estado = 'facturada'
      AND f.tipo IN ('cobranza', 'pago_fletero')
      AND f.vencimiento < (NOW() AT TIME ZONE '${TZ}')::date
    GROUP BY f.numero, f.tipo, f.vencimiento, c.nombre, fl.nombre
    ORDER BY f.vencimiento ASC
  `);
  console.log('[vencimientos] getVencidas — completado | filas:', result.rows.length);
  return result.rows.map(mapRow);
}

// Facturas con vencimiento dentro del mes pedido (formato YYYY-MM)
export async function getDelMes(mes: string): Promise<VencimientoRow[]> {
  console.log('[vencimientos] getDelMes — request recibido | mes:', mes);
  const result = await pool.query(`
    SELECT
      MIN(f.id) AS id,
      f.tipo,
      COALESCE(c.nombre, fl.nombre) AS titular,
      f.numero,
      SUM(f.monto) AS monto,
      f.vencimiento
    FROM facturas f
    LEFT JOIN clientes c  ON f.cliente_id = c.id
    LEFT JOIN fleteros fl ON f.fletero_id = fl.id
    WHERE f.estado = 'facturada'
      AND f.tipo IN ('cobranza', 'pago_fletero')
      AND DATE_TRUNC('month', f.vencimiento) = $1::date
      AND f.vencimiento >= (NOW() AT TIME ZONE '${TZ}')::date
    GROUP BY f.numero, f.tipo, f.vencimiento, c.nombre, fl.nombre
    ORDER BY f.vencimiento ASC
  `, [`${mes}-01`]);
  console.log('[vencimientos] getDelMes — completado | filas:', result.rows.length);
  return result.rows.map(mapRow);
}