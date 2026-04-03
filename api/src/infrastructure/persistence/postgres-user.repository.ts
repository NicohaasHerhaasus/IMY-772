import { Pool } from 'pg';
import { User, CreateUserData } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { UserRole } from '../../domain/enums/role.enum';

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    surname: row.surname,
    email: row.email,
    password: row.password,
    role: row.role as UserRole,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    if (result.rows.length === 0) return null;
    return mapRowToUser(result.rows[0]);
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (name, surname, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.surname, data.email.toLowerCase(), data.password, data.role],
    );
    return mapRowToUser(result.rows[0]);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.surname !== undefined) {
      fields.push(`surname = $${paramIndex++}`);
      values.push(data.surname);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(data.password);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) return null;
    return mapRowToUser(result.rows[0]);
  }
}
