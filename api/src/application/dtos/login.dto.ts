export interface LoginDTO {
  email: string;
  password: string;
}

export function validateLoginDTO(data: any): string[] {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required.');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required.');
  }

  return errors;
}
