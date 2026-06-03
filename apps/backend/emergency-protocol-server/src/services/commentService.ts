import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCommentsByNodeId = async (nodeId: string) => {
  return prisma.comment.findMany({
    where: { nodeId, parentCommentId: null },
    include: {
      author: {
        select: { id: true, email: true, name: true, picture: true, isAdmin: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, email: true, name: true, picture: true, isAdmin: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, email: true, name: true, picture: true, isAdmin: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createComment = async (
  nodeId: string,
  content: string,
  authorId: string,
  parentCommentId?: string
) => {
  return prisma.comment.create({
    data: {
      nodeId,
      content,
      authorId,
      parentCommentId,
    },
    include: {
      author: {
        select: { id: true, email: true, name: true, picture: true, isAdmin: true },
      },
    },
  });
};

export const updateComment = async (commentId: string, content: string) => {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: { id: true, email: true, name: true, picture: true, isAdmin: true },
      },
    },
  });
};

export const deleteComment = async (commentId: string) => {
  return prisma.comment.delete({
    where: { id: commentId },
  });
};

export const getCommentById = async (commentId: string) => {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: { id: true, email: true, name: true, picture: true, isAdmin: true },
      },
    },
  });
};
