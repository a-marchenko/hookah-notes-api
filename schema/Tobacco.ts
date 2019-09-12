import { gql, IResolvers } from 'apollo-server-express';

import { Tobacco } from '../db/entities/Tobacco';

export const typeDefs = gql`
  type Tobacco {
    id: ID!
    name: String!
    brand: String!
  }

  extend type Query {
    getTobaccoById(id: ID!): Tobacco
    getTobaccosByName(name: String!): [Tobacco]
    getTobaccosByBrand(brand: String!): [Tobacco]
  }

  extend type Mutation {
    createTobacco(name: String!, brand: String!): Tobacco
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getTobaccoById: (_, { id }) => {
      return Tobacco.findOne(id);
    },
    getTobaccosByName: (_, { name }) => {
      return Tobacco.find({ where: { name: name } });
    },
    getTobaccosByBrand: (_, { brand }) => {
      return Tobacco.find({ where: { brand: brand } });
    },
  },
  Mutation: {
    createTobacco: async (_, { name, brand }) => {
      const tobacco = await Tobacco.create({ name, brand }).save();
      return tobacco;
    },
  },
};
