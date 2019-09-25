import { ObjectType, Field, InputType } from 'type-graphql';
import { User } from '../../entity/User';
import { IsEmail, MinLength, Matches, IsIn } from 'class-validator';
import { IsUserAlreadyExist } from '../../utils/validation/IsUserAlreadyExist';

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;
}

@InputType({ description: 'New user data' })
export class SignupInput implements Partial<User> {
  @Field()
  @IsUserAlreadyExist({ message: 'Username is busy' })
  @MinLength(3, { message: 'Username should be 3 characters or more' })
  @Matches(/^\w+$/, { message: 'Only letters, numbers and underscores allowed in username' })
  username: string;

  @Field()
  @IsUserAlreadyExist({ message: 'Email is busy' })
  @IsEmail(undefined, { message: 'Invalid email format' })
  email: string;

  @Field()
  @MinLength(6, { message: 'Password should be 6 characters or more' })
  password: string;
}

@InputType({ description: 'Existing user data' })
export class LoginInput {
  @Field({ description: 'Username or email' })
  login: string;

  @Field()
  password: string;
}

@InputType({ description: 'Update user role' })
export class UpdateUserRoleInput {
  @Field()
  username: string;

  @Field({ description: 'Roles can be: "user", "admin", "super"' })
  @IsIn(['user', 'admin', 'super'], { message: 'Incorrect role name' })
  role: 'user' | 'admin' | 'super';
}
