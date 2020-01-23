import Maybe from 'graphql/tsutils/Maybe';
import { GraphQLSchema, graphql } from 'graphql';
import { buildSchema } from 'type-graphql';

import { UserResolver } from '../../resolvers/User/Resolvers';
import { FollowResolver } from '../../resolvers/Follow/Resolvers';
import { NoteResolver } from '../../resolvers/Note/Resolvers';
import { TagResolver } from '../../resolvers/Tag/Resolvers';
import { LikeResolver } from '../../resolvers/Like/Resolvers';
import { TestContext } from 'src/interfaces/GraphqlServerContext';

export const resolvers = [UserResolver, FollowResolver, NoteResolver, TagResolver, LikeResolver];

interface Options {
  source: string;
  variableValues?: Maybe<{
    [key: string]: any;
  }>;
  contextValue?: TestContext;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, variableValues, contextValue }: Options) => {
  if (!schema) {
    schema = await buildSchema({ resolvers: resolvers });
  }
  return graphql({
    schema,
    source,
    variableValues,
    contextValue,
  });
};
