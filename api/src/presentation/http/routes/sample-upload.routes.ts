import { Router } from 'express';
import multer from 'multer';
import { getPool } from '../../../infrastructure/database/pool';
import { ValidationError } from '../../../application/errors/app.errors';
import { SampleUploadService } from '../../../application/services/sample-upload.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { SampleUploadController } from '../controllers/sample-upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isExcelByMime =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isExcelByName = file.originalname.toLowerCase().endsWith('.xlsx');

    if (!isExcelByMime && !isExcelByName) {
      cb(new ValidationError(['Only .xlsx files are supported.']));
      return;
    }

    cb(null, true);
  },
});

const pool = getPool();
const sampleUploadService = new SampleUploadService(pool);
const uploadedDatafileService = new UploadedDatafileService(pool);
const sampleUploadController = new SampleUploadController(sampleUploadService, uploadedDatafileService);

router.post('/validate', authMiddleware, upload.single('file'), sampleUploadController.validateWorkbook);
router.post('/upload', authMiddleware, upload.single('file'), sampleUploadController.ingestWorkbook);

export default router;