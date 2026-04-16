// src/controllers/vencimientos.controller.ts

import { Request, Response } from 'express';
import * as vencimientosService from '../services/vencimientos.service';

export async function getVencimientos(req: Request, res: Response): Promise<void> {
  console.log('[vencimientos] getVencimientos — request recibido | mes:', req.query.mes);
  try {
    const mes = req.query.mes as string;

    if (!mes) {
      res.status(400).json({ error: 'El parámetro mes es requerido' });
      return;
    }

    const data = await vencimientosService.getVencimientos(mes);
    res.status(200).json(data);
  } catch (err: unknown) {
    console.error('[vencimientos] Error en getVencimientos:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    res.status(400).json({ error: message });
  }
}