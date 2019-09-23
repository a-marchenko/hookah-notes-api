import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware } from 'type-graphql';
import { hash, compare } from 'bcrypt';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { UserInputError, ApolloError, ForbiddenError } from 'apollo-server-express';
import { GraphqlServerContext } from 'src/interfaces/GraphqlServerContext';
import { createAccessToken, createRefreshToken, sendRefreshToken } from '../services/auth';
import { isAuth } from '../services/auth';
import { sendConfirmationEmail, createConfirmationUrl } from '../utils/emailConfirmation';
import { redis } from '../redis';

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
  async signup(@Arg('username') username: string, @Arg('email') email: string, @Arg('password') password: string) {
    const re = /^\w+$/;

    if (username.length < 3) {
      throw new UserInputError('Username should be 3 characters or more');
    }

    if (!re.test(username)) {
      throw new UserInputError('Only letters, numbers and underscores allowed in username');
    }

    if (password.length < 6) {
      throw new UserInputError('Password should be 6 characters or more');
    }

    // check if a user with the same username already exists

    let user = await User.findOne({ where: { username: username } });
    if (user) {
      throw new UserInputError('Username is busy');
    }

    user = await User.findOne({ where: { email: email } });
    if (user) {
      throw new UserInputError('Email is busy');
    }

    const hashedPassword = await hash(password, 12);

    try {
      const role = Role.create();
      await role.save();

      const newUser = User.create({
        username: username,
        email: email,
        password: hashedPassword,
        role: role,
      });
      await newUser.save();

      await sendConfirmationEmail(email, username, await createConfirmationUrl(newUser.id));
    } catch (e) {
      throw new ApolloError('Something went wrong\n\n', e);
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('login', { description: 'Username or email' }) login: string,
    @Arg('password') password: string,
    @Ctx() { res }: GraphqlServerContext,
  ): Promise<LoginResponse> {
    let user: User | undefined;

    // Check if login input is email or username
    if (login.includes('@')) {
      user = await User.findOne({ where: { email: login }, relations: ['role'] });
    } else {
      user = await User.findOne({ where: { username: login }, relations: ['role'] });
    }

    if (!user) {
      throw new UserInputError('Incorrect login or password');
    }

    if (!user.confirmed) {
      throw new UserInputError('You must confirm your email to login');
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
  async confirmUser(@Arg('token') token: string) {
    const userId = await redis.get(token);

    if (!userId) {
      throw new ForbiddenError('Your token is invalid');
    }

    await User.update(parseInt(userId, 10), { confirmed: true });

    await redis.del(token);

    return true;
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
