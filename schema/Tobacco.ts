import { gql, IResolvers } from 'apollo-server-express';

import { Tobacco } from '../db/entities/Tobacco';

export const typeDefs = gql`
  type Tobacco {
    id: ID!
    name: String!
    brand: String!
  }

  type Query {
    getTobaccoById(id: ID!): Tobacco
    getTobaccoByName(name: String!): Tobacco[]
    getTobaccoByBrand(brand: String!): Tobacco[]
  }

  type Mutation {
    createTobacco(name: String!, brand: String!): Tobacco
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getNoteTobaccoById: (_, { id }) => {
      return Tobacco.findOne(id);
    },
    getTobaccoByName: (_, { name }) => {
      return Tobacco.find({ where: { name: name } });
    },
    getTobaccoByBrand: (_, { brand }) => {
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
