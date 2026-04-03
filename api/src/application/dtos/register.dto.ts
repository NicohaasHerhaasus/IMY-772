import { UserRole } from '../../domain/enums/role.enum';

export interface RegisterDTO {
  name: string;
  surname: string;
  email: string;
  password: string;
  role?: UserRole;
}

export function validateRegisterDTO(data: any): string[] {
  const errors: string[] = [];

  // Add this guard clause to prevent the crash
  if (!data) {
    return ['Request payload is missing or empty.'];
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required.');
  }

  if (!data.surname || typeof data.surname !== 'string' || data.surname.trim().length === 0) {
    errors.push('Surname is required.');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email format is invalid.');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required.');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (data.role !== undefined && !Object.values(UserRole).includes(data.role)) {
    errors.push(`Role must be one of: ${Object.values(UserRole).join(', ')}.`);
  }

  return errors;
}
