import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { StarAmrUploadService } from '../../../application/services/staramr-upload.service';
import { ExampleAmrFinderPlusUploadService } from '../../../application/services/example-amrfinder-plus-upload.service';

export class UploadController {
  constructor(
    private readonly starAmrUploadService: StarAmrUploadService,
    private readonly exampleAmrFinderPlusUploadService: ExampleAmrFinderPlusUploadService,
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
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
