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
  @UseMiddleware(isAuth)
  @Query(() => Note)
  async note(@Arg('id') id: number, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const note = await noteRepository
      .createQueryBuilder('n')
      .where('n.id = :id', { id: id })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getOne();

    return note;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async allNotes(@Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .orderBy('n.id', 'DESC')
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByUsername(@Arg('username') username: string, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.author', 'a', 'a.username = :username', { username: username })
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async favoriteNotes(@Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByTitle(@Arg('duration') title: string, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .where('n.title = :title', { title: title })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByDuration(@Arg('duration') duration: number, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .where('n.duration = :duration', { duration: duration })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByStrength(@Arg('strength') strength: number, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .where('n.strength = :strength', { strength: strength })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByTagTitle(@Arg('tagTitle') tagTitle: string, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.tags', 'tg', 'tg.title = :title', { title: tagTitle })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByTobaccoBrand(@Arg('tobaccoBrand') tobaccoBrand: string, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.tobaccos', 'tb', 'tb.brand = :brand', { brand: tobaccoBrand })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
      .getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Query(() => [Note])
  async notesByTobaccoName(@Arg('tobaccoName') tobaccoName: string, @Ctx() { payload }: GraphqlServerContext) {
    const noteRepository = getRepository(Note);

    const notes = await noteRepository
      .createQueryBuilder('n')
      .innerJoinAndSelect('n.tobaccos', 'tb', 'tb.name = :name', { name: tobaccoName })
      .leftJoinAndSelect('n.author', 'a')
      .leftJoinAndSelect('n.tags', 'tg')
      .leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id })
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
              hue: item.hue,
            },
          });
          if (tag) {
            return tag;
          } else {
            try {
              tag = await Tag.create({
                title: item.title,
                hue: item.hue,
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
            hue: item.hue,
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
