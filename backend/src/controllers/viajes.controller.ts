// backend/src/controllers/viajes.controller.ts

import { Request, Response } from 'express';
import { viajesService } from '../services/viajes.service';
import { ViajeFilters } from '../types';
import { isPgError, parseIdOr400 } from '../utils/errors';

/**
 * Helper para mapear errores del service a status HTTP.
 * Patrón temporal basado en prefijos del mensaje, hasta migrar a clases de error custom.
 * Devuelve null si no hay match (el caller debe tratarlo como 500).
 *
 * Local a este controller: cada recurso tiene su propio set de prefijos y
 * unificarlo acoplaría los services entre sí.
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
 * Parsea y valida los query params para filtrar viajes.
 * Si alguno es inválido, responde 400 y devuelve null.
 * Si no hay ningún filtro, devuelve un objeto vacío (listar todo).
 *
 * Query params aceptados (todos opcionales):
 *   cliente_id  — entero positivo
 *   fletero_id  — entero positivo
 *   desde       — string YYYY-MM-DD
 *   hasta       — string YYYY-MM-DD (si vienen ambos, desde <= hasta)
 */
function parseFiltrosOr400(req: Request, res: Response): ViajeFilters | null {
  const filtros: ViajeFilters = {};
  const { cliente_id, fletero_id, desde, hasta } = req.query;

  if (cliente_id !== undefined) {
    const n = parseInt(cliente_id as string, 10);
    if (Number.isNaN(n) || n < 1) {
      res.status(400).json({ error: "El parámetro 'cliente_id' debe ser un número entero positivo" });
      return null;
    }
    filtros.clienteId = n;
  }

  if (fletero_id !== undefined) {
    const n = parseInt(fletero_id as string, 10);
    if (Number.isNaN(n) || n < 1) {
      res.status(400).json({ error: "El parámetro 'fletero_id' debe ser un número entero positivo" });
      return null;
    }
    filtros.fleteroId = n;
  }

  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (desde !== undefined) {
    if (typeof desde !== 'string' || !fechaRegex.test(desde)) {
      res.status(400).json({ error: "El parámetro 'desde' debe tener formato YYYY-MM-DD" });
      return null;
    }
    filtros.desde = desde;
  }

  if (hasta !== undefined) {
    if (typeof hasta !== 'string' || !fechaRegex.test(hasta)) {
      res.status(400).json({ error: "El parámetro 'hasta' debe tener formato YYYY-MM-DD" });
      return null;
    }
    filtros.hasta = hasta;
  }

  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    res.status(400).json({ error: "El parámetro 'desde' no puede ser posterior a 'hasta'" });
    return null;
  }

  return filtros;
}

export const viajesController = {
  async getAll(req: Request, res: Response) {
    try {
      const filtros = parseFiltrosOr400(req, res);
      if (filtros === null) return;

      const viajes = await viajesService.getAll(filtros);
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
      res.status(204).send();
    } catch (err: unknown) {
      console.error('[viajes] Error en eliminar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al eliminar viaje' });
    }
  },
};