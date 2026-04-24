import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { PostgresDatasetsRepository } from '../../../infrastructure/persistence/postgres-datasets.repository';
import { DatasetsService } from '../../../application/services/datasets.service';
import { DatasetsController } from '../controllers/datasets.controller';

const router = Router();

const pool = getPool();
const datasetsRepository = new PostgresDatasetsRepository(pool);
const datasetsService = new DatasetsService(datasetsRepository);
const datasetsController = new DatasetsController(datasetsService);

// GET /api/datasets - Get all uploaded datasets
router.get('/', datasetsController.getAllDatasets);

// GET /api/datasets/:id - Get a specific dataset by ID
router.get('/:id', datasetsController.getDatasetById);

// GET /api/datasets/:id/rows - Get all rows for a specific dataset
router.get('/:id/rows', datasetsController.getDatasetRows);

export default router;
