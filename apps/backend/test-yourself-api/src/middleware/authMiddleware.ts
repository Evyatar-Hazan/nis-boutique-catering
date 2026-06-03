import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { User } from '../models/User';
import path from 'path';
import fs from 'fs';

const USERS_FILE = path.join(__dirname, '../../data', 'users.json');

// פונקציה עוזרת לקריאת קובץ JSON (עותק מהשרת הראשי)
const readJsonFile = <T>(filePath: string, defaultData: T = [] as unknown as T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultData;
  }
};

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'נדרש token גישה' 
    });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token לא תקין' 
      });
    }

    // מחפש את המשתמש במסד הנתונים
    const users: User[] = readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(403).json({ 
        error: 'User not found',
        message: 'משתמש לא נמצא' 
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token לא תקין' 
    });
  }
};

export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'נדרש אימות מייל כדי לגשת לתכונה זו'
    });
  }
  next();
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = AuthService.verifyAccessToken(token);
      if (decoded) {
        const users: User[] = readJsonFile(USERS_FILE, []);
        const user = users.find(u => u.id === decoded.userId);
        if (user) {
          req.user = user;
          req.userId = user.id;
        }
      }
    } catch (error) {
      // אם יש שגיאה באימות ה-token, פשוט נמשיך בלי להגדיר משתמש
    }
  }
  
  next();
};