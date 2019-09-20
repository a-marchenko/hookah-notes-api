import { Request, Response } from 'express';

export interface ApolloServerContext {
  req: Request;
  res: Response;
}
