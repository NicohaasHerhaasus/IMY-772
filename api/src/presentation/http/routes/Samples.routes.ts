// src/api/http/routes/samples.routes.ts
import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { SamplesController } from '../controllers/Samples.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const pool = getPool();
const samplesController = new SamplesController(pool);

// GET /api/samples          — list all samples (with optional filters)
// GET /api/samples/:id      — single sample by UUID
router.get('/',    authMiddleware, samplesController.listSamples);
router.get('/:id', authMiddleware, samplesController.getSample);

export default router;