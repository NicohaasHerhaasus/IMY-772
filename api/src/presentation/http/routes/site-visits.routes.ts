import { Router } from 'express';
import { SiteVisitsController } from '../controllers/site-visits.controller';
import { getPool } from '../../../infrastructure/database/pool';

const router = Router();

const pool = getPool();
const controller = new SiteVisitsController(pool);

router.get('/', controller.listVisits);

export default router;
