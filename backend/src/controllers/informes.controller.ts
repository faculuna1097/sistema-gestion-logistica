// backend/src/controllers/informes.controller.ts

import { Request, Response } from 'express';
import * as informesService from '../services/informes.service';
import { InformeFilters, TipoInforme } from '../types';
import { isPgError, parseIdOr400 } from '../utils/errors';

// ============================================================
// Helpers
// ============================================================

/**
 * Mapea errores del service a status HTTP.
 * Patrón temporal basado en prefijos del mensaje, hasta migrar a clases de error custom.
 * Devuelve null si no hay match (el caller debe tratarlo como 500).
 *
 * Local a este controller: cada recurso tiene su propio set de prefijos y
 * unificarlo acoplaría los services entre sí.
 */
function statusDeErrorService(err: unknown): { status: number; message: string } | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;

  if (msg.startsWith('DTO inválido'))       return { status: 400, message: msg };
  if (msg.startsWith('No se puede crear'))  return { status: 400, message: msg };
  if (msg.startsWith('Conflicto'))          return { status: 409, message: msg };
  if (msg.startsWith('Inconsistencia'))     return { status: 500, message: msg };

  return null;
}

/**
 * Parsea y valida los query params para filtrar informes.
 * Si alguno es inválido, responde 400 y devuelve null.
 * Si no hay ningún filtro, devuelve un objeto vacío (listar todo).
 *
 * Query params aceptados (todos opcionales):
 *   tipo        — "cliente" | "fletero"
 *   cliente_id  — entero positivo
 *   fletero_id  — entero positivo
 *   anio        — entero positivo (ej: 2026)
 */
function parseFiltrosOr400(req: Request, res: Response): InformeFilters | null {
  const filtros: InformeFilters = {};
  const { tipo, cliente_id, fletero_id, anio } = req.query;

  if (tipo !== undefined) {
    if (tipo !== 'cliente' && tipo !== 'fletero') {
      res.status(400).json({ error: "El parámetro 'tipo' debe ser 'cliente' o 'fletero'" });
      return null;
    }
    filtros.tipo = tipo as TipoInforme;
  }

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

  if (anio !== undefined) {
    const n = parseInt(anio as string, 10);
    if (Number.isNaN(n) || n < 1) {
      res.status(400).json({ error: "El parámetro 'anio' debe ser un número entero positivo" });
      return null;
    }
    filtros.anio = n;
  }

  return filtros;
}

// ============================================================
// Handlers
// ============================================================

export const informesController = {
  async getAll(req: Request, res: Response) {
    try {
      const filtros = parseFiltrosOr400(req, res);
      if (filtros === null) return;

      const informes = await informesService.getAll(filtros);
      res.json(informes);
    } catch (err: unknown) {
      console.error('[informes] Error en getAll:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al obtener informes' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseIdOr400(req, res);
      if (id === null) return;

      const informe = await informesService.getById(id);
      if (!informe) {
        res.status(404).json({ error: 'Informe no encontrado' });
        return;
      }
      res.json(informe);
    } catch (err: unknown) {
      console.error('[informes] Error en getById:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al obtener informe' });
    }
  },

  async crear(req: Request, res: Response) {
    try {
      const informe = await informesService.crear(req.body);
      res.status(201).json(informe);
    } catch (err: unknown) {
      // Errores de Postgres
      if (isPgError(err)) {
        if (err.code === '23503') {
          res.status(400).json({ error: 'Cliente, fletero o viaje no encontrado' });
          return;
        }
        if (err.code === '23505') {
          res.status(409).json({ error: 'Conflicto al generar código, reintentá' });
          return;
        }
      }

      // Errores lanzados por el service (mapeo por prefijo)
      const errorMapeado = statusDeErrorService(err);
      if (errorMapeado) {
        if (errorMapeado.status >= 500) {
          console.error('[informes] Error en crear:', errorMapeado.message);
        }
        res.status(errorMapeado.status).json({ error: errorMapeado.message });
        return;
      }

      console.error('[informes] Error en crear:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al crear informe' });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseIdOr400(req, res);
      if (id === null) return;

      const informe = await informesService.eliminar(id);
      if (!informe) {
        res.status(404).json({ error: 'Informe no encontrado' });
        return;
      }
      res.status(204).send();
    } catch (err: unknown) {
      console.error('[informes] Error en eliminar:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Error al eliminar informe' });
    }
  },
};