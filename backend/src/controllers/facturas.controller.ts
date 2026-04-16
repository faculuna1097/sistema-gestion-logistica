// src/controllers/facturas.controller.ts

import { Request, Response } from 'express';
import * as facturasService from '../services/facturas.service';

function isPgError(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err;
}

export async function getAll(req: Request, res: Response) {
  try {
    const { tipo, estado, cliente_id, fletero_id, viaje_id } = req.query;
    const facturas = await facturasService.getAll({
      tipo: tipo as string | undefined,
      estado: estado as string | undefined,
      clienteId: cliente_id ? Number(cliente_id) : undefined,
      fleteroId: fletero_id ? Number(fletero_id) : undefined,
      viajeId: viaje_id ? Number(viaje_id) : undefined,
    });
    res.json(facturas);
  } catch (err: unknown) {
    console.error('[facturas] Error en getAll:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const factura = await facturasService.getById(Number(req.params.id));
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
    const factura = await facturasService.actualizar(Number(req.params.id), req.body);
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
    const factura = await facturasService.facturar(Number(req.params.id), req.body);
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
    const factura = await facturasService.pagar(Number(req.params.id));
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
    await facturasService.eliminar(Number(req.params.id));
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
    const factura = await facturasService.revertir(Number(req.params.id));
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
    const { ids, numero, fechaEmision, vencimiento } = req.body;
    console.log('[facturas] facturarLote — request recibido | ids:', ids.length);
    const facturas = await facturasService.facturarLote(ids, { numero, fechaEmision, vencimiento });
    console.log('[facturas] facturarLote — completado | actualizadas:', facturas.length);
    res.json(facturas);
  } catch (err: unknown) {
    console.error('[facturas] Error en facturarLote:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    const status = message.includes('ya existe') || message.includes('Solo se actualizaron') ? 400 : 500;
    res.status(status).json({ error: message });
  }
}