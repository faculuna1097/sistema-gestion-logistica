// backend/src/routes/viajes.routes.ts

import { Router } from 'express';
import { viajesController } from '../controllers/viajes.controller';

const router = Router();

router.get('/', viajesController.getAll);
router.get('/:id', viajesController.getById);
router.post('/', viajesController.crear);
router.put('/:id', viajesController.actualizar);
router.delete('/:id', viajesController.eliminar);

export default router;