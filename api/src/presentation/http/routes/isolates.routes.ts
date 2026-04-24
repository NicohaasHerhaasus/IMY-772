import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { IsolateService } from '../../../application/services/isolate.service';
import { IsolatesController } from '../controllers/isolates.controller';

const router = Router();

const pool = getPool();
const isolateService = new IsolateService(pool);
const isolatesController = new IsolatesController(isolateService);

router.get('/', isolatesController.listAll);
router.get('/export', isolatesController.exportAll);

export default router;

