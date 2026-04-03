import type { Request, Response, NextFunction } from 'express';
import type { ItemService } from '../../../application/services/item.service';

export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.itemService.listItems();
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  };
}
