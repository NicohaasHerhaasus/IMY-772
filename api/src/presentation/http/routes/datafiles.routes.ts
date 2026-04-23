import { Router } from 'express';
import { getPool } from '../../../infrastructure/database/pool';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { MapAttachmentService } from '../../../application/services/map-attachment.service';
import { DatafilesController } from '../controllers/datafiles.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const pool = getPool();
const uploadedDatafileService = new UploadedDatafileService(pool);
const mapAttachmentService = new MapAttachmentService(pool);
const datafilesController = new DatafilesController(uploadedDatafileService, mapAttachmentService);

router.get('/', authMiddleware, datafilesController.listAll);
router.get('/public', datafilesController.listPublic);
router.get('/:id/public-download', datafilesController.downloadPublic);
router.patch('/:id', authMiddleware, datafilesController.rename);
router.delete('/:id', authMiddleware, datafilesController.delete);

export default router;
