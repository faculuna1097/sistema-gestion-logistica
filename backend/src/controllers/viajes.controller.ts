import { Request, Response } from 'express';
import { viajesService } from '../services/viajes.service';

function isPgError(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err;
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
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.getById(id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
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
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.actualizar(id, req.body);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
      res.json(viaje);
    } catch (err: unknown) {
      if (isPgError(err) && err.code === '23503') {
        res.status(400).json({ error: 'Cliente o fletero no encontrado' });
        return;
      }
      console.error('[viajes] Error en actualizar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al actualizar viaje' });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.eliminar(id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
      res.json(viaje);
    } catch (err: unknown) {
      console.error('[viajes] Error en eliminar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al eliminar viaje' });
    }
  },
};