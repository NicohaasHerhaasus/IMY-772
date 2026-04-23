import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';
import { StarAmrUploadService } from '../../../application/services/staramr-upload.service';
import { ExampleAmrFinderPlusUploadService } from '../../../application/services/example-amrfinder-plus-upload.service';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UploadController {
  constructor(
    private readonly starAmrUploadService: StarAmrUploadService,
    private readonly exampleAmrFinderPlusUploadService: ExampleAmrFinderPlusUploadService,
    private readonly uploadedDatafileService: UploadedDatafileService,
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

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }
      const result = await this.starAmrUploadService.ingestWorkbook(req.file.buffer);
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'staramr_workbook',
        displayName: req.file.originalname,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uploadedBy: userId,
        fileBuffer: req.file.buffer,
      });
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

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }
      const result = await this.exampleAmrFinderPlusUploadService.ingestWorkbook(req.file.buffer);
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'example_amrfinder_workbook',
        displayName: req.file.originalname,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uploadedBy: userId,
        fileBuffer: req.file.buffer,
      });
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

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }
      const result = await this.exampleAmrFinderPlusUploadService.ingestTsv(req.file.buffer);
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'example_amrfinder_tsv',
        displayName: req.file.originalname,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype || 'text/tab-separated-values',
        uploadedBy: userId,
        fileBuffer: req.file.buffer,
      });
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
