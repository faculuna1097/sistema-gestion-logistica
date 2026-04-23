// backend/src/controllers/clientes.controller.ts

import { Request, Response } from 'express';
import * as clientesService from '../services/clientes.service';
import { isPgError, parseIdOr400 } from '../utils/errors';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const clientes = await clientesService.getAll();
    res.json(clientes);
  } catch (err: unknown) {
    console.error('[clientes] Error en getAll:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const cliente = await clientesService.getById(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: unknown) {
    console.error('[clientes] Error en getById:', err instanceof Error ? err.message : err);
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

    const cliente = await clientesService.create({ nombre, email, telefono, cbu, cuit });
    res.status(201).json(cliente);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
      return;
    }
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'Referencia inválida' });
      return;
    }
    console.error('[clientes] Error en create:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const { nombre, email, telefono, cbu, cuit } = req.body;

    const cliente = await clientesService.update(id, { nombre, email, telefono, cbu, cuit });

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
      return;
    }
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'Referencia inválida' });
      return;
    }
    console.error('[clientes] Error en update:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = parseIdOr400(req, res);
    if (id === null) return;

    const cliente = await clientesService.remove(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: unknown) {
    if (isPgError(err) && err.code === '23503') {
      res.status(400).json({ error: 'No se puede eliminar: el cliente tiene viajes asociados' });
      return;
    }
    console.error('[clientes] Error en remove:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}