import { Request, Response } from 'express';
import { AuthPayload } from './AuthPayload';

export interface GraphqlServerContext {
  req: Request;
  res: Response;
  payload: AuthPayload;
}
