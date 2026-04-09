import { NextFunction, Request, Response } from 'express';
import { IsolateService } from '../../../application/services/isolate.service';

export class IsolatesController {
  constructor(private readonly isolateService: IsolateService) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isolates = await this.isolateService.listAll();
      res.status(200).json({
        status: 'success',
        data: isolates,
      });
    } catch (error) {
      next(error as Error);
    }
  };
}

