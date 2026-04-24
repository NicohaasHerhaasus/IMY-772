import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { StarAmrUploadService } from '../../../application/services/staramr-upload.service';
import { ExampleAmrFinderPlusUploadService } from '../../../application/services/example-amrfinder-plus-upload.service';
import { DatasetsService } from '../../../application/services/datasets.service';

export class UploadController {
  constructor(
    private readonly starAmrUploadService: StarAmrUploadService,
    private readonly exampleAmrFinderPlusUploadService: ExampleAmrFinderPlusUploadService,
    private readonly datasetsService: DatasetsService,
  ) {}

  uploadStarAmrWorkbook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A .xlsx file is required in the "file" field.']);
      }

      const result = await this.starAmrUploadService.ingestWorkbook(req.file.buffer);

      // Record file upload metadata
      try {
        await this.datasetsService.recordFileUpload(
          req.file.originalname,
          'staramr',
          result.isolatesCount,
          'isolates'
        );
      } catch (error) {
        console.warn('Failed to record file metadata:', error);
      }

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };

  uploadExampleAmrFinderPlusWorkbook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A .xlsx file is required in the "file" field.']);
      }

      const result = await this.exampleAmrFinderPlusUploadService.ingestWorkbook(req.file.buffer);

      // Record file upload metadata
      try {
        await this.datasetsService.recordFileUpload(
          req.file.originalname,
          'amrfinder-plus',
          result.insertedCount,
          'example_amrfinder_plus'
        );
      } catch (error) {
        console.warn('Failed to record file metadata:', error);
      }

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };

  uploadExampleAmrFinderPlusTsv = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['A .tsv file is required in the "file" field.']);
      }

      const result = await this.exampleAmrFinderPlusUploadService.ingestTsv(req.file.buffer);

      // Record file upload metadata
      try {
        await this.datasetsService.recordFileUpload(
          req.file.originalname,
          'amrfinder-plus-tsv',
          result.insertedCount,
          'example_amrfinder_plus'
        );
      } catch (error) {
        console.warn('Failed to record file metadata:', error);
      }

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
