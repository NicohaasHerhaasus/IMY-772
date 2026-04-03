import type { IItemRepository } from '../../domain/ports/item.repository.port';
import type { Item } from '../../domain/entities/item.entity';

export class ItemService {
  constructor(private readonly itemRepository: IItemRepository) {}

  async listItems(): Promise<Item[]> {
    return this.itemRepository.findAll();
  }
}
