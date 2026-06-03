import express, { Router } from 'express';
import { googleLogin, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.post('/google-login', googleLogin);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
