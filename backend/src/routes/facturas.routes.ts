import { Router } from 'express';
import * as facturasController from '../controllers/facturas.controller';

const router = Router();

router.get('/', facturasController.getAll);
router.get('/:id', facturasController.getById);
router.post('/', facturasController.crear);
router.put('/:id', facturasController.actualizar);
router.patch('/facturar-lote', facturasController.facturarLote);  // <-- antes de /:id/facturar
router.patch('/:id/facturar', facturasController.facturar);
router.patch('/:id/pagar', facturasController.pagar);
router.delete('/:id', facturasController.eliminar);
router.patch('/:id/revertir', facturasController.revertir);

export default router;