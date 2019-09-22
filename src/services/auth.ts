// JWT
import { sign, verify } from 'jsonwebtoken';

// GraphQL
import { MiddlewareFn } from 'type-graphql';
import { AuthenticationError } from 'apollo-server-express';

// Server
import { Response } from 'express';

// Local
import { User } from '../entity/User';
import { GraphqlServerContext } from '../interfaces/GraphqlServerContext';
import { AuthPayload } from 'src/interfaces/AuthPayload';

export const accessSecret = process.env.JWT_ACCESS_SECRET || 'TMP_ACCESS_SECRET';

export const refreshSecret = process.env.JWT_REFRESH_SECRET || 'TMP_REFRESH_SECRET';

export const createAccessToken = (user: User) => {
  return sign({ id: user.id, username: user.username, role: user.role.roleName }, accessSecret, {
    expiresIn: '15m',
  });
};

export const createRefreshToken = (user: User) => {
  return sign(
    { id: user.id, username: user.username, role: user.role.roleName, tokenVersion: user.tokenVersion },
    refreshSecret,
    {
      expiresIn: '7d',
    },
  );
};

export const isAuth: MiddlewareFn<GraphqlServerContext> = ({ context }, next) => {
  const authorization = context.req.headers['authorization'];

  if (!authorization) {
    throw new AuthenticationError('Not authenticated');
  }

  try {
    const token = authorization.split(' ')[1];
    const payload = verify(token, accessSecret);
    context.payload = payload as AuthPayload;
  } catch {
    throw new AuthenticationError('Not authenticated');
  }

  return next();
};

export const sendRefreshToken = (res: Response, token: string) => {
  res.cookie('URT', token, {
    httpOnly: true,
    path: '/refresh_token',
  });
};
