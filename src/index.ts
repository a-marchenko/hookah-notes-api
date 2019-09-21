import 'reflect-metadata';
import 'dotenv/config';

// Typeorm
import { createConnection } from 'typeorm';

// Server
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// JWT
import { verify } from 'jsonwebtoken';

// GraphQL
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

// Utils
import chalk from 'chalk';

// Local
import { refreshSecret, createAccessToken, sendRefreshToken, createRefreshToken } from './services/auth';
import { GraphqlServerContext } from './interfaces/GraphqlServerContext';
import { UserResolver } from './resolvers/UserResolver';
import { User } from './entity/User';
import { AuthPayload } from './interfaces/AuthPayload';

// ----------------------------------------------------------------------------

// Config

const CLIENT_URI = process.env.CLIENT_URI || 'https://localhost:8443';
const PORT = process.env.PORT || '8000';

/* App starts here */

const startServer = async () => {
  await createConnection();

  const app = express();

  app.use(
    cors({
      origin: CLIENT_URI,
      credentials: true,
    }),
  );

  app.use(cookieParser());

  app.post('/refresh_token', async (req, res) => {
    const token = req.cookies.URT;

    if (!token) {
      return res.send({ ok: false, accessToken: '' });
    }

    let payload: AuthPayload;
    try {
      payload = verify(token, refreshSecret) as AuthPayload;
    } catch (e) {
      console.log(chalk.redBright(e));
      return res.send({ ok: false, accessToken: '' });
    }

    const user = await User.findOne(payload.id);

    if (!user) {
      return res.send({ ok: false, accessToken: '' });
    }

    if (!(user.tokenVersion !== payload.tokenVersion)) {
      return res.send({ ok: false, accessToken: '' });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  const apollo = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }: GraphqlServerContext) => ({ req, res }),
    introspection: true,
    playground: true,
  });

  apollo.applyMiddleware({ app, cors: false });

  app.listen(PORT, () => {
    console.log(
      chalk.magentaBright('\n🚀  Server ready at: ') +
        chalk.whiteBright(`http://localhost:${PORT}${apollo.graphqlPath}\n`),
    );
  });
};

startServer();
