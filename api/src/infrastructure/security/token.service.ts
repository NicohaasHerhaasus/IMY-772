import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

export class TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-me';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  sign(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.expiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, this.secret, options);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
