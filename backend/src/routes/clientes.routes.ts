// src/routes/clientes.routes.ts

import { Router } from 'express';
import * as clientesController from '../controllers/clientes.controller';

const router = Router();

router.get('/', clientesController.getAll);
router.get('/:id', clientesController.getById);
router.post('/', clientesController.create);
router.put('/:id', clientesController.update);
router.delete('/:id', clientesController.remove);

export default router;