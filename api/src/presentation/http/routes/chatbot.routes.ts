import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { chatbotGlobalLimiter, chatbotUserLimiter } from '../middleware/chatbot.ratelimit';
import { ChatbotService } from '../../../application/services/chatbot.service';
import { ChatbotController } from '../controllers/chatbot.controller';

const router = Router();

const chatbotService = new ChatbotService();
const chatbotController = new ChatbotController(chatbotService);

router.post('/', chatbotGlobalLimiter, authMiddleware, chatbotUserLimiter, chatbotController.ask);

export default router;
