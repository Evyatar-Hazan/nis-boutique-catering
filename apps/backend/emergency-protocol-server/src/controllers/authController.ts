import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { verifyGoogleToken, loginOrCreateUser } from '../services/authService';

export const googleLogin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ message: 'ID token required' });
      return;
    }

    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const { user, token } = await loginOrCreateUser(payload);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    user: {
      id: req.user?.id,
      email: req.user?.email,
      isAdmin: req.user?.isAdmin,
    },
  });
};
