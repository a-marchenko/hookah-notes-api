/* eslint-disable prettier/prettier */
// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';

/* JWT */
import { verify } from 'jsonwebtoken';

/* Type ORM */
import { createConnection } from 'typeorm';

// Express web server
import * as express from 'express';

// Cookie parser
import * as cookieParser from 'cookie-parser';

// Apollo Server
import { ApolloServer } from 'apollo-server-express';

/* Local */
import { typeDefs, resolvers } from './schema/User';
import { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, createTokens } from './services/auth';
import { User } from './db/entities/User';

// ----------------------------------------------------------------------------

/* Config */

interface ServerConfig {
  ssl: boolean,
  port: number,
  hostname: string,
}

const configurations = {
  // Note: You may need sudo to run on port 443
  production: { ssl: true, port: 443, hostname: 'example.com' },
  development: { ssl: true, port: 8000, hostname: 'localhost' },
};
const environment = process.env.NODE_ENV || 'development';
const config: ServerConfig = configurations[environment];

/* App starts here */

const startServer = async () => {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }: any) => ({ req, res }),
  });

  await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'hn_owner',
    password: 'SuperCoolApp',
    database: 'hn',
    synchronize: true,
    logging: false,
    entities: ['db/entities/**/*.ts'],
    migrations: ['db/migrations/**/*.ts'],
    subscribers: ['db/subscribers/**/*.ts'],
    cli: {
      entitiesDir: 'src/server/db/entities',
      migrationsDir: 'src/server/db/migrations',
      subscribersDir: 'src/server/db/subscribers',
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
  server.listen({ port: config.port }, () =>
    console.log(
      '🚀 Server ready at',
      `http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${apollo.graphqlPath}`,
    ),
  );
};

startServer();