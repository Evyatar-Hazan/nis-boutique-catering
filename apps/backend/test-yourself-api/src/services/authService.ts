import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserResponse } from '../models/User';

// סודות - במציאות יהיו במשתני סביבה
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';
const _JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const _JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  
  // הצפנת סיסמה
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // בדיקת סיסמה
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // יצירת JWT token
  static generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  }

  // יצירת Refresh token
  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  // אימות JWT token
  static verifyAccessToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // אימות Refresh token
  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // יצירת token לאימות מייל
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // יצירת token לאיפוס סיסמה
  static generateResetPasswordToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // המרת User ל-UserResponse (הסרת מידע רגיש)
  static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      followers: user.followers ?? [],
      following: user.following ?? []
    };
  }

  // ולידציית מייל
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ולידציית סיסמה (לפחות 8 תווים, אות גדולה, אות קטנה, מספר)
  static isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // ולידציית שם (לפחות 2 תווים, רק אותיות ורווחים)
  static isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Zא-ת\s]{2,50}$/;
    return nameRegex.test(name.trim());
  }
}