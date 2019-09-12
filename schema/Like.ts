import { gql, IResolvers, AuthenticationError, UserInputError } from 'apollo-server-express';

import { Like } from '../db/entities/Like';
import { Note } from '../db/entities/Note';
import { User } from '../db/entities/User';

export const typeDefs = gql`
  type Like {
    id: ID!
    user: User
    note: Note
  }

  extend type Query {
    getLikeById(id: ID!): Like!
    getLikesByUserId: [Like]!
    getLikesByNoteId(noteId: ID!): [Like]!
  }

  extend type Mutation {
    createLike(noteId: ID!): Like!
    deleteLike(id: ID!): Boolean!
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getLikeById: (_, { id }) => {
      return Like.findOne(id, { relations: ['user', 'note'] });
    },
    getLikesByUserId: (_, __, { req }) => {
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      return Like.find({ where: { user: req.userId }, relations: ['user', 'note'] });
    },
    getLikesByNoteId: (_, { noteId }) => {
      return Like.find({ where: { note: noteId }, relations: ['user', 'note'] });
    },
  },
  Mutation: {
    createLike: async (_, { noteId }, { req }) => {
      // User must be logged in
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      let note = await Note.findOne(noteId);

      // Check for Note existance
      if (!note) {
        throw new UserInputError('Note not found');
      }

      const existingLike = await Like.findOne({ where: { user: req.userId, note: noteId } });

      // Like with same userId and same noteId should not be found
      if (existingLike) {
        throw new UserInputError('Like already exists');
      }

      const user = await User.findOne(req.userId);

      const like = await Like.create({ user, note }).save();

      note.likeCount++;
      Note.save(note);

      return like;
    },
    deleteLike: async (_, { id }, { req }) => {
      // User must be logged in
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      const like = await Like.findOne(id, { where: { user: req.userId }, relations: ['note'] });

      // Like should exist and belong to user
      if (!like) {
        throw new UserInputError('Like not found');
      }

      let note = await Note.findOne(like.note.id);

      if (!note) {
        throw new UserInputError('Note not found');
      }

      note.likeCount--;

      Note.save(note);

      Like.remove(like);

      return true;
    },
  },
};
