import { Router } from 'express';
import { MockItemRepository } from '../../../infrastructure/persistence/mock-item.repository';
import { ItemService } from '../../../application/services/item.service';
import { ItemController } from '../controllers/item.controller';

const router = Router();

const itemRepository = new MockItemRepository();
const itemService = new ItemService(itemRepository);
const itemController = new ItemController(itemService);

router.get('/', itemController.list);

export default router;
