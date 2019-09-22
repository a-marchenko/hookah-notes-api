import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@ObjectType()
@Entity('follow')
export class Follow extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User)
  @ManyToOne(() => User, user => user.following)
  @JoinColumn()
  following: User;

  @Field(() => User)
  @ManyToOne(() => User, user => user.followers)
  @JoinColumn()
  follower: User;
}
