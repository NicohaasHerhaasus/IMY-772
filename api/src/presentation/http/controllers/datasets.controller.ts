import { Request, Response, NextFunction } from 'express';
import { DatasetsService } from '../../../application/services/datasets.service';

export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  /**
   * GET /api/datasets
   * Returns all uploaded files with metadata
   */
  getAllDatasets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = await this.datasetsService.getAllDatasets();
      res.status(200).json({
        status: 'success',
        data: files,
      });
    } catch (error) {
      next(error as Error);
    }
  };

  /**
   * GET /api/datasets/:id
   * Returns a specific file by ID
   */
  getDatasetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const file = await this.datasetsService.getDatasetById(id);

      if (!file) {
        res.status(404).json({
          status: 'error',
          message: 'Dataset not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      next(error as Error);
    }
  };

  /**
   * GET /api/datasets/:id/rows
   * Returns all rows from the dataset's source table
   */
  getDatasetRows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const rows = await this.datasetsService.getDatasetRows(id);

      res.status(200).json({
        status: 'success',
        data: {
          rows,
        },
      });
    } catch (error) {
      next(error as Error);
    }
  };
}
