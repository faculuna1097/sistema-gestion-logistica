// src/controllers/facturas.controller.ts

import { Request, Response } from 'express';
import * as facturasService from '../services/facturas.service';

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
  } catch (err: any) {
    console.error('[facturas] Error en getAll:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const factura = await facturasService.getById(Number(req.params.id));
    res.json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en getById:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const factura = await facturasService.crear(req.body);
    res.status(201).json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en crear:', err.message);
    const status = err.message.includes('Solo se pueden') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const factura = await facturasService.actualizar(Number(req.params.id), req.body);
    res.json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en actualizar:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function facturar(req: Request, res: Response) {
  try {
    const factura = await facturasService.facturar(Number(req.params.id), req.body);
    res.json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en facturar:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function pagar(req: Request, res: Response) {
  try {
    const factura = await facturasService.pagar(Number(req.params.id));
    res.json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en pagar:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    await facturasService.eliminar(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    console.error('[facturas] Error en eliminar:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function revertir(req: Request, res: Response) {
  try {
    const factura = await facturasService.revertir(Number(req.params.id));
    res.json(factura);
  } catch (err: any) {
    console.error('[facturas] Error en revertir:', err.message);
    const status = err.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function facturarLote(req: Request, res: Response) {
  try {
    const { ids, numero, fechaEmision, vencimiento } = req.body;
    console.log('[facturas] facturarLote — request recibido | ids:', ids.length);
    const facturas = await facturasService.facturarLote(ids, { numero, fechaEmision, vencimiento });
    console.log('[facturas] facturarLote — completado | actualizadas:', facturas.length);
    res.json(facturas);
  } catch (err: any) {
    console.error('[facturas] Error en facturarLote:', err.message);
    const status = err.message.includes('ya existe') || err.message.includes('Solo se actualizaron') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
}