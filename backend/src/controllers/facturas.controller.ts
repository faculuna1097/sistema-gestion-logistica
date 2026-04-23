// backend/src/controllers/facturas.controller.ts

import { Request, Response } from 'express';
import * as facturasService from '../services/facturas.service';
import { isPgError, parseIdOr400 } from '../utils/errors';

function validarFacturarLoteBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'body debe ser un objeto';
  }

  const b = body as Record<string, unknown>;

  // Campos requeridos del payload viejo.
  if (!Array.isArray(b.ids) || b.ids.length === 0) {
    return 'ids debe ser un array no vacío de números';
  }
  if (!b.ids.every((x) => typeof x === 'number' && Number.isInteger(x) && x > 0)) {
    return 'ids debe contener solo enteros positivos';
  }
  if (typeof b.numero !== 'string' || b.numero.trim() === '') {
    return 'numero debe ser un string no vacío';
  }
  if (typeof b.fechaEmision !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.fechaEmision)) {
    return 'fechaEmision debe tener formato YYYY-MM-DD';
  }
  if (typeof b.vencimiento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.vencimiento)) {
    return 'vencimiento debe tener formato YYYY-MM-DD';
  }

  // Campos nuevos opcionales.
  if (b.incluyeIva !== undefined && typeof b.incluyeIva !== 'boolean') {
    return 'incluyeIva debe ser boolean';
  }

  if (b.ajustesMonto !== undefined) {
    if (!Array.isArray(b.ajustesMonto)) {
      return 'ajustesMonto debe ser un array';
    }
    for (const ajuste of b.ajustesMonto) {
      if (typeof ajuste !== 'object' || ajuste === null) {
        return 'cada ajuste en ajustesMonto debe ser un objeto';
      }
      const a = ajuste as Record<string, unknown>;
      if (typeof a.id !== 'number' || !Number.isInteger(a.id) || a.id <= 0) {
        return 'cada ajuste debe tener id como entero positivo';
      }
      if (typeof a.monto !== 'number' || !Number.isFinite(a.monto)) {
        return 'cada ajuste debe tener monto como número finito';
      }
    }
  }

  return null;
}

export async function getAll(req: Request, res: Response) {
  try {
    const { tipo, estado, cliente_id, fletero_id, viaje_id } = req.query;
    const facturas = await facturasService.getAll({
      tipo: tipo as string | undefined,
      estado: estado as string | undefined,
      clienteId: cliente_id !== undefined ? Number(cliente_id) : undefined,
      fleteroId: fletero_id !== undefined ? Number(fletero_id) : undefined,
      viajeId:   viaje_id   !== undefined ? Number(viaje_id)   : undefined,
    });
    res.json(facturas);
  } catch (err: unknown) {
    console.error('[facturas] Error en getAll:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const factura = await facturasService.getById(id);
    res.json(factura);
  } catch (err: unknown) {
    console.error('[facturas] Error en getById:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const factura = await facturasService.crear(req.body);
    res.status(201).json(factura);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'Cliente o fletero no encontrado' });
      return;
    }
    console.error('[facturas] Error en crear:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('Solo se pueden') ? 400 : 500;
    res.status(status).json({ error: message });
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const factura = await facturasService.actualizar(id, req.body);
    res.json(factura);
  } catch (err: unknown) {
    console.error('[facturas] Error en actualizar:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function facturar(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const factura = await facturasService.facturar(id, req.body);
    res.json(factura);
  } catch (err: unknown) {
    console.error('[facturas] Error en facturar:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function pagar(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const factura = await facturasService.pagar(id);
    res.json(factura);
  } catch (err: unknown) {
    console.error('[facturas] Error en pagar:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    await facturasService.eliminar(id);
    res.status(204).send();
  } catch (err: unknown) {
    console.error('[facturas] Error en eliminar:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function revertir(req: Request, res: Response) {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const factura = await facturasService.revertir(id);
    res.json(factura);
  } catch (err: unknown) {
    console.error('[facturas] Error en revertir:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function facturarLote(req: Request, res: Response) {
  try {
    // --- Validación estructural del body ---
    const errorValidacion = validarFacturarLoteBody(req.body);
    if (errorValidacion) {
      res.status(400).json({ error: `DTO inválido: ${errorValidacion}` });
      return;
    }

    const { ids, numero, fechaEmision, vencimiento, ajustesMonto, incluyeIva } = req.body;

    console.log('[facturas] facturarLote — request recibido | ids:', ids.length);
    const facturas = await facturasService.facturarLote(ids, {
      numero,
      fechaEmision,
      vencimiento,
      ajustesMonto,
      incluyeIva,
    });
    console.log('[facturas] facturarLote — completado | actualizadas:', facturas.length);
    res.json(facturas);
  } catch (err: unknown) {
    console.error('[facturas] Error en facturarLote:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    let status = 500;
    if (message.includes('ya existe')) status = 400;
    else if (message.startsWith('DTO inválido')) status = 400;
    else if (message.startsWith('No se pudo facturar el lote')) status = 409;
    res.status(status).json({ error: message });
  }
}