import { Resolver, Mutation, Arg, UseMiddleware, Ctx } from 'type-graphql';
import { isAuth } from '../../services/isAuth';
import { GraphqlServerContext } from '../../interfaces/GraphqlServerContext';
import { User } from '../../entity/User';
import { Note } from '../../entity/Note';
import { Like } from '../../entity/Like';
import { UserInputError, ApolloError } from 'apollo-server-errors';

@Resolver()
export class LikeResolver {
  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async like(@Arg('noteId') noteId: number, @Ctx() { payload }: GraphqlServerContext) {
    const note = await Note.findOne(noteId);

    if (!note) {
      throw new UserInputError('Note not found');
    }

    const user = await User.findOne(payload.id);

    const existingLike = await Like.findOne({ where: { user: payload.id, note: noteId } });

    try {
      if (existingLike) {
        note.likeCount--;
        await note.save();
        await Like.remove(existingLike);
      } else {
        await Like.create({ user, note }).save();
      }
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }
}
