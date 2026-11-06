import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../infrastructure/database/connection';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../core/errors/app-error';
import { User, CreateUserDTO, AuthResponse } from './user.types';

export class UserService {
  async register(dto: CreateUserDTO): Promise<AuthResponse> {
    // Check existing email
    const existing = await query<User>(
      'SELECT id FROM users WHERE email = $1',
      [dto.email],
    );
    if (existing.length > 0) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [user] = await query<User>(
      `INSERT INTO users (email, full_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name AS "fullName", status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [dto.email, dto.fullName, passwordHash],
    );

    const token = this.generateToken(user.id);
    const { passwordHash: _h, ...safeUser } = { ...user, passwordHash };
    return { token, user: safeUser as Omit<User, 'passwordHash'> };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const [user] = await query<User>(
      `SELECT id, email, full_name AS "fullName", password_hash AS "passwordHash",
              status, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE email = $1`,
      [email],
    );

    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedError('Account is not active');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid email or password');

    const token = this.generateToken(user.id);
    const { passwordHash: _h, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async findById(id: string): Promise<User> {
    const [user] = await query<User>(
      `SELECT id, email, full_name AS "fullName", status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE id = $1`,
      [id],
    );
    if (!user) throw new NotFoundError('User');
    return user;
  }

  private generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  }
}

export const userService = new UserService();
