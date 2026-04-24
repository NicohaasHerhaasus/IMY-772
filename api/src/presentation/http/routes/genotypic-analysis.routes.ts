import { Router } from 'express';
import multer from 'multer';
import { getPool } from '../../../infrastructure/database/pool';
import { GenotypicAnalysisService } from '../../../application/services/genotypic-analysis.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { GenotypicAnalysisController } from '../controllers/genotypic-analysis.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { ValidationError } from '../../../application/errors/app.errors';

const router = Router();

const uploadXlsx = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const byName = file.originalname.toLowerCase().endsWith('.xlsx');
    const byMime =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!byName && !byMime) {
      cb(new ValidationError(['Only .xlsx files are supported for genotypic Excel upload.']));
      return;
    }
    cb(null, true);
  },
});

const pool = getPool();
const genotypicAnalysisService = new GenotypicAnalysisService(pool);
const uploadedDatafileService = new UploadedDatafileService(pool);
const genotypicAnalysisController = new GenotypicAnalysisController(
  genotypicAnalysisService,
  uploadedDatafileService,
);

router.post('/upload-tsv', authMiddleware, genotypicAnalysisController.uploadTsvRows);
router.post(
  '/upload-xlsx',
  authMiddleware,
  uploadXlsx.single('file'),
  genotypicAnalysisController.uploadGenotypicXlsx,
);

export default router;
