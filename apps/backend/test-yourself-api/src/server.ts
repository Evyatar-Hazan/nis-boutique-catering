import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { ApiResponse } from '@monorepo/shared-types';
import { formatTime, capitalize } from '@monorepo/shared-utils';
import { AuthService } from './services/authService';
import { EmailService } from './services/emailService';
import { authenticateToken, requireEmailVerification, AuthenticatedRequest } from './middleware/authMiddleware';
import { User as AuthUser, UserResponse, LoginRequest, RegisterRequest, AuthResponse, VerifyEmailRequest, ResetPasswordRequest, ResetPasswordConfirmRequest } from './models/User';

// Types
interface TestComment {
  id: string;
  testId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likes: string[];
  parentId: string | null;
  replies: TestComment[];
}

interface Test {
  id: string;
  ownerId: string;
  subject: string;
  score: number;
  takenAt: string;
  questionsCount: number;
  respondentsCount: number;
  averageScore: number;
  averageCorrect: number;
  likes?: string[];
  questions: Question[];
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  followers?: string[];
  following?: string[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// הגשת קבצים סטטיים (תמונות אווטאר)
app.use('/public', express.static(path.join(__dirname, '../public')));

// נתיבי קבצים
const USER_TESTS_FILE = path.join(__dirname, '../data', 'userTests.json');
const TESTS_FILE = path.join(__dirname, '../data', 'tests.json');
const USERS_FILE = path.join(__dirname, '../data', 'users.json');
const POSTS_FILE = path.join(__dirname, '../data', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, '../data', 'comments.json');
const TEST_COMMENTS_FILE = path.join(__dirname, '../data', 'testComments.json');

// פונקציה עוזרת לקריאת קובץ JSON
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

// פונקציה עוזרת לכתיבת קובץ JSON
const writeJsonFile = <T>(filePath: string, data: T): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

// Auth Endpoints

// הרשמה
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password }: RegisterRequest = req.body;

    // ולידציה
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'נדרשים שם, מייל וסיסמה'
      });
    }

    if (!AuthService.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'כתובת מייל לא תקינה'
      });
    }

    if (!AuthService.isValidName(name)) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'שם חייב להכיל לפחות 2 תווים ורק אותיות ורווחים'
      });
    }

    if (!AuthService.isValidPassword(password)) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'סיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר'
      });
    }

    // בדיקה אם המייל כבר קיים
    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'כתובת מייל זו כבר קיימת במערכת'
      });
    }

    // יצירת משתמש חדש
    const hashedPassword = await AuthService.hashPassword(password);
    const emailVerificationToken = AuthService.generateEmailVerificationToken();
    
    const newUser: AuthUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followers: [],
      following: []
    };

    users.push(newUser);
    writeJsonFile(USERS_FILE, users);

    // שליחת מייל אימות
    const emailSent = await EmailService.sendVerificationEmail(
      newUser.email, 
      newUser.name, 
      emailVerificationToken
    );

    if (!emailSent) {
      console.warn('Failed to send verification email');
    }

    // יצירת tokens
    const accessToken = AuthService.generateAccessToken(newUser.id);
    const refreshToken = AuthService.generateRefreshToken(newUser.id);

    const response: AuthResponse = {
      user: AuthService.toUserResponse(newUser),
      token: accessToken,
      refreshToken
    };

    res.status(201).json({
      ...response,
      message: 'ההרשמה הושלמה בהצלחה. נשלח אליך מייל לאימות הכתובת'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'שגיאה בהרשמה. נסה שוב'
    });
  }
});

// התחברות
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'נדרש מייל וסיסמה'
      });
    }

    // חיפוש משתמש
    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'מייל או סיסמה שגויים'
      });
    }

    // בדיקת סיסמה
    const isPasswordValid = await AuthService.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'מייל או סיסמה שגויים'
      });
    }

    // עדכון זמן התחברות אחרון
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex].lastLoginAt = new Date().toISOString();
    users[userIndex].updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    // יצירת tokens
    const accessToken = AuthService.generateAccessToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    const response: AuthResponse = {
      user: AuthService.toUserResponse(users[userIndex]),
      token: accessToken,
      refreshToken
    };

    res.json({
      ...response,
      message: 'התחברות מוצלחת'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'שגיאה בהתחברות. נסה שוב'
    });
  }
});

// אימות מייל
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { token }: VerifyEmailRequest = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'נדרש token לאימות'
      });
    }

    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.emailVerificationToken === token);

    if (userIndex === -1) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Token לא תקין או פג תוקף'
      });
    }

    // עדכון המשתמש
    users[userIndex].isEmailVerified = true;
    users[userIndex].emailVerificationToken = undefined;
    users[userIndex].updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    // שליחת מייל ברכה
    await EmailService.sendWelcomeEmail(
      users[userIndex].email,
      users[userIndex].name
    );

    res.json({
      message: 'המייל אומת בהצלחה!',
      user: AuthService.toUserResponse(users[userIndex])
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'שגיאה באימות המייל. נסה שוב'
    });
  }
});

// בקשת איפוס סיסמה
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email }: ResetPasswordRequest = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'נדרש מייל'
      });
    }

    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      // לא מגלים שהמייל לא קיים מסיבות אבטחה
      return res.json({
        message: 'אם המייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה'
      });
    }

    // יצירת token לאיפוס
    const resetToken = AuthService.generateResetPasswordToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // תוקף של שעה

    users[userIndex].resetPasswordToken = resetToken;
    users[userIndex].resetPasswordExpires = resetExpires;
    users[userIndex].updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    // שליחת מייל
    await EmailService.sendPasswordResetEmail(
      users[userIndex].email,
      users[userIndex].name,
      resetToken
    );

    res.json({
      message: 'אם המייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Reset failed',
      message: 'שגיאה בבקשת איפוס הסיסמה. נסה שוב'
    });
  }
});

// אישור איפוס סיסמה
app.post('/api/auth/reset-password-confirm', async (req: Request, res: Response) => {
  try {
    const { token, newPassword }: ResetPasswordConfirmRequest = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'נדרש token וסיסמה חדשה'
      });
    }

    if (!AuthService.isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'סיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר'
      });
    }

    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => 
      u.resetPasswordToken === token && 
      u.resetPasswordExpires && 
      new Date(u.resetPasswordExpires) > new Date()
    );

    if (userIndex === -1) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Token לא תקין או פג תוקף'
      });
    }

    // עדכון הסיסמה
    const hashedPassword = await AuthService.hashPassword(newPassword);
    users[userIndex].password = hashedPassword;
    users[userIndex].resetPasswordToken = undefined;
    users[userIndex].resetPasswordExpires = undefined;
    users[userIndex].updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    res.json({
      message: 'הסיסמה עודכנה בהצלחה'
    });

  } catch (error) {
    console.error('Reset password confirm error:', error);
    res.status(500).json({
      error: 'Reset failed',
      message: 'שגיאה באיפוס הסיסמה. נסה שוב'
    });
  }
});

// בדיקת סטטוס המשתמש הנוכחי
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'User not found',
      message: 'משתמש לא נמצא'
    });
  }

  res.json({
    user: AuthService.toUserResponse(req.user),
    message: 'מידע המשתמש נטען בהצלחה'
  });
});

// התנתקות (אופציונלי - בצד הלקוח פשוט מוחקים את ה-token)
app.post('/api/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // במערכת פשוטה כמו זו, ההתנתקות מתבצעת בצד הלקוח
  // ניתן להוסיף blacklist של tokens אם נדרש
  res.json({
    message: 'התנתקות מוצלחת'
  });
});

// רענון token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'נדרש refresh token'
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({
        error: 'Invalid refresh token',
        message: 'Refresh token לא תקין'
      });
    }

    // בדיקה שהמשתמש עדיין קיים
    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(403).json({
        error: 'User not found',
        message: 'משתמש לא נמצא'
      });
    }

    // יצירת token חדש
    const newAccessToken = AuthService.generateAccessToken(user.id);
    const newRefreshToken = AuthService.generateRefreshToken(user.id);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: AuthService.toUserResponse(user)
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Refresh failed',
      message: 'שגיאה ברענון ה-token'
    });
  }
});

// קריאת מבחני משתמש
app.get('/api/user-tests', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(USER_TESTS_FILE)) {
      fs.writeFileSync(USER_TESTS_FILE, '[]');
    }

    const data = fs.readFileSync(USER_TESTS_FILE, 'utf8');
    const tests = JSON.parse(data);
    res.json(tests);
  } catch (error) {
    console.error('Error reading user tests:', error);
    res.status(500).json({ error: 'Failed to read user tests' });
  }
});

// שמירת מבחן חדש
app.post('/api/user-tests', (req: Request, res: Response) => {
  try {
    const newTest = req.body;

    // קריאת המבחנים הקיימים
    const tests = readJsonFile<Test[]>(USER_TESTS_FILE, []);

    // הוספת המבחן החדש
    tests.push(newTest);

    // שמירה לקובץ
    fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(tests, null, 2));

    console.log('Test saved successfully:', newTest.id);
    res.status(201).json({ message: 'Test saved successfully', test: newTest });
  } catch (error) {
    console.error('Error saving test:', error);
    res.status(500).json({ error: 'Failed to save test' });
  }
});

// מחיקת מבחן
app.delete('/api/user-tests/:testId', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    // קריאת המבחנים הקיימים
    const tests = readJsonFile<Test[]>(USER_TESTS_FILE, []);

    // סינון המבחנים (הסרת המבחן שנמחק)
    const filteredTests = tests.filter((test) => test.id !== testId);

    // בדיקה שהמבחן נמצא ונמחק
    if (filteredTests.length === tests.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // שמירה לקובץ
    fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(filteredTests, null, 2));

    console.log('Test deleted successfully:', testId);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// === USERS ENDPOINTS ===
// קריאת כל המשתמשים
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const users = readJsonFile<User[]>(USERS_FILE, []);
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// === FOLLOW SYSTEM ===
// Get a single user by id (with followers/following)
app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const users = readJsonFile<AuthUser[]>(USERS_FILE, []);
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(AuthService.toUserResponse(user));
  } catch (error) {
    console.error('Error reading user:', error);
    return res.status(500).json({ error: 'Failed to read user' });
  }
});

// Follow a user
app.post('/api/users/:id/follow', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'נדרש token גישה' });
    }
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself', message: 'לא ניתן לעקוב אחרי עצמך' });
    }

    const users = readJsonFile<AuthUser[]>(USERS_FILE, []);
    const currentUser = users.find(u => u.id === currentUserId);
    const targetUser = users.find(u => u.id === targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found', message: 'משתמש לא נמצא' });
    }

    // initialize arrays if missing
    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];

    if (!currentUser.following.includes(targetUserId)) {
      currentUser.following.push(targetUserId);
    }
    if (!targetUser.followers.includes(currentUserId)) {
      targetUser.followers.push(currentUserId);
    }

    currentUser.updatedAt = new Date().toISOString();
    targetUser.updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    return res.json({
      message: 'Followed successfully',
      me: AuthService.toUserResponse(currentUser),
      target: AuthService.toUserResponse(targetUser)
    });
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ error: 'Failed to follow user', message: 'נכשל לעקוב' });
  }
});

// Unfollow a user
app.delete('/api/users/:id/follow', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'נדרש token גישה' });
    }
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself', message: 'לא ניתן להסיר מעקב מעצמך' });
    }

    const users = readJsonFile<AuthUser[]>(USERS_FILE, []);
    const currentUser = users.find(u => u.id === currentUserId);
    const targetUser = users.find(u => u.id === targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found', message: 'משתמש לא נמצא' });
    }

    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];

    currentUser.following = currentUser.following.filter(id => id !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);

    currentUser.updatedAt = new Date().toISOString();
    targetUser.updatedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);

    return res.json({
      message: 'Unfollowed successfully',
      me: AuthService.toUserResponse(currentUser),
      target: AuthService.toUserResponse(targetUser)
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Failed to unfollow user', message: 'נכשל להסיר מעקב' });
  }
});

// Get followers list
app.get('/api/users/:id/followers', (req: Request, res: Response) => {
  try {
    const users = readJsonFile<AuthUser[]>(USERS_FILE, []);
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const followers = (user.followers || []).map(fid => {
      const u = users.find(x => x.id === fid);
      return u ? AuthService.toUserResponse(u) : null;
    }).filter(Boolean);
    return res.json(followers);
  } catch (error) {
    console.error('Error getting followers:', error);
    return res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following list
app.get('/api/users/:id/following', (req: Request, res: Response) => {
  try {
    const users = readJsonFile<AuthUser[]>(USERS_FILE, []);
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const following = (user.following || []).map(fid => {
      const u = users.find(x => x.id === fid);
      return u ? AuthService.toUserResponse(u) : null;
    }).filter(Boolean);
    return res.json(following);
  } catch (error) {
    console.error('Error getting following:', error);
    return res.status(500).json({ error: 'Failed to get following' });
  }
});

// === TESTS ENDPOINTS ===
// קריאת כל המבחנים (סטטיים + משתמש)
app.get('/api/tests', (req: Request, res: Response) => {
  try {
    const staticTests = readJsonFile<Test[]>(TESTS_FILE, []);
    const userTests = readJsonFile<Test[]>(USER_TESTS_FILE, []);
    const allTests = [...userTests, ...staticTests];
    res.json(allTests);
  } catch (error) {
    console.error('Error reading tests:', error);
    res.status(500).json({ error: 'Failed to read tests' });
  }
});

// === POSTS ENDPOINTS ===
// קריאת כל הפוסטים
app.get('/api/posts', (req: Request, res: Response) => {
  try {
    const posts = readJsonFile<Post[]>(POSTS_FILE, []);
    res.json(posts);
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// === COMMENTS ENDPOINTS ===
// קריאת כל התגובות
app.get('/api/comments', (req: Request, res: Response) => {
  try {
    const comments = readJsonFile<Comment[]>(COMMENTS_FILE, []);
    res.json(comments);
  } catch (error) {
    console.error('Error reading comments:', error);
    res.status(500).json({ error: 'Failed to read comments' });
  }
});

// === TEST COMMENTS ENDPOINTS ===
// קריאת תגובות לפי מבחן
app.get('/api/tests/:testId/comments', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const comments = readJsonFile<TestComment[]>(TEST_COMMENTS_FILE, []);
    const testComments = comments.filter((comment) => comment.testId === testId);
    res.json(testComments);
  } catch (error) {
    console.error('Error reading test comments:', error);
    res.status(500).json({ error: 'Failed to read test comments' });
  }
});

// הוספת תגובה חדשה למבחן
app.post('/api/tests/:testId/comments', (req: Request, res: Response) => {
  try {
    const testId = req.params.testId as string;
    const { authorId, body, parentId = null } = req.body;

    if (!authorId || !body) {
      return res.status(400).json({ error: 'Author ID and body are required' });
    }

    const comments = readJsonFile<TestComment[]>(TEST_COMMENTS_FILE, []);
    const newComment: TestComment = {
      id: `tc${Date.now()}`,
      testId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
      likes: [],
      parentId,
      replies: [],
    };

    if (parentId) {
      // אם זו תגובה מקוננת, נמצא את התגובה האב ונוסיף אליה
      const addReplyToComment = (commentsList: TestComment[]): boolean => {
        for (const comment of commentsList) {
          if (comment.id === parentId) {
            comment.replies.push(newComment);
            return true;
          }
          if (comment.replies && addReplyToComment(comment.replies)) {
            return true;
          }
        }
        return false;
      };

      if (!addReplyToComment(comments)) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    } else {
      // תגובה ראשית
      comments.push(newComment);
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding test comment:', error);
    res.status(500).json({ error: 'Failed to add test comment' });
  }
});

// עדכון תגובה
app.put('/api/tests/:testId/comments/:commentId', (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const comments = readJsonFile<TestComment[]>(TEST_COMMENTS_FILE, []);

    const updateComment = (commentsList: TestComment[]): boolean => {
      for (const comment of commentsList) {
        if (comment.id === commentId) {
          comment.body = body;
          comment.updatedAt = new Date().toISOString();
          return true;
        }
        if (comment.replies && updateComment(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    if (!updateComment(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating test comment:', error);
    res.status(500).json({ error: 'Failed to update test comment' });
  }
});

// מחיקת תגובה
app.delete('/api/tests/:testId/comments/:commentId', (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const comments = readJsonFile<TestComment[]>(TEST_COMMENTS_FILE, []);

    const deleteComment = (commentsList: TestComment[]): boolean => {
      for (let i = 0; i < commentsList.length; i++) {
        if (commentsList[i].id === commentId) {
          commentsList.splice(i, 1);
          return true;
        }
        if (commentsList[i].replies && deleteComment(commentsList[i].replies)) {
          return true;
        }
      }
      return false;
    };

    if (!deleteComment(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting test comment:', error);
    res.status(500).json({ error: 'Failed to delete test comment' });
  }
});

// === LIKES ENDPOINTS ===
// הוספת/הסרת לייק לתגובה
app.post('/api/tests/:testId/comments/:commentId/like', (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const comments = readJsonFile<TestComment[]>(TEST_COMMENTS_FILE, []);

    const toggleLike = (commentsList: TestComment[]): boolean => {
      for (const comment of commentsList) {
        if (comment.id === commentId) {
          const likeIndex = comment.likes.indexOf(userId);
          if (likeIndex > -1) {
            // הסר לייק
            comment.likes.splice(likeIndex, 1);
          } else {
            // הוסף לייק
            comment.likes.push(userId);
          }
          return true;
        }
        if (comment.replies && toggleLike(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    if (!toggleLike(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Like toggled successfully' });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to toggle comment like' });
  }
});

// הוספת/הסרת לייק למבחן
app.post('/api/tests/:testId/like', (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // נבדוק קודם במבחני משתמש
    let tests = readJsonFile<Test[]>(USER_TESTS_FILE, []);
    let testFound = false;

    for (const test of tests) {
      if (test.id === testId) {
        if (!test.likes) test.likes = [];
        const likeIndex = test.likes.indexOf(userId);
        if (likeIndex > -1) {
          test.likes.splice(likeIndex, 1);
        } else {
          test.likes.push(userId);
        }
        testFound = true;
        break;
      }
    }

    if (testFound) {
      fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(tests, null, 2));
      return res.json({ message: 'Like toggled successfully' });
    }

    // אם לא נמצא, נבדוק במבחנים הסטטיים
    tests = readJsonFile<Test[]>(TESTS_FILE, []);
    for (const test of tests) {
      if (test.id === testId) {
        if (!test.likes) test.likes = [];
        const likeIndex = test.likes.indexOf(userId);
        if (likeIndex > -1) {
          test.likes.splice(likeIndex, 1);
        } else {
          test.likes.push(userId);
        }
        testFound = true;
        break;
      }
    }

    if (!testFound) {
      return res.status(404).json({ error: 'Test not found' });
    }

    fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
    res.json({ message: 'Like toggled successfully' });
  } catch (error) {
    console.error('Error toggling test like:', error);
    res.status(500).json({ error: 'Failed to toggle test like' });
  }
});

// בקשת איפוס סיסמה
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email }: ResetPasswordRequest = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'נדרש מייל'
      });
    }

    if (!AuthService.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'כתובת מייל לא תקינה'
      });
    }

    // בדיקה אם המשתמש קיים
    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // מסיבות אבטחה, נחזיר הודעת הצלחה גם אם המשתמש לא קיים
      return res.json({
        message: 'אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה'
      });
    }

    // יצירת token לאיפוס סיסמה
    const resetToken = AuthService.generateResetPasswordToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // תקף לשעה

    // עדכון המשתמש עם ה-token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    user.updatedAt = new Date().toISOString();

    writeJsonFile(USERS_FILE, users);

    // שליחת מייל (בפיתוח נדלג)
    if (process.env.NODE_ENV !== 'development') {
      try {
        await EmailService.sendPasswordResetEmail(user.email, user.name, resetToken);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }
    } else {
      console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
    }

    res.json({
      message: 'אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'שגיאה פנימית בשרת'
    });
  }
});

// אימות איפוס סיסמה
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword }: ResetPasswordConfirmRequest = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'נדרשים token וסיסמה חדשה'
      });
    }

    if (!AuthService.isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'סיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר'
      });
    }

    // חיפוש המשתמש עם ה-token
    const users: AuthUser[] = readJsonFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => 
      u.resetPasswordToken === token && 
      u.resetPasswordExpires && 
      new Date(u.resetPasswordExpires) > new Date()
    );

    if (userIndex === -1) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Token לא תקין או פג תוקפו'
      });
    }

    const user = users[userIndex];

    // הצפנת הסיסמה החדשה
    const hashedPassword = await AuthService.hashPassword(newPassword);
    
    // עדכון המשתמש
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.updatedAt = new Date().toISOString();

    writeJsonFile(USERS_FILE, users);

    res.json({
      message: 'הסיסמה אופסה בהצלחה'
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'שגיאה פנימית בשרת'
    });
  }
});

// Health check endpoint with unified response format
app.get('/api/health', (_req: Request, res: Response<ApiResponse<object>>) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: formatTime(new Date()),
      service: 'Test Yourself API',
      uptime: process.uptime(),
    },
    message: 'Server is running',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 User tests file: ${USER_TESTS_FILE}`);
});