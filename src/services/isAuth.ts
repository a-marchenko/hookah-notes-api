import { MiddlewareFn } from 'type-graphql';
import { GraphqlServerContext } from '../interfaces/GraphqlServerContext';
import { AuthenticationError } from 'apollo-server-express';
import { verify } from 'jsonwebtoken';
import { accessSecret } from './auth';
import { AuthPayload } from '../interfaces/AuthPayload';

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
