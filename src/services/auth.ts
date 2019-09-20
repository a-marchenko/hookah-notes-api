import { User } from '../entity/User';
import { sign } from 'jsonwebtoken';

export const createAccessToken = (user: User) => {
  return sign({ userId: user.id, username: user.username }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m',
  });
};

export const createRefreshToken = (user: User) => {
  return sign({ userId: user.id, username: user.username }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '7d',
  });
};
