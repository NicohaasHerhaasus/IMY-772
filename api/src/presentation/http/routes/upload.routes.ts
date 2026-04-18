import { Router } from 'express';
import multer from 'multer';
import { getPool } from '../../../infrastructure/database/pool';
import { ValidationError } from '../../../application/errors/app.errors';
import { StarAmrUploadService } from '../../../application/services/staramr-upload.service';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isExcelByMime =
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isExcelByName = file.originalname.toLowerCase().endsWith('.xlsx');

    if (!isExcelByMime && !isExcelByName) {
      cb(new ValidationError(['Only .xlsx files are supported.']));
      return;
    }

    cb(null, true);
  },
});

const pool = getPool();
const starAmrUploadService = new StarAmrUploadService(pool);
const uploadController = new UploadController(starAmrUploadService);

router.post('/staramr', authMiddleware, upload.single('file'), uploadController.uploadStarAmrWorkbook);

export default router;
