import { gql, IResolvers } from 'apollo-server-express';

import { Tag } from '../db/entities/Tag';

export const typeDefs = gql`
  type Tag {
    id: ID!
    name: String!
    colorText: String!
    colorBackground: String!
  }

  type Query {
    getTagById(id: ID!): Tag!
    getTagByName(name: String!): Tag[]!
  }

  type Mutation {
    createTag(name: String!, colorText: String!, colorBackground: String!): Tag!
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getNoteTobaccoById: (_, { id }) => {
      return Tag.findOne(id);
    },
    getTagByName: (_, { name }) => {
      return Tag.find({ where: { name: name } });
    },
  },
  Mutation: {
    createTag: async (_, { name, colorText, colorBackground }) => {
      const tag = await Tag.create({ name, colorText, colorBackground }).save();
      return tag;
    },
  },
};
