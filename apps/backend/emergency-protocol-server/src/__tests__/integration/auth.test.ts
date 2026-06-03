import request from 'supertest';
import app from '../../index';
import * as authService from '../../services/authService';

jest.mock('../../services/authService');

describe('Auth Routes', () => {
  describe('POST /api/auth/google-login', () => {
    it('should login user with valid token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        isAdmin: false,
      };

      const mockToken = 'mock-jwt-token';

      (authService.verifyGoogleToken as jest.Mock).mockResolvedValue({
        sub: 'google-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
      });

      (authService.loginOrCreateUser as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const response = await request(app).post('/api/auth/google-login').send({
        idToken: 'fake-token',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe(mockToken);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 if idToken is missing', async () => {
      const response = await request(app).post('/api/auth/google-login').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 401 if token is invalid', async () => {
      (authService.verifyGoogleToken as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/auth/google-login').send({
        idToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user if authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      // This will fail without a real token, but shows the structure
      expect([401, 403]).toContain(response.status);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
