// backend/src/routes/informes.routes.ts

import { Router } from 'express';
import { informesController } from '../controllers/informes.controller';

const router = Router();

router.get('/', informesController.getAll);
router.get('/:id', informesController.getById);
router.post('/', informesController.crear);
router.delete('/:id', informesController.eliminar);

export default router;