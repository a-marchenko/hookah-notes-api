import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx } from 'type-graphql';
import { hash, compare } from 'bcrypt';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { UserInputError, ApolloError } from 'apollo-server-express';
import { ApolloServerContext } from 'src/interfaces/ApolloServerContext';
import { createRefreshToken, createAccessToken } from '../services/auth';

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
    @Ctx() { res }: ApolloServerContext,
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { username: username }, relations: ['role'] });
    if (!user) {
      throw new UserInputError('Incorrect username or password');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UserInputError('Incorrect username or password');
    }

    res.cookie('URT', createRefreshToken(user), {
      httpOnly: true,
    });

    return {
      accessToken: createAccessToken(user),
    };
  }

  @Mutation(() => Boolean)
  async updateUserRole(@Arg('username') username: string, @Arg('status') role: 'user' | 'admin' | 'super') {
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
