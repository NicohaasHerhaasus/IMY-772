import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { SampleUploadService } from '../../../application/services/sample-upload.service';
import { DatasetsService } from '../../../application/services/datasets.service';

export class SampleUploadController {
  constructor(
    private readonly sampleUploadService: SampleUploadService,
    private readonly datasetsService: DatasetsService,
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

      const result = await this.sampleUploadService.ingestWorkbook(req.file.buffer);

      // Record file upload metadata
      try {
        await this.datasetsService.recordFileUpload(
          req.file.originalname,
          'isolates',
          result.insertedCount,
          'samples'
        );
      } catch (error) {
        console.warn('Failed to record file metadata:', error);
        // Don't fail the upload if metadata recording fails
      }

      res.status(result.insertedCount > 0 ? 201 : 200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
