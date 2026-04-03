import { IUserRepository } from '../../domain/ports/user.repository.port';
import { UserWithoutPassword } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/role.enum';
import { PasswordService } from '../../infrastructure/security/password.service';
import { TokenService } from '../../infrastructure/security/token.service';
import { RegisterDTO } from '../dtos/register.dto';
import { LoginDTO } from '../dtos/login.dto';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/app.errors';

function stripPassword(user: any): UserWithoutPassword {
  const { password, ...rest } = user;
  return rest;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDTO): Promise<{ user: UserWithoutPassword; token: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists.');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.userRepository.create({
      name: dto.name.trim(),
      surname: dto.surname.trim(),
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      role: dto.role || UserRole.USER,
    });

    const token = this.tokenService.sign({ userId: user.id, role: user.role });

    return { user: stripPassword(user), token };
  }

  async login(dto: LoginDTO): Promise<{ user: UserWithoutPassword; token: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const passwordValid = await this.passwordService.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = this.tokenService.sign({ userId: user.id, role: user.role });

    return { user: stripPassword(user), token };
  }

  async getProfile(userId: string): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return stripPassword(user);
  }
}
