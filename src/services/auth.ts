// JWT
import { sign, verify } from 'jsonwebtoken';

// GraphQL
import { MiddlewareFn } from 'type-graphql';
import { AuthenticationError } from 'apollo-server-express';

// Server
import { Request } from 'express';

// Local
import { User } from '../entity/User';
import { GraphqlServerContext } from '../interfaces/GraphqlServerContext';
import { AuthPayload } from 'src/interfaces/AuthPayload';
import chalk from 'chalk';

export const accessSecret = process.env.JWT_ACCESS_SECRET || 'TMP_ACCESS_SECRET';

export const refreshSecret = process.env.JWT_REFRESH_SECRET || 'TMP_REFRESH_SECRET';

export const createAccessToken = (user: User) => {
  return sign({ id: user.id, username: user.username, role: user.role.roleName }, accessSecret, {
    expiresIn: '1d',
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

export const refreshTokens = async (req: Request) => {
  let ok: boolean;
  let accessToken: string;
  let refreshToken: string;
  let language: string;

  let token: string;

  const tokenHeader = req.headers['refresh_tokens'] as string;
  if (tokenHeader) {
    token = tokenHeader.split(' ')[1];

    let payload: AuthPayload;
    try {
      payload = verify(token, refreshSecret) as AuthPayload;

      const user = await User.findOne(payload.id, { relations: ['role'] });
      if (user) {
        language = user.language;
        if (user.tokenVersion === payload.tokenVersion) {
          ok = true;
          accessToken = createAccessToken(user);
          refreshToken = createRefreshToken(user);
        } else {
          console.log(
            chalk.redBright('Wrong token version:\nUV: ' + user.tokenVersion + ' ' + 'PV: ' + payload.tokenVersion),
          );
          ok = false;
          accessToken = '';
          refreshToken = '';
        }
      } else {
        console.log(chalk.redBright('User not found'));
        ok = false;
        accessToken = '';
        refreshToken = '';
        language = 'en';
      }
    } catch (e) {
      console.log(chalk.redBright(e));
      ok = false;
      accessToken = '';
      refreshToken = '';
      language = 'en';
    }
  } else {
    ok = false;
    accessToken = '';
    refreshToken = '';
    language = 'en';
  }

  return {
    ok,
    accessToken,
    refreshToken,
    language,
  };
};

export const invalidateTokens = async (req: Request) => {
  let ok = false;
  let message = '';

  let token: string;

  const tokenHeader = req.headers['invalidate_tokens'] as string;
  if (tokenHeader) {
    token = tokenHeader.split(' ')[1];

    let payload: AuthPayload;
    try {
      payload = verify(token, refreshSecret) as AuthPayload;

      const user = await User.findOne(payload.id);
      if (user) {
        try {
          await User.update(user.id, { tokenVersion: user.tokenVersion + 1 });
          console.log(chalk.greenBright('User logged out successfully'));
          ok = true;
          message = user.language === 'ru' ? 'Выход выполнен успешно' : 'Successfully logged out';
        } catch (err) {
          console.log(chalk.redBright('Something went wrong:\n' + err));
          ok = false;
          message = user.language === 'ru' ? 'Что-то пошло не так :(' : 'Something went wrong :(';
        }
      } else {
        console.log(chalk.redBright('User not found'));
        ok = false;
        message = 'User not found';
      }
    } catch (e) {
      console.log(chalk.redBright(e));
      ok = false;
      message = 'Something went wrong :(';
    }
  } else {
    ok = false;
    message = 'Invalid token';
  }

  return {
    ok,
    message,
  };
};
