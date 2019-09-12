import { gql, IResolvers } from 'apollo-server-express';

import { Tag } from '../db/entities/Tag';

export const typeDefs = gql`
  type Tag {
    id: ID!
    name: String!
    colorText: String!
    colorBackground: String!
    notes: [Note]
  }

  extend type Query {
    getTagById(id: ID!): Tag!
    getTagsByName(name: String!): [Tag]!
  }

  extend type Mutation {
    createTag(name: String!, colorText: String!, colorBackground: String!): Tag!
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getTagById: (_, { id }) => {
      return Tag.findOne(id);
    },
    getTagsByName: (_, { name }) => {
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
