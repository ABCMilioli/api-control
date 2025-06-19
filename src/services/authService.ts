import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';

export interface JWTPayload {
  id: string;
  email: string;
  nome: string;
  role?: string;
}

export class AuthService {
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, authConfig.jwtSecret);
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
} 