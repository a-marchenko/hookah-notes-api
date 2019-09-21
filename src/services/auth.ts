import { User } from '../entity/User';
import { sign } from 'jsonwebtoken';

export const accessSecret = process.env.JWT_ACCESS_SECRET || 'TMP_ACCESS_SECRET';

export const refreshSecret = process.env.JWT_REFRESH_SECRET || 'TMP_REFRESH_SECRET';

export const createAccessToken = (user: User) => {
  return sign({ userId: user.id, username: user.username, role: user.role.roleName }, accessSecret, {
    expiresIn: '15m',
  });
};

export const createRefreshToken = (user: User) => {
  return sign({ userId: user.id, username: user.username, role: user.role.roleName }, refreshSecret, {
    expiresIn: '7d',
  });
};
