import { Router } from 'express';
import * as vencimientosController from '../controllers/vencimientos.controller';

const router = Router();

router.get('/', vencimientosController.getVencimientos);

export default router;