import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { SampleUploadService } from '../../../application/services/sample-upload.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SampleUploadController {
  constructor(
    private readonly sampleUploadService: SampleUploadService,
    private readonly uploadedDatafileService: UploadedDatafileService,
  ) {}

  validateWorkbook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A .xlsx file is required in the "file" field.']);
      }

      const result = await this.sampleUploadService.validateWorkbook(req.file.buffer);

      res.status(200).json({
        status: 'success',
        data: {
          rowCount: result.rowCount,
          rows: result.rows,
        },
      });
    } catch (error) {
      next(error as Error);
    }
  };

  ingestWorkbook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A .xlsx file is required in the "file" field.']);
      }

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }

      const result = await this.sampleUploadService.ingestWorkbook(req.file.buffer);
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'sample_dashboard_xlsx',
        displayName: req.file.originalname,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uploadedBy: userId,
        fileBuffer: req.file.buffer,
      });

      res.status(result.insertedCount > 0 ? 201 : 200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
