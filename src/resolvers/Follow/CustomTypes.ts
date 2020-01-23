import { ObjectType, Field } from 'type-graphql';
import { Follow } from '../../entity/Follow';
import { User } from '../../entity/User';

@ObjectType()
export class UserFollower implements Partial<Follow> {
  @Field(() => User)
  follower: User;
}

@ObjectType()
export class UserFollowing implements Partial<Follow> {
  @Field(() => User)
  following: User;
}

@ObjectType()
export class UserFollowingNullable implements Partial<Follow> {
  @Field(() => User, { nullable: true })
  following?: User;
}
