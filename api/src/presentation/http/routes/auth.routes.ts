import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../../../application/services/auth.service';
import { PostgresUserRepository } from '../../../infrastructure/persistence/postgres-user.repository';
import { PasswordService } from '../../../infrastructure/security/password.service';
import { TokenService } from '../../../infrastructure/security/token.service';
import { getPool } from '../../../infrastructure/database/pool';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const pool = getPool();
const userRepository = new PostgresUserRepository(pool);
const passwordService = new PasswordService();
const tokenService = new TokenService();
const authService = new AuthService(userRepository, passwordService, tokenService);
const authController = new AuthController(authService);

router.get('/me', authMiddleware, authController.getProfile);

export default router;
