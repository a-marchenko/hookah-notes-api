import Maybe from 'graphql/tsutils/Maybe';
import { GraphQLSchema, graphql } from 'graphql';
import { buildSchema } from 'type-graphql';

import { UserResolver } from '../../resolvers/User/Resolvers';
import { FollowResolver } from '../../resolvers/Follow/Resolvers';
import { NoteResolver } from '../../resolvers/Note/Resolvers';
import { TagResolver } from '../../resolvers/Tag/Resolvers';
import { TobaccoResolver } from '../../resolvers/Tobacco/Resolvers';
import { LikeResolver } from '../../resolvers/Like/Resolvers';

export const resolvers = [UserResolver, FollowResolver, NoteResolver, TagResolver, TobaccoResolver, LikeResolver];

interface Options {
  source: string;
  variableValues?: Maybe<{
    [key: string]: any;
  }>;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, variableValues }: Options) => {
  if (!schema) {
    schema = await buildSchema({ resolvers: resolvers });
  }
  return graphql({
    schema,
    source,
    variableValues,
  });
};
