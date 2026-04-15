// src/controllers/clientes.controller.ts

import { Request, Response } from 'express';
import * as clientesService from '../services/clientes.service';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const clientes = await clientesService.getAll();
    res.json(clientes);
  } catch (err: any) {
    console.error('[clientes] Error en getAll:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const cliente = await clientesService.getById(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: any) {
    console.error('[clientes] Error en getById:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      res.status(400).json({ error: 'El campo nombre es requerido' });
      return;
    }

    const cliente = await clientesService.create({ nombre });
    res.status(201).json(cliente);
  } catch (err: any) {
    console.error('[clientes] Error en create:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { nombre } = req.body;

    const cliente = await clientesService.update(id, { nombre });

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: any) {
    console.error('[clientes] Error en update:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const cliente = await clientesService.remove(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(cliente);
  } catch (err: any) {
    console.error('[clientes] Error en remove:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}