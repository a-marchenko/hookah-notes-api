import { gql, IResolvers, AuthenticationError, UserInputError } from 'apollo-server-express';
import * as bcrypt from 'bcrypt';

import { User } from '../db/entities/User';
import { createTokens } from '../services/auth';

export const typeDefs = gql`
  type User {
    id: ID!
    username: String!
  }

  type AuthResponse {
    accessToken: String
    user: User
  }

  extend type Query {
    getCurrentUser: User
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthResponse
    signup(username: String!, email: String!, password: String!): AuthResponse
    invalidateTokens: Boolean!
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getCurrentUser: (_, __, { req }) => {
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      return User.findOne(req.userId);
    },
  },
  Mutation: {
    signup: async (_, { username, email, password }, { res }) => {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      }).save();

      const { accessToken, refreshToken } = createTokens(user);

      res.cookie('refresh-token', refreshToken, {
        expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });
      res.cookie('access-token', accessToken, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });

      return {
        accessToken,
        user,
      };
    },
    login: async (_, { email, password }, { res }) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new UserInputError('Invalid Email or Password');
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new UserInputError('Invalid Email or Password');
      }

      const { accessToken, refreshToken } = createTokens(user);

      res.cookie('refresh-token', refreshToken, {
        expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });
      res.cookie('access-token', accessToken, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });

      return {
        accessToken,
        user,
      };
    },
    invalidateTokens: async (_, __, { req }) => {
      if (!req.userId) {
        return false;
      }

      const user = await User.findOne(req.userId);
      if (!user) {
        return false;
      }
      user.authCount++;
      await user.save();

      return true;
    },
  },
};
