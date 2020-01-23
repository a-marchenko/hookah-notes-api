import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { UserFollower, UserFollowing, UserFollowingNullable } from './CustomTypes';
import { User } from '../../entity/User';
import { Follow } from '../../entity/Follow';
import { UserInputError, ApolloError } from 'apollo-server-express';
import { isAuth } from '../../services/auth';
import { GraphqlServerContext } from '../../interfaces/GraphqlServerContext';

@Resolver()
export class FollowResolver {
  @Query(() => [UserFollower])
  userFollowersByUserId(@Arg('userId') userId: number) {
    return Follow.find({ where: { following: userId }, relations: ['follower'] });
  }

  @Query(() => [UserFollowing])
  userFollowingsByUserId(@Arg('userId') userId: number) {
    return Follow.find({ where: { follower: userId }, relations: ['following'] });
  }

  @UseMiddleware(isAuth)
  @Query(() => [UserFollowing])
  async currentUserFollowings(@Ctx() { payload }: GraphqlServerContext) {
    return await Follow.find({ where: { follower: payload.id }, relations: ['following'] });
  }

  @UseMiddleware(isAuth)
  @Query(() => UserFollowingNullable)
  async currentUserFollowingByUserId(@Ctx() { payload }: GraphqlServerContext, @Arg('userId') userId: number) {
    return await Follow.find({ where: { follower: payload.id, following: userId }, relations: ['following'] });
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async follow(@Arg('userId') userId: number, @Ctx() { payload }: GraphqlServerContext) {
    console.log(payload.id);

    if (userId == payload.id) {
      throw new UserInputError('You cannot follow yourself');
    }

    const follower = await User.findOne(payload.id);

    if (!follower) {
      throw new UserInputError('User does not exists');
    }

    const following = await User.findOne(userId);

    if (!following) {
      throw new UserInputError('User does not exists');
    }

    const follow = await Follow.findOne({ where: { follower: follower, following: following } });

    if (follow) {
      throw new UserInputError('You are already following this user');
    }

    try {
      await Follow.create({ follower: follower, following: following }).save();
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async unfollow(@Arg('userId') userId: number, @Ctx() { payload }: GraphqlServerContext) {
    const follower = await User.findOne(payload.id);

    if (!follower) {
      throw new UserInputError('User does not exists');
    }

    const following = await User.findOne(userId);

    if (!following) {
      throw new UserInputError('User does not exists');
    }

    const follow = await Follow.findOne({ where: { follower: follower, following: following } });

    if (!follow) {
      throw new UserInputError('You are not following this user');
    }

    try {
      await Follow.remove(follow);
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }
}
