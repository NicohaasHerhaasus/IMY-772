import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { UnauthorizedError } from '../../../application/errors/app.errors';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  clientId: process.env.COGNITO_APP_CLIENT_ID ?? '',
  tokenUse: 'access',
});

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required.');
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifier.verify(token);

    req.userId = payload.sub;
    // Cognito groups are available as 'cognito:groups' on the access token
    const groups = payload['cognito:groups'];
    req.userRole = Array.isArray(groups) ? groups[0] : 'user';

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token.'));
    }
  }
}
