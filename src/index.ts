import 'reflect-metadata';
import 'dotenv/config';

// Typeorm
import { createConnection } from 'typeorm';

// Server
import express from 'express';

// GraphQL
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

// Utils
import chalk from 'chalk';

// Local
import { ApolloServerContext } from './interfaces/ApolloServerContext';
import { UserResolver } from './resolvers/UserResolver';

// ----------------------------------------------------------------------------

// Config

const PORT = process.env.PORT || '8000';

/* App starts here */

const startServer = async () => {
  await createConnection();

  const app = express();

  const apollo = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }: ApolloServerContext) => ({ req, res }),
    introspection: true,
    playground: true,
  });

  apollo.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(
      chalk.magentaBright('\n🚀  Server ready at: ') +
        chalk.whiteBright(`http://localhost:${PORT}${apollo.graphqlPath}\n`),
    );
  });
};

startServer();
