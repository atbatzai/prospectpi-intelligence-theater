/**
 * ProspectPI Intelligence Theater - User Model
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { DatabaseManager } from '../database/DatabaseManager';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export class UserService {
  private db = DatabaseManager.getInstance().getDatabase();

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.getUserByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(input.password, 10);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run([id, input.email, password_hash, now, now]);
    stmt.finalize();

    return {
      id,
      email: input.email,
      password_hash,
      created_at: now,
      updated_at: now
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      
      stmt.get([email], (err: Error | null, row: User) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
      
      stmt.get([id], (err: Error | null, row: User) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}