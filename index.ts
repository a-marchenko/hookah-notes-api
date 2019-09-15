/* eslint-disable prettier/prettier */
// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import https from 'https';
import http from 'http';
import fs from 'fs';

/* JWT */
import { verify } from 'jsonwebtoken';

/* Type ORM */
import { createConnection } from 'typeorm';

// Express web server
import express from 'express';

// Cookie parser
import cookieParser from 'cookie-parser';

// GraphQL
import { makeExecutableSchema } from 'graphql-tools';

// Apollo Server
import { ApolloServer } from 'apollo-server-express';

// Other
import { merge } from 'lodash';
import chalk from 'chalk';

/* Local */
import { typeDefs as UserTypeDefs, resolvers as UserResolvers } from './schema/User';
import { typeDefs as TobaccoTypeDefs, resolvers as TobaccoResolvers } from './schema/Tobacco';
import { typeDefs as TagTypeDefs, resolvers as TagResolvers } from './schema/Tag';
import { typeDefs as NoteTypeDefs, resolvers as NoteResolvers } from './schema/Note';
import { typeDefs as LikeTypeDefs, resolvers as LikeResolvers } from './schema/Like';
import { User } from './db/entities/User';
import { Note } from './db/entities/Note';
import { Tobacco } from './db/entities/Tobacco';
import { Tag } from './db/entities/Tag';
import { Like } from './db/entities/Like';
import { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, createTokens } from './services/auth';

// ----------------------------------------------------------------------------

/* Config */

interface ServerConfig {
  ssl: boolean,
  port: string,
  hostname: string,
}

const PORT = process.env.PORT || '8000';

const configurations = {
  // Note: You may need sudo to run on port 443
  production: { ssl: true, port: 443, hostname: 'example.com' },
  development: { ssl: false, port: PORT, hostname: 'localhost' },
};
const environment = 'development';
const config: ServerConfig = configurations[environment];

/* App starts here */

const typeDefs = `
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

const resolvers = {
    Query: {},
    Mutation: {},
};

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, UserTypeDefs, TobaccoTypeDefs, TagTypeDefs, NoteTypeDefs, LikeTypeDefs],
  resolvers: merge(resolvers, UserResolvers, TobaccoResolvers, TagResolvers, NoteResolvers, LikeResolvers)
});

const startServer = async () => {
  const apollo = new ApolloServer({
    schema,
    context: ({ req, res }: any) => ({ req, res }),
    introspection: true,
    playground: true,
  });

  await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [User, Note, Tobacco, Tag, Like],
    migrations: ['db/migrations/*.js'],
    subscribers: ['db/subscribers/*.js'],
    cli: {
      entitiesDir: 'db/entities',
      migrationsDir: 'db/migrations',
      subscribersDir: 'db/subscribers',
    },
    extra: {
      ssl: true
    },
  });

  const app = express();

  app.use(cookieParser());

  app.use(async (req: any, res, next) => {
    const refreshToken = req.cookies['refresh-token'];
    const accessToken = req.cookies['access-token'];
    if (!refreshToken && !accessToken) {
      return next();
    }

    try {
      const data = verify(accessToken, ACCESS_TOKEN_SECRET) as any;
      req.userId = data.userId;
      return next();
    } catch {}

    if (!refreshToken) {
      return next();
    }

    let data;

    try {
      data = verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
    } catch {
      return next();
    }

    const user = await User.findOne(data.userId);
    // Token has been invalidated
    if (!user || user.authCount !== data.authCount) {
      return next();
    }

    const tokens = createTokens(user);

    res.cookie('refresh-token', tokens.refreshToken, {
      expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      secure: true,
      httpOnly: false,
    });
    res.cookie('access-token', tokens.accessToken, {
      expires: new Date(new Date().getTime() + 15 * 60 * 1000),
      secure: true,
      httpOnly: false,
    });
    req.userId = user.id;

    next();
  });

  apollo.applyMiddleware({ app });

  type Server = http.Server | https.Server;

  let server: Server;

  if (config.ssl) {
    // Assumes certificates are in .ssl folder from package root.
    server = https.createServer(
      {
        key: fs.readFileSync(`./ssl/${environment}/server.key`),
        cert: fs.readFileSync(`./ssl/${environment}/server.crt`),
      },
      app,
    );
  } else {
    server = http.createServer(app);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  server.listen(PORT, () =>
    console.log(chalk.magentaBright(
      '🚀 Server ready at',
      `http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${apollo.graphqlPath}`,
    )),
  );
};

startServer();
