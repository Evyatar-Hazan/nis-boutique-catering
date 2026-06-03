import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import * as commentService from '../services/commentService';

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;

    if (!nodeId) {
      res.status(400).json({ message: 'Node ID required' });
      return;
    }

    const comments = await commentService.getCommentsByNodeId(nodeId);
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { nodeId, content, parentCommentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const comment = await commentService.createComment(
      nodeId,
      content,
      userId,
      parentCommentId
    );

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const comment = await commentService.getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.authorId !== userId && !req.user?.isAdmin) {
      res.status(403).json({ message: 'You can only edit your own comments' });
      return;
    }

    const updatedComment = await commentService.updateComment(commentId, content);
    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const comment = await commentService.getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.authorId !== userId && !req.user?.isAdmin) {
      res.status(403).json({ message: 'You can only delete your own comments' });
      return;
    }

    await commentService.deleteComment(commentId);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};
