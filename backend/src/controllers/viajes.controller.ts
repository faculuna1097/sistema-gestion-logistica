// backend/src/controllers/viajes.controller.ts

import { Request, Response } from 'express';
import { viajesService } from '../services/viajes.service';

function isPgError(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err;
}

/**
 * Helper para mapear errores del service a status HTTP.
 * Patrón temporal basado en prefijos del mensaje, hasta migrar a clases de error custom.
 * Devuelve null si no hay match (el caller debe tratarlo como 500).
 */
function statusDeErrorService(err: unknown): { status: number; message: string } | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;

  if (msg.startsWith('No se puede modificar')) return { status: 400, message: msg };
  if (msg.startsWith('La factura'))             return { status: 409, message: msg };
  if (msg.startsWith('Inconsistencia'))         return { status: 500, message: msg };

  return null;
}

/**
 * Parsea y valida el id de la URL. Si es inválido, responde 400 y devuelve null.
 */
function parseIdOr400(req: Request, res: Response): number | null {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }
  return id;
}

export const viajesController = {
  async getAll(req: Request, res: Response) {
    try {
      const viajes = await viajesService.getAll();
      res.json(viajes);
    } catch (err: unknown) {
      console.error('[viajes] Error en getAll:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al obtener viajes' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseIdOr400(req, res);
      if (id === null) return;

      const viaje = await viajesService.getById(id);
      if (!viaje) {
        res.status(404).json({ error: 'Viaje no encontrado' });
        return;
      }
      res.json(viaje);
    } catch (err: unknown) {
      console.error('[viajes] Error en getById:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al obtener viaje' });
    }
  },

  async crear(req: Request, res: Response) {
    try {
      const viaje = await viajesService.crear(req.body);
      res.status(201).json(viaje);
    } catch (err: unknown) {
      if (isPgError(err) && err.code === '23503') {
        res.status(400).json({ error: 'Cliente o fletero no encontrado' });
        return;
      }
      console.error('[viajes] Error en crear:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al crear viaje' });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseIdOr400(req, res);
      if (id === null) return;

      const viaje = await viajesService.actualizar(id, req.body);
      if (!viaje) {
        res.status(404).json({ error: 'Viaje no encontrado' });
        return;
      }
      res.json(viaje);
    } catch (err: unknown) {
      if (isPgError(err) && err.code === '23503') {
        res.status(400).json({ error: 'Cliente o fletero no encontrado' });
        return;
      }

      const errorMapeado = statusDeErrorService(err);
      if (errorMapeado) {
        if (errorMapeado.status >= 500) {
          console.error('[viajes] Error en actualizar:', errorMapeado.message);
        }
        res.status(errorMapeado.status).json({ error: errorMapeado.message });
        return;
      }

      console.error('[viajes] Error en actualizar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al actualizar viaje' });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseIdOr400(req, res);
      if (id === null) return;

      const viaje = await viajesService.eliminar(id);
      if (!viaje) {
        res.status(404).json({ error: 'Viaje no encontrado' });
        return;
      }
      res.json(viaje);
    } catch (err: unknown) {
      console.error('[viajes] Error en eliminar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al eliminar viaje' });
    }
  },
};