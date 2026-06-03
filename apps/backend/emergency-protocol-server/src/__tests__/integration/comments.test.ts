import request from 'supertest';
import app from '../../index';
import * as commentService from '../../services/commentService';

jest.mock('../../services/commentService');

describe('Comment Routes', () => {
  describe('GET /api/comments/:nodeId', () => {
    it('should fetch comments for a node', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          nodeId: 'asthma_attack',
          content: 'Test comment',
          authorId: 'user-1',
          parentCommentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            picture: null,
            isAdmin: false,
          },
          replies: [],
        },
      ];

      (commentService.getCommentsByNodeId as jest.Mock).mockResolvedValue(mockComments);

      const response = await request(app).get('/api/comments/asthma_attack');

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].nodeId).toBe('asthma_attack');
    });

    it('should return 400 if nodeId is missing', async () => {
      const response = await request(app).get('/api/comments/');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/comments', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).post('/api/comments').send({
        nodeId: 'asthma_attack',
        content: 'Test comment',
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer fake-token')
        .send({
          nodeId: 'asthma_attack',
        });

      expect(response.status).toBe(403); // Invalid token
    });
  });

  describe('PUT /api/comments/:commentId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/comments/comment-1')
        .send({
          content: 'Updated content',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).delete('/api/comments/comment-1');

      expect(response.status).toBe(401);
    });
  });
});
