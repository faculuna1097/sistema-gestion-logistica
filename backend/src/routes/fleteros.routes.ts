// src/routes/fleteros.routes.ts

import { Router } from 'express';
import * as fleterosController from '../controllers/fleteros.controller';

const router = Router();

router.get('/', fleterosController.getAll);
router.get('/:id', fleterosController.getById);
router.post('/', fleterosController.create);
router.put('/:id', fleterosController.update);
router.delete('/:id', fleterosController.remove);

export default router;