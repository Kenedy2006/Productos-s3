import { backupToBucket } from '../controllers/products.controller.js';
import { Router } from 'express';
import multer from 'multer';
import { listView, listJson, newForm, editForm, create, update, remove } from '../controllers/products.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', listView);
router.get('/nuevo', newForm);
router.get('/editar/:id', editForm);

router.get('/api/productos', listJson);
router.post('/productos', upload.single('imagen'), create);
router.post('/productos/:id', upload.single('imagen'), update);
router.post('/productos/:id/delete', remove);

router.post('/admin/backup', backupToBucket);

export default router;
