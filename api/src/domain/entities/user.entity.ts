import { UserRole } from '../enums/role.enum';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
