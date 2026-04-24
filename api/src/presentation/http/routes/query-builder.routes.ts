import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { QueryBuilderService } from '../../../application/services/query-builder.service';
import { QueryBuilderController } from '../controllers/query-builder.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const pool = getPool();
const queryBuilderService = new QueryBuilderService(pool);
const queryBuilderController = new QueryBuilderController(queryBuilderService);

// Populate all dropdowns in one call
router.get('/options', authMiddleware, queryBuilderController.getDropdownOptions);

// Run a query, return rows + summary stats
router.post('/query', authMiddleware, queryBuilderController.runQuery);

// Export the same query as CSV or XLSX
router.post('/export/csv', authMiddleware, queryBuilderController.exportCsv);
router.post('/export/xlsx', authMiddleware, queryBuilderController.exportXlsx);

export default router;