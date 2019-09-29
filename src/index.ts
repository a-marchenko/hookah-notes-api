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
import { User } from './entity/User';
import { Role } from './entity/Role';
import { Follow } from './entity/Follow';
import { Note } from './entity/Note';
import { Tobacco } from './entity/Tobacco';
import { Tag } from './entity/Tag';
import { Like } from './entity/Like';
import { AuthPayload } from './interfaces/AuthPayload';
import { UserResolver } from './resolvers/User/Resolvers';
import { FollowResolver } from './resolvers/Follow/Resolvers';
import { NoteResolver } from './resolvers/Note/Resolvers';
import { TagResolver } from './resolvers/Tag/Resolvers';
import { TobaccoResolver } from './resolvers/Tobacco/Resolvers';
import { LikeResolver } from './resolvers/Like/Resolvers';

// ----------------------------------------------------------------------------

// Config

const CLIENT_URI = process.env.CLIENT_URI || 'https://localhost:8443';
const PORT = process.env.SERVER_PORT || '8000';

const entities = [User, Role, Follow, Note, Tobacco, Tag, Like];
const resolvers = [UserResolver, FollowResolver, NoteResolver, TagResolver, TobaccoResolver, LikeResolver];

/* App starts here */

const startServer = async () => {
  if (process.env.DB_HOST) {
    await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: 'hn_owner',
      password: 'owner_password',
      database: 'hn',
      synchronize: true,
      logging: false,
      entities: entities,
      migrations: ['migration/*.js'],
      subscribers: ['subscriber/*.js'],
    });
  } else {
    await createConnection();
  }

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
      resolvers: resolvers,
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
