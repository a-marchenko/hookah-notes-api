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
  note(@Arg('id') id: number) {
    return Note.findOne(id, { relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @Query(() => [Note])
  allNotes() {
    return Note.find({ relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @Query(() => [Note])
  userNotes(@Arg('userId') userId: number) {
    return Note.find({ where: { author: userId }, relations: ['author', 'tobaccos', 'tags', 'likes'] });
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  favoriteNotes(@Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = noteRepository
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
          tobacco = await Tobacco.create({ brand: item.brand, name: item.name }).save();
          return tobacco;
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
            tag = await Tag.create({
              title: item.title,
              textColor: JSON.stringify(item.textColorInput),
              backgroundColor: JSON.stringify(item.backgroundColorInput),
            }).save();
            return tag;
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
      console.log(item.name);
      await Tobacco.update(item.id, { brand: item.brand, name: item.name });
    });

    if (note.tags !== undefined && input.tagsInput !== undefined) {
      input.tagsInput.forEach(async item => {
        console.log(item.title);
        await Tag.update(item.id, {
          title: item.title,
          textColor: JSON.stringify(item.textColorInput),
          backgroundColor: JSON.stringify(item.backgroundColorInput),
        });
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
