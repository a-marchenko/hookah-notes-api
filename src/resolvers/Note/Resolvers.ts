import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { getRepository } from 'typeorm';
import { AddNoteInput, UpdateNoteInput, SearchNotesInput } from './CustomTypes';
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
  async notes(
    @Arg('input') input: SearchNotesInput,
    @Arg('own', { nullable: true, description: 'Search in current user`s own notes' }) own: boolean,
    @Arg('favorites', { nullable: true, description: 'Search in current user`s favorite notes' }) favorites: boolean,
    @Arg('offset', { nullable: true, description: 'Offset (paginated) from where notes should be taken' })
    offset: number,
    @Arg('limit', { nullable: true, description: 'Limit (paginated) - max number of notes that should be taken' })
    limit: number,
    @Ctx() { payload }: GraphqlServerContext,
  ) {
    const noteRepository = getRepository(Note);
    let whereUsed = false;

    let queryBuilder = noteRepository.createQueryBuilder('n');
    if (input.title) {
      queryBuilder = queryBuilder.where('n.title ilike :title', { title: '%' + input.title + '%' });
      whereUsed = true;
    }
    if (input.duration) {
      queryBuilder = whereUsed
        ? queryBuilder.andWhere('n.duration = :duration', { duration: input.duration })
        : queryBuilder.where('n.duration = :duration', { duration: input.duration });
      whereUsed = true;
    }
    if (input.strength) {
      queryBuilder = whereUsed
        ? queryBuilder.andWhere('n.strendgth = :strength', { strendgth: input.strength })
        : queryBuilder.where('n.strendgth = :strength', { strendgth: input.strength });
      whereUsed = true;
    }
    if (input.tobaccoBrand) {
      queryBuilder = queryBuilder.innerJoin('n.tobaccos', 'tb1', 'tb1.brand = :brand', { brand: input.tobaccoBrand });
    }
    if (input.tobaccoName) {
      queryBuilder = queryBuilder.innerJoin('n.tobaccos', 'tb2', 'tb2.name = :name', { name: input.tobaccoName });
    }
    if (input.tagTitle) {
      queryBuilder = queryBuilder.innerJoin('n.tags', 'tg1', 'tg1.title = :title', { title: input.tagTitle });
    }
    if (own) {
      queryBuilder = queryBuilder.innerJoinAndSelect('n.author', 'a', 'a."id" = :id', { id: payload.id });
    } else if (input.authorUsername) {
      queryBuilder = queryBuilder.innerJoinAndSelect('n.author', 'a', 'a.username = :username', {
        username: input.authorUsername,
      });
    } else {
      queryBuilder = queryBuilder.leftJoinAndSelect('n.author', 'a');
    }
    if (favorites) {
      queryBuilder = queryBuilder.innerJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id });
    } else {
      queryBuilder = queryBuilder.leftJoinAndSelect('n.likes', 'l', 'l."userId" = :userId', { userId: payload.id });
    }

    queryBuilder = queryBuilder
      .leftJoinAndSelect('n.tobaccos', 'tb')
      .leftJoinAndSelect('n.tags', 'tg')
      .orderBy('n.id', 'DESC');

    if (offset && limit) {
      queryBuilder = queryBuilder.skip(offset).take(limit);
    }

    const notes = await queryBuilder.getMany();

    return notes;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async addNote(@Arg('input') input: AddNoteInput, @Ctx() { payload }: GraphqlServerContext) {
    const author = await User.findOne(payload.id);

    const note = await Note.create({
      title: input.title,
      author: author,
      duration: input.duration,
      strength: input.strength,
      description: input.description,
      tobaccos: [],
      tags: [],
    }).save();

    const tobaccos = await Promise.all(
      input.tobaccosInput.map(async item => {
        try {
          return await Tobacco.create({
            brand: item.brand,
            name: item.name,
            percentage: item.percentage,
            note: note,
          }).save();
        } catch {
          throw new ApolloError('Something went wrong');
        }
      }),
    );

    const tags = input.tagsInput
      ? await Promise.all(
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
        )
      : undefined;

    note.tobaccos = tobaccos;
    note.tags = tags;

    try {
      await Note.save(note);
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

    const tobaccos = await Promise.all(
      input.tobaccosInput.map(async item => {
        const tobacco = await Tobacco.findOne({ where: { note: note, brand: item.brand, name: item.name } });
        if (tobacco) {
          tobacco.percentage = item.percentage;
          return await tobacco.save();
        } else {
          try {
            return await Tobacco.create({
              brand: item.brand,
              name: item.name,
              percentage: item.percentage,
              note: note,
            }).save();
          } catch {
            throw new ApolloError('Something went wrong');
          }
        }
      }),
    );

    const tags = input.tagsInput
      ? await Promise.all(
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
        )
      : undefined;

    note.title = input.title;
    note.duration = input.duration;
    note.strength = input.strength;
    note.tobaccos = tobaccos;
    note.tags = tags;
    note.description = input.description ? input.description : undefined;

    try {
      await Note.save(note);
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }
}
