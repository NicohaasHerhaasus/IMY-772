import type { Item } from '../entities/item.entity';

export interface IItemRepository {
  findAll(): Promise<Item[]>;
}
