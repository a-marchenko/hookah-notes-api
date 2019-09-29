import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { getRepository } from 'typeorm';
import { AddNoteInput, UpdateNoteInput } from './CustomTypes';
import { Note } from '../../entity/Note';
import { User } from '../../entity/User';
import { Tobacco } from '../../entity/Tobacco';
import { Tag } from '../../entity/Tag';
import { UserInputError, ApolloError, ForbiddenError } from 'apollo-server-express';
import { isAuth } from '../../services/auth';
import { GraphqlServerContext } from '../../interfaces/GraphqlServerContext';

@Resolver()
export class NoteResolver {
  @Query(() => Note)
  async note(@Arg('id') id: number) {
    return await Note.findOne(id, { relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @Query(() => [Note])
  async allNotes() {
    return await Note.find({ relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @Query(() => [Note])
  async userNotes(@Arg('userId') userId: number) {
    return await Note.find({ where: { author: userId }, relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async favoriteNotes(@Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoin('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async addNote(@Arg('input') input: AddNoteInput, @Ctx() { payload }: GraphqlServerContext) {
    const author = await User.findOne(payload.id);

    const tobaccos = await Promise.all(
      input.tobaccosInput.map(async item => {
        let tobacco = await Tobacco.findOne({ where: { brand: item.brand, name: item.name } });
        if (tobacco) {
          return tobacco;
        } else {
          try {
            tobacco = await Tobacco.create({ brand: item.brand, name: item.name }).save();
            return tobacco;
          } catch {
            throw new ApolloError('Something went wrong');
          }
        }
      }),
    );

    let tags = undefined;

    if (input.tagsInput) {
      tags = await Promise.all(
        input.tagsInput.map(async item => {
          let tag = await Tag.findOne({
            where: {
              title: item.title,
              textColor: JSON.stringify(item.textColorInput),
              backgroundColor: JSON.stringify(item.backgroundColorInput),
            },
          });
          if (tag) {
            return tag;
          } else {
            try {
              tag = await Tag.create({
                title: item.title,
                textColor: JSON.stringify(item.textColorInput),
                backgroundColor: JSON.stringify(item.backgroundColorInput),
              }).save();
              return tag;
            } catch {
              throw new ApolloError('Something went wrong');
            }
          }
        }),
      );
    }

    try {
      await Note.create({
        title: input.title,
        author,
        duration: input.duration,
        strength: input.strength,
        tobaccos,
        proportions: input.proportions,
        description: input.description,
        tags,
      }).save();
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateNote(@Arg('input') input: UpdateNoteInput, @Ctx() { payload }: GraphqlServerContext) {
    const note = await Note.findOne(input.id, { relations: ['author', 'tobaccos', 'tags'] });

    if (!note) {
      throw new UserInputError('Note not found');
    } else if (note.author.id !== payload.id) {
      throw new ForbiddenError('Permission denied');
    }

    input.tobaccosInput.forEach(async item => {
      try {
        await Tobacco.update(item.id, { brand: item.brand, name: item.name });
      } catch {
        throw new ApolloError('Something went wrong');
      }
    });

    if (note.tags !== undefined && input.tagsInput !== undefined) {
      input.tagsInput.forEach(async item => {
        try {
          await Tag.update(item.id, {
            title: item.title,
            textColor: JSON.stringify(item.textColorInput),
            backgroundColor: JSON.stringify(item.backgroundColorInput),
          });
        } catch {
          throw new ApolloError('Something went wrong');
        }
      });
    }

    note.title = input.title;
    note.duration = input.duration;
    note.strength = input.strength;
    note.proportions = input.proportions;
    note.description = input.description ? input.description : note.description;

    try {
      await Note.save(note);
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }
}
