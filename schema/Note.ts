import { gql, IResolvers, UserInputError, AuthenticationError } from 'apollo-server-express';
import { getRepository, In } from 'typeorm';
import { Note } from '../db/entities/Note';
import { User } from '../db/entities/User';
import { Tobacco } from '../db/entities/Tobacco';
import { Tag } from '../db/entities/Tag';

import * as lodash from 'lodash';

export const typeDefs = gql`
  type Note {
    id: ID!
    title: String!
    author: User!
    duration: Int!
    strength: Int!
    tobaccos: [Tobacco]!
    proportions: [Int]!
    description: String
    tags: [Tag]
    likes: [Like]
    likeCount: Int!
  }

  input createNoteInput {
    title: String!
    duration: Int!
    strength: Int!
    tobaccos: [Int]!
    proportions: [Int]!
    description: String!
    tags: [Int]!
  }

  input updateNoteInput {
    id: ID!
    title: String!
    duration: Int!
    strength: Int!
    tobaccos: [Int]!
    proportions: [Int]!
    description: String!
    tags: [Int]!
  }

  extend type Query {
    getNoteById(id: ID!): Note
    getNotes: [Note]
    getFavoriteNotes: [Note]
  }

  extend type Mutation {
    createNote(input: createNoteInput): Note
    updateNote(input: updateNoteInput): Note
    deleteNote(id: ID!): Boolean!
  }
`;

export const resolvers: IResolvers = {
  Query: {
    getNoteById: (_, { id }) => {
      return Note.findOne(id, { relations: ['author', 'tobaccos', 'tags', 'likes'] });
    },
    getNotes: () => {
      return Note.find({ relations: ['author', 'tobaccos', 'tags', 'likes'] });
    },
    getFavoriteNotes: async (_, __, { req }) => {
      const noteRepository = getRepository(Note);

      const notes = noteRepository
        .createQueryBuilder('n')
        .innerJoin('n.likes', 'l', 'l."userId" = :userId', { userId: req.userId })
        .leftJoinAndSelect('n.author', 'a')
        .leftJoinAndSelect('n.tobaccos', 'tb')
        .leftJoinAndSelect('n.tags', 'tg')
        .getMany();

      return notes;
    },
  },
  Mutation: {
    createNote: async (_, { input }, { req }) => {
      /*
        Beginning of checks
      */
      // User must be logged in
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      // Values of duration should be in the range from 0 to 5
      if (!(input.duration <= 5 && input.duration > 0)) {
        throw new UserInputError('Invalid Duration value');
      }

      // Values of strength should be in the range from 0 to 5
      if (!(input.strength <= 5 && input.strength > 0)) {
        throw new UserInputError('Invalid Strength value');
      }

      // Mix may contain from 1 to 4 unique tobaccos
      if (input.tobaccos.length < 1 && input.tobaccos.length > 4) {
        throw new UserInputError('Invalid amount of Tobaccos');
      }

      // The sum of the proportions should be equal to 100%,
      // regardless of the number of elements in the mix
      if (lodash.sum(lodash.values(input.proportions)) !== 100) {
        throw new UserInputError('Invalid sum of the Proportions');
      }

      // Not may contain up to 5 tags
      if (input.tags.length > 4) {
        throw new UserInputError('Invalid amount of Tags');
      }
      /*
        End of checks
      */

      const author = await User.findOne(req.userId);

      const tobaccos = await Tobacco.find({
        where: {
          id: In(input.tobaccos),
        },
      });

      const tags = await Tag.find({
        where: {
          id: In(input.tags),
        },
      });

      const note = Note.create({
        title: input.title,
        author,
        duration: input.duration,
        strength: input.strength,
        tobaccos,
        proportions: input.proportions,
        description: input.description,
        tags,
      });

      const noteSaved = await Note.save(note);

      return noteSaved;
    },
    updateNote: async (_, { input }, { req }) => {
      // User must be logged in
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      let note = await Note.findOne({
        where: { id: input.id, author: req.userId },
        relations: ['author', 'tobaccos', 'tags'],
      });

      /*
        Beginning of checks
      */
      // UserId must be equal to authorId of the Note
      if (!note) {
        throw new UserInputError('Note not found');
      }

      // Values of duration should be in the range from 0 to 5
      if (!(input.duration <= 5 && input.duration > 0)) {
        throw new UserInputError('Invalid Duration value');
      }

      // Values of strength should be in the range from 0 to 5
      if (!(input.strength <= 5 && input.strength > 0)) {
        throw new UserInputError('Invalid Strength value');
      }

      // Mix may contain from 1 to 4 unique tobaccos
      if (input.tobaccos.length < 1 && input.tobaccos.length > 4) {
        throw new UserInputError('Invalid amount of Tobaccos');
      }

      // The sum of the proportions should be equal to 100%,
      // regardless of the number of elements in the mix
      if (lodash.sum(lodash.values(input.proportions)) !== 100) {
        throw new UserInputError('Invalid sum of the Proportions');
      }

      // Not may contain up to 5 tags
      if (input.tags.length > 4) {
        throw new UserInputError('Invalid amount of Tags');
      }
      /*
        End of checks
      */

      const tobaccos = await Tobacco.find({
        where: {
          id: In(input.tobaccos),
        },
      });

      const tags = await Tag.find({
        where: {
          id: In(input.tags),
        },
      });

      note.title = input.title;
      note.duration = input.duration;
      note.strength = input.strength;
      note.tobaccos = tobaccos;
      note.proportions = input.proportions;
      note.description = input.description;
      note.tags = tags;

      const noteUpdated = await Note.save(note);

      return noteUpdated;
    },
    deleteNote: async (_, { id }, { req }) => {
      // User must be logged in
      if (!req.userId) {
        throw new AuthenticationError('You must be logged in');
      }

      const note = await Note.findOne({ where: { id: id, author: req.userId } });

      // UserId must be equal to authorId of the Note
      if (!note) {
        throw new UserInputError('Note not found');
      }

      Note.remove(note);

      return true;
    },
  },
};
