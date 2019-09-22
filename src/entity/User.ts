import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from './Role';
import { Note } from './Note';
import { Like } from './Like';
import { Follow } from './Follow';

@ObjectType()
@Unique(['username'])
@Entity('users')
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text')
  username: string;

  @Column('text')
  password: string;

  @Field(() => Role)
  @OneToOne(() => Role, role => role.user, { cascade: ['update'] })
  @JoinColumn()
  role: Role;

  @Column('int', { default: 0 })
  tokenVersion: number;

  @Field()
  @Column('timestamp', { precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;

  @OneToMany(() => Follow, following => following.following)
  following: Follow[];

  @OneToMany(() => Follow, followers => followers.follower)
  followers: Follow[];

  @OneToMany(() => Note, notes => notes.author)
  notes: Note[];

  @OneToMany(() => Like, likes => likes.user)
  likes: Like[];
}
