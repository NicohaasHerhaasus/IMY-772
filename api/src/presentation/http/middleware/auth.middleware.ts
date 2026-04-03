import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../../infrastructure/security/token.service';
import { UnauthorizedError } from '../../../application/errors/app.errors';

const tokenService = new TokenService();

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required.');
    }

    const token = authHeader.split(' ')[1];
    const payload = tokenService.verify(token);

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token.'));
    }
  }
}
