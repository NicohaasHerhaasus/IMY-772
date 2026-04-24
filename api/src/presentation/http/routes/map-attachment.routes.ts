import { Router } from 'express';
import multer from 'multer';
import { getPool } from '../../../infrastructure/database/pool';
import { MapAttachmentService } from '../../../application/services/map-attachment.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { MapAttachmentController } from '../controllers/map-attachment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const pool = getPool();
const mapAttachmentService = new MapAttachmentService(pool);
const uploadedDatafileService = new UploadedDatafileService(pool);
const mapAttachmentController = new MapAttachmentController(mapAttachmentService, uploadedDatafileService);

router.get('/markers', authMiddleware, mapAttachmentController.listMarkers);
router.get('/for-location', authMiddleware, mapAttachmentController.listForLocation);
router.post('/', authMiddleware, upload.single('file'), mapAttachmentController.upload);
router.delete('/:id', authMiddleware, mapAttachmentController.deleteAttachment);
router.get('/:id/download', authMiddleware, mapAttachmentController.download);

export default router;
