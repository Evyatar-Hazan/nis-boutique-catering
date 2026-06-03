import express, { Router } from 'express';
import { body } from 'express-validator';
import * as commentController from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.get('/:nodeId', commentController.getComments);

router.post(
  '/',
  authenticateToken,
  [
    body('nodeId').trim().notEmpty().withMessage('Node ID is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
  ],
  commentController.createComment
);

router.put(
  '/:commentId',
  authenticateToken,
  [body('content').trim().notEmpty().withMessage('Content is required')],
  commentController.updateComment
);

router.delete('/:commentId', authenticateToken, commentController.deleteComment);

export default router;
