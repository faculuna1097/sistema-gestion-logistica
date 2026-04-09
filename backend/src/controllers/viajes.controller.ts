import { Request, Response } from 'express';
import { viajesService } from '../services/viajes.service';

export const viajesController = {
  async getAll(req: Request, res: Response) {
    try {
      const viajes = await viajesService.getAll();
      res.json(viajes);
    } catch (err: any) {
      console.error('[viajes] Error en getAll:', err.message);
      res.status(500).json({ error: 'Error al obtener viajes' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.getById(id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
      res.json(viaje);
    } catch (err: any) {
      console.error('[viajes] Error en getById:', err.message);
      res.status(500).json({ error: 'Error al obtener viaje' });
    }
  },

  async crear(req: Request, res: Response) {
    try {
      const viaje = await viajesService.crear(req.body);
      res.status(201).json(viaje);
    } catch (err: any) {
      console.error('[viajes] Error en crear:', err.message);
      res.status(500).json({ error: 'Error al crear viaje' });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.actualizar(id, req.body);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
      res.json(viaje);
    } catch (err: any) {
      console.error('[viajes] Error en actualizar:', err.message);
      res.status(500).json({ error: 'Error al actualizar viaje' });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const viaje = await viajesService.eliminar(id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
      res.json(viaje);
    } catch (err: any) {
      console.error('[viajes] Error en eliminar:', err.message);
      res.status(500).json({ error: 'Error al eliminar viaje' });
    }
  },
};