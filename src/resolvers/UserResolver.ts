import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware } from 'type-graphql';
import { hash, compare } from 'bcrypt';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { UserInputError, ApolloError, ForbiddenError } from 'apollo-server-express';
import { GraphqlServerContext } from 'src/interfaces/GraphqlServerContext';
import { createAccessToken, createRefreshToken, sendRefreshToken } from '../services/auth';
import { isAuth } from '../services/auth';

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users() {
    return User.find({ relations: ['role'] });
  }

  @Mutation(() => Boolean)
  async signup(@Arg('username') username: string, @Arg('password') password: string) {
    if (username.length < 3) {
      throw new UserInputError('Username should be 3 characters or more');
    }

    if (password.length < 6) {
      throw new UserInputError('Password should be 6 characters or more');
    }

    // check if a user with the same username already exists

    const user = await User.findOne({ where: { username: username } });
    if (user) {
      throw new UserInputError('Username is busy');
    }

    const hashedPassword = await hash(password, 12);

    try {
      const role = Role.create();
      await role.save();

      const newUser = User.create({
        username: username,
        password: hashedPassword,
        role: role,
      });
      await newUser.save();
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { res }: GraphqlServerContext,
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { username: username }, relations: ['role'] });
    if (!user) {
      throw new UserInputError('Incorrect username or password');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UserInputError('Incorrect username or password');
    }

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: GraphqlServerContext) {
    sendRefreshToken(res, '');

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateUserRole(
    @Arg('username') username: string,
    @Arg('status') role: 'user' | 'admin' | 'super',
    @Ctx() { payload }: GraphqlServerContext,
  ) {
    if (!(payload.role === 'super')) {
      throw new ForbiddenError('Permission denied');
    }

    const user = await User.findOne({ where: { username: username }, relations: ['role'] });

    if (!user) {
      throw new UserInputError('User not found');
    }

    user.role.roleName = role;

    try {
      await user.save();
    } catch (e) {
      throw new ApolloError('Cannot update role\n\n' + e);
    }

    return true;
  }
}
