import { NextFunction, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { MapAttachmentService } from '../../../application/services/map-attachment.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DatafilesController {
  constructor(
    private readonly uploadedDatafileService: UploadedDatafileService,
    private readonly mapAttachmentService: MapAttachmentService,
  ) {}

  listAll = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.uploadedDatafileService.listAll();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error as Error);
    }
  };

  listPublic = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.uploadedDatafileService.listPublic();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error as Error);
    }
  };

  rename = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new ValidationError(['Invalid datafile id.']);
      }
      const displayName = req.body?.displayName;
      if (typeof displayName !== 'string' || !displayName.trim()) {
        throw new ValidationError(['displayName is required.']);
      }
      await this.uploadedDatafileService.rename(id, displayName);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error as Error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new ValidationError(['Invalid datafile id.']);
      }

      const file = await this.uploadedDatafileService.getById(id);
      if (file.sourceType === 'map_pin' && file.sourceRefId) {
        await this.mapAttachmentService.deleteById(file.sourceRefId);
      }

      await this.uploadedDatafileService.deleteById(id);
      res.status(204).send();
    } catch (error) {
      next(error as Error);
    }
  };

  downloadPublic = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new ValidationError(['Invalid datafile id.']);
      }

      const file = await this.uploadedDatafileService.getById(id);
      if (file.sourceType === 'map_pin') {
        if (!file.sourceRefId) throw new ValidationError(['Invalid map attachment reference.']);
        const mapFile = await this.mapAttachmentService.getForDownload(file.sourceRefId);
        const safeName = mapFile.originalFilename.replace(/[^\w.\- ()]+/g, '_').slice(0, 200);
        res.setHeader('Content-Type', mapFile.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Length', String(mapFile.buffer.length));
        res.status(200).send(mapFile.buffer);
        return;
      }

      const structured = await this.uploadedDatafileService.getStructuredDownloadById(id);
      const safeName = structured.originalFilename.replace(/[^\w.\- ()]+/g, '_').slice(0, 200);
      res.setHeader('Content-Type', structured.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Length', String(structured.buffer.length));
      res.status(200).send(structured.buffer);
    } catch (error) {
      next(error as Error);
    }
  };
}
