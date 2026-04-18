import { NextFunction, Request, Response } from 'express';
import { GenotypicAnalysisService } from '../../../application/services/genotypic-analysis.service';
import { ValidationError } from '../../../application/errors/app.errors';

export class GenotypicAnalysisController {
  constructor(private readonly genotypicAnalysisService: GenotypicAnalysisService) {}

  uploadGenotypicXlsx = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError(['An .xlsx file is required in the "file" field.']);
      }

      const result = await this.genotypicAnalysisService.uploadXlsx(req.file.buffer);

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

      const result = await this.genotypicAnalysisService.uploadRows(
        rows as Record<string, string | null | undefined>[],
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
