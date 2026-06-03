import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.callbackUrl,
});

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

export const verifyGoogleToken = async (
  idToken: string
): Promise<GoogleTokenPayload | null> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload() as GoogleTokenPayload;
    return payload;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
};

export const loginOrCreateUser = async (payload: GoogleTokenPayload) => {
  const isAdmin = payload.email === config.adminEmail;

  let user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name,
        picture: payload.picture,
        isAdmin,
      },
    });
  } else if (user.isAdmin !== isAdmin) {
    // Update admin status if needed
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin },
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return { user, token };
};
