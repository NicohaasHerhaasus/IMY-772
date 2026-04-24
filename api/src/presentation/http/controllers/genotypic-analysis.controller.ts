import { NextFunction, Request, Response } from 'express';
import { GenotypicAnalysisService } from '../../../application/services/genotypic-analysis.service';
import { ValidationError } from '../../../application/errors/app.errors';
import { UploadedDatafileService } from '../../../application/services/uploaded-datafile.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class GenotypicAnalysisController {
  constructor(
    private readonly genotypicAnalysisService: GenotypicAnalysisService,
    private readonly uploadedDatafileService: UploadedDatafileService,
  ) {}

  uploadGenotypicXlsx = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['An .xlsx file is required in the "file" field.']);
      }

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }
      const result = await this.genotypicAnalysisService.uploadXlsx(req.file.buffer);
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'genotypic_xlsx',
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

  uploadTsvRows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rows } = req.body as { rows?: unknown };
      if (!Array.isArray(rows)) {
        throw new ValidationError(['rows must be an array.']);
      }
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId;
      if (!userId) {
        throw new ValidationError(['User id missing from token.']);
      }
      const uploadedFileName =
        typeof req.body?.uploadedFileName === 'string' && req.body.uploadedFileName.trim()
          ? req.body.uploadedFileName.trim()
          : 'genotypic-upload.tsv';

      const result = await this.genotypicAnalysisService.uploadRows(
        rows as Record<string, string | null | undefined>[],
      );
      await this.uploadedDatafileService.createStructured({
        uploadChannel: 'genotypic_tsv',
        displayName: uploadedFileName,
        originalFilename: uploadedFileName,
        mimeType: 'text/tab-separated-values',
        uploadedBy: userId,
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
