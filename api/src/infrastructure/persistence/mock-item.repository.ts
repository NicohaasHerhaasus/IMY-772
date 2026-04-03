import type { IItemRepository } from '../../domain/ports/item.repository.port';
import type { Item } from '../../domain/entities/item.entity';

export class MockItemRepository implements IItemRepository {
  async findAll(): Promise<Item[]> {
    return [
      { id: '1', name: 'Mock Item Alpha' },
      { id: '2', name: 'Mock Item Beta' },
    ];
  }
}
