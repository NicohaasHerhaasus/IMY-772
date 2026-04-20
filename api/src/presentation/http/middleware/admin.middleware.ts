import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ForbiddenError } from '../../../application/errors/app.errors';
import { UserRole } from '../../../domain/enums/role.enum';

export function adminMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (req.userRole !== UserRole.ADMIN) {
    next(new ForbiddenError('Admin access required.'));
    return;
  }
  next();
}
