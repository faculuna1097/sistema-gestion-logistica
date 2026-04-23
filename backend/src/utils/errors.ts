// backend/src/utils/errors.ts

import { Request, Response } from 'express';

/**
 * Type guard para errores de PostgreSQL.
 * El driver `pg` agrega `.code` al objeto Error cuando la DB responde con
 * un SQLSTATE (ej: '23505' unique_violation, '23503' foreign_key_violation).
 */
export function isPgError(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err;
}

/**
 * Parsea y valida el id de la URL (`req.params.id`).
 * Si es inválido, responde 400 "ID inválido" y devuelve null — el caller
 * debe hacer `if (id === null) return;` para cortar el handler.
 */
export function parseIdOr400(req: Request, res: Response): number | null {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }
  return id;
}