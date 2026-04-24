import { Router } from 'express';
import multer from 'multer';
import { getPool } from '../../../infrastructure/database/pool';
import { ValidationError } from '../../../application/errors/app.errors';
import { StarAmrUploadService } from '../../../application/services/staramr-upload.service';
import { ExampleAmrFinderPlusUploadService } from '../../../application/services/example-amrfinder-plus-upload.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { DatasetsService } from '../../../application/services/datasets.service';
import { PostgresDatasetsRepository } from '../../../infrastructure/persistence/postgres-datasets.repository';
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

const uploadTsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const byName =
      file.originalname.toLowerCase().endsWith('.tsv') ||
      file.originalname.toLowerCase().endsWith('.txt');
    const byMime =
      file.mimetype === 'text/tab-separated-values' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream';

    if (!byName && !byMime) {
      cb(new ValidationError(['Only .tsv files are supported.']));
      return;
    }
    cb(null, true);
  },
});

const pool = getPool();
const starAmrUploadService = new StarAmrUploadService(pool);
const exampleAmrFinderPlusUploadService = new ExampleAmrFinderPlusUploadService(pool);
const uploadedDatafileService = new UploadedDatafileService(pool);
const uploadController = new UploadController(
  starAmrUploadService,
  exampleAmrFinderPlusUploadService,
  uploadedDatafileService,
const datasetsRepository = new PostgresDatasetsRepository(pool);
const datasetsService = new DatasetsService(datasetsRepository);
const uploadController = new UploadController(
  starAmrUploadService,
  exampleAmrFinderPlusUploadService,
  datasetsService,
);

router.post('/staramr', authMiddleware, upload.single('file'), uploadController.uploadStarAmrWorkbook);
router.post(
  '/example-amrfinder-plus',
  authMiddleware,
  upload.single('file'),
  uploadController.uploadExampleAmrFinderPlusWorkbook,
);
router.post(
  '/example-amrfinder-plus-tsv',
  authMiddleware,
  uploadTsv.single('file'),
  uploadController.uploadExampleAmrFinderPlusTsv,
);

export default router;
