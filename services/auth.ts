import { sign } from 'jsonwebtoken';
import { User } from '../db/entities/User';

export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'TEST_REFRESH_TOKEN';
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'TEST_ACCESS_TOKEN';

export const createTokens = (user: User) => {
  const refreshToken = sign({ userId: user.id, authCount: user.authCount }, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
  const accessToken = sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
    expiresIn: '15min',
  });

  return { refreshToken, accessToken };
};
