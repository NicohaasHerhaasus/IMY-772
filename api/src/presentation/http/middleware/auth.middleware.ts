import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { UnauthorizedError } from '../../../application/errors/app.errors';

import 'dotenv/config';

function resolveCognitoConfig(): { userPoolId: string; clientId: string } {
  const userPoolId =
    process.env.COGNITO_USER_POOL_ID ?? process.env.VITE_COGNITO_USER_POOL_ID ?? '';
  const clientId =
    process.env.COGNITO_APP_CLIENT_ID ?? process.env.VITE_COGNITO_APP_CLIENT_ID ?? '';

  return { userPoolId: userPoolId.trim(), clientId: clientId.trim() };
}

type CognitoVerifiers = {
  access: ReturnType<typeof CognitoJwtVerifier.create>;
  id: ReturnType<typeof CognitoJwtVerifier.create>;
};

let cachedVerifiers: { pool: string; client: string; verifiers: CognitoVerifiers } | null = null;

function getCognitoVerifiers(): CognitoVerifiers {
  const { userPoolId, clientId } = resolveCognitoConfig();
  if (!userPoolId || !clientId) {
    throw new UnauthorizedError('Cognito is not configured correctly on the API.');
  }

  if (!cachedVerifiers || cachedVerifiers.pool !== userPoolId || cachedVerifiers.client !== clientId) {
    cachedVerifiers = {
      pool: userPoolId,
      client: clientId,
      verifiers: {
        access: CognitoJwtVerifier.create({
          userPoolId,
          clientId,
          tokenUse: 'access',
        }),
        id: CognitoJwtVerifier.create({
          userPoolId,
          clientId,
          tokenUse: 'id',
        }),
      },
    };
  }

  return cachedVerifiers.verifiers;
}

async function verifyCognitoJwt(token: string) {
  const { access, id } = getCognitoVerifiers();
  try {
    return await access.verify(token);
  } catch {
    return await id.verify(token);
  }
}

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
    let payload;
    try {
      payload = await verifyCognitoJwt(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token.');
    }

    req.userId = payload.sub;
    const groups = payload['cognito:groups'];
    req.userRole =
      Array.isArray(groups) && typeof groups[0] === 'string' ? groups[0] : 'user';

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token.'));
    }
  }
}