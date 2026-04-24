import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ValidationError } from '../../../application/errors/app.errors';
import { ChatbotService } from '../../../application/services/chatbot.service';

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  ask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { question } = req.body as { question?: unknown };
      if (typeof question !== 'string' || question.trim().length === 0) {
        throw new ValidationError(['question must be a non-empty string.']);
      }

      const answer = await this.chatbotService.ask(question.trim());

      res.status(200).json({ status: 'success', data: { answer } });
    } catch (error) {
      next(error as Error);
    }
  };
}
