import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { hash, compare } from 'bcrypt';
import { User } from '../../entity/User';
import { Role } from '../../entity/Role';
import { LoginResponse, SignupInput, LoginInput, UpdateUserRoleInput, UpdateUserLanguageInput } from './CustomTypes';
import { UserInputError, ApolloError, ForbiddenError } from 'apollo-server-express';
import { GraphqlServerContext } from 'src/interfaces/GraphqlServerContext';
import { createAccessToken, createRefreshToken } from '../../services/auth';
import { isAuth } from '../../services/auth';
import { sendConfirmationEmail, createConfirmationUrl } from '../../services/confirmation';

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users() {
    return await User.find({ relations: ['role'] });
  }

  @Query(() => User)
  async userById(@Arg('userId') userId: number) {
    return await User.findOne(userId, { relations: ['role'] });
  }

  @UseMiddleware(isAuth)
  @Query(() => User)
  async currentUser(@Ctx() { payload }: GraphqlServerContext) {
    return await User.findOne(payload.id);
  }

  @Mutation(() => Boolean)
  async signup(@Arg('input') signupInput: SignupInput) {
    const hashedPassword = await hash(signupInput.password, 12);

    try {
      // create default user role
      const role = await Role.create().save();

      const newUser = User.create({
        username: signupInput.username,
        email: signupInput.email,
        password: hashedPassword,
        role: role,
        language: signupInput.language,
      });

      await newUser.save();

      sendConfirmationEmail(
        signupInput.language,
        signupInput.email,
        signupInput.username,
        await createConfirmationUrl(newUser.id, newUser.language),
      );
    } catch (e) {
      throw new ApolloError('Server Error: Something went wrong', e);
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(@Arg('input') loginInput: LoginInput): Promise<LoginResponse> {
    let user: User | undefined;

    // Check if login input is email or username
    if (loginInput.login.includes('@')) {
      user = await User.findOne({ where: { email: loginInput.login }, relations: ['role'] });
    } else {
      user = await User.findOne({ where: { username: loginInput.login }, relations: ['role'] });
    }

    if (!user) {
      throw new UserInputError('Incorrect login or password');
    }

    if (!user.confirmed) {
      throw new UserInputError('You must confirm your email to login');
    }

    const isPasswordValid = await compare(loginInput.password, user.password);
    if (!isPasswordValid) {
      throw new UserInputError('Incorrect username or password');
    }

    return {
      accessToken: createAccessToken(user),
      refreshToken: createRefreshToken(user),
      language: user.language,
    };
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateUserRole(@Arg('input') input: UpdateUserRoleInput, @Ctx() { payload }: GraphqlServerContext) {
    if (!(payload.role === 'super')) {
      throw new ForbiddenError('Permission denied');
    }

    const user = await User.findOne({ where: { username: input.username }, relations: ['role'] });

    if (!user) {
      throw new UserInputError('User not found');
    }

    user.role.roleName = input.role;

    try {
      await user.save();
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateUserLanguage(@Arg('input') input: UpdateUserLanguageInput, @Ctx() { payload }: GraphqlServerContext) {
    const user = await User.findOne(payload.id);
    if (!user) {
      throw new UserInputError('User not found');
    }

    user.language = input.language;

    try {
      await user.save();
    } catch {
      throw new ApolloError('Something went wrong');
    }

    return true;
  }
}
