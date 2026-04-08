import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { GenotypicAnalysisService } from '../../../application/services/genotypic-analysis.service';
import { GenotypicAnalysisController } from '../controllers/genotypic-analysis.controller';

const router = Router();

const pool = getPool();
const genotypicAnalysisService = new GenotypicAnalysisService(pool);
const genotypicAnalysisController = new GenotypicAnalysisController(genotypicAnalysisService);

router.post('/upload-tsv', genotypicAnalysisController.uploadTsvRows);

export default router;
