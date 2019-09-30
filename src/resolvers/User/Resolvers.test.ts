/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Connection } from 'typeorm';
import { testConnection } from '../../utils/test/testConnection';
import { redis } from '../../redis';
import { graphqlCall } from '../../utils/test/graphqlCall';
import faker from 'faker';
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';

import { User } from '../../entity/User';
import { createAccessToken } from '../../services/auth';

let connection: Connection;

beforeAll(async () => {
  connection = await testConnection();
  if (redis.status == 'end') {
    await redis.connect();
  }
});

afterAll(async () => {
  await connection.close();
  redis.disconnect();
});

const signupMutation = `
mutation Signup($input: SignupInput!) {
  signup(input: $input)
}
`;

const loginMutation = `
mutation Login($input: LoginInput!) {
  login(input: $input){
    accessToken
  }
}
`;

const currentUserQuery = `
query CurrentUser {
  currentUser {
    username
  }
}
`;

let req: Request;
let res: Response;

describe('User resolvers', () => {
  beforeEach(() => {
    req = new Request();
    res = new Response();
  });

  afterEach(() => {
    req.resetMocked();
    res.resetMocked();
  });

  it('signup', async () => {
    const user = {
      username: faker.name.firstName(),
      email: 'fjfjhgfjhfgfghf@mail.com',
      password: '546565',
    };

    const response = await graphqlCall({
      source: signupMutation,
      variableValues: {
        input: user,
      },
    });

    expect(response).toMatchObject({
      data: {
        signup: true,
      },
    });

    const dbUser = await User.findOne({ where: { email: user.email } });

    expect(dbUser).toBeDefined();
    expect(dbUser!.confirmed).toBeFalsy();
  });

  it('login', async () => {
    const dbUser = await User.findOne({ where: { email: 'fjfjhgfjhfgfghf@mail.com' } });
    dbUser!.confirmed = true;
    await dbUser!.save();

    console.table(dbUser);

    const responseWithUsername = await graphqlCall({
      source: loginMutation,
      variableValues: {
        input: {
          login: dbUser!.username,
          password: '546565',
        },
      },
      contextValue: {
        req,
        res,
      },
    });

    const responseWithEmail = await graphqlCall({
      source: loginMutation,
      variableValues: {
        input: {
          login: dbUser!.email,
          password: '546565',
        },
      },
      contextValue: {
        req,
        res,
      },
    });

    console.table(responseWithUsername.errors);
    console.table(responseWithUsername.data!.login);
    expect(typeof responseWithUsername.data!.login.accessToken).toBe('string');

    console.table(responseWithEmail.errors);
    console.table(responseWithEmail.data!.login);
    expect(typeof responseWithEmail.data!.login.accessToken).toBe('string');
  });

  it('currentUser', async () => {
    const dbUser = await User.findOne({
      where: { email: 'fjfjhgfjhfgfghf@mail.com' },
      relations: ['role'],
    });

    const token = createAccessToken(dbUser!);

    console.table(dbUser);

    req.setHeaders('authorization', `bearer ${token}`);

    const response = await graphqlCall({
      source: currentUserQuery,
      contextValue: {
        req,
        res,
      },
    });

    console.table(response.errors);
    expect(response).toMatchObject({
      data: {
        currentUser: {
          username: dbUser!.username,
        },
      },
    });
  });
});
