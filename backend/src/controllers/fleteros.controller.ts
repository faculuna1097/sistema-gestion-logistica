// src/controllers/fleteros.controller.ts

import { Request, Response } from 'express';
import * as fleterosService from '../services/fleteros.service';

function isPgError(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err;
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const fleteros = await fleterosService.getAll();
    res.json(fleteros);
  } catch (err: unknown) {
    console.error('[fleteros] Error en getAll:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const fletero = await fleterosService.getById(id);

    if (!fletero) {
      res.status(404).json({ error: 'Fletero no encontrado' });
      return;
    }

    res.json(fletero);
  } catch (err: unknown) {
    console.error('[fleteros] Error en getById:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, email, telefono, cbu, cuit } = req.body;

    if (!nombre) {
      res.status(400).json({ error: 'El campo nombre es requerido' });
      return;
    }

    const fletero = await fleterosService.create({ nombre, email, telefono, cbu, cuit });
    res.status(201).json(fletero);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un fletero con ese nombre' });
      return;
    }
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'Referencia inválida' });
      return;
    }
    console.error('[fleteros] Error en create:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { nombre, email, telefono, cbu, cuit } = req.body;

    const fletero = await fleterosService.update(id, { nombre, email, telefono, cbu, cuit });

    if (!fletero) {
      res.status(404).json({ error: 'Fletero no encontrado' });
      return;
    }

    res.json(fletero);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un fletero con ese nombre' });
      return;
    }
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'Referencia inválida' });
      return;
    }
    console.error('[fleteros] Error en update:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const fletero = await fleterosService.remove(id);

    if (!fletero) {
      res.status(404).json({ error: 'Fletero no encontrado' });
      return;
    }

    res.json(fletero);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'No se puede eliminar: el fletero tiene viajes asociados' });
      return;
    }
    console.error('[fleteros] Error en remove:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}