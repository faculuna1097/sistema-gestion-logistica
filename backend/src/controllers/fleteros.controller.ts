// src/controllers/fleteros.controller.ts

import { Request, Response } from 'express';
import * as fleterosService from '../services/fleteros.service';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const fleteros = await fleterosService.getAll();
    res.json(fleteros);
  } catch (err: any) {
    console.error('[fleteros] Error en getAll:', err.message);
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
  } catch (err: any) {
    console.error('[fleteros] Error en getById:', err.message);
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

    const fletero = await fleterosService.create({ nombre });
    res.status(201).json(fletero);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un fletero con ese nombre' });
      return;
    }
    console.error('[fleteros] Error en create:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { nombre } = req.body;

    const fletero = await fleterosService.update(id, { nombre });

    if (!fletero) {
      res.status(404).json({ error: 'Fletero no encontrado' });
      return;
    }

    res.json(fletero);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Ya existe un fletero con ese nombre' });
      return;
    }
    console.error('[fleteros] Error en update:', err.message);
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
  } catch (err: any) {
    console.error('[fleteros] Error en remove:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}