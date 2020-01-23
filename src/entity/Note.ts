import { ObjectType, Field, Int, ID } from 'type-graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  BaseEntity,
} from 'typeorm';
import { User } from './User';
import { Tag } from './Tag';
import { Like } from './Like';
import { Tobacco } from './Tobacco';

@ObjectType()
@Entity('notes')
export class Note extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text')
  title: string;

  @Field(() => User)
  @ManyToOne(() => User, author => author.notes)
  author: User;

  @Field(() => Int)
  @Column('smallint')
  duration: number;

  @Field(() => Int)
  @Column('smallint')
  strength: number;

  @Field(() => [Tobacco])
  @OneToMany(() => Tobacco, tobacco => tobacco.note, { cascade: true })
  tobaccos: Tobacco[];

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  description?: string;

  @Field(() => [Tag])
  @ManyToMany(() => Tag, tag => tag.notes, { nullable: true })
  @JoinTable()
  tags?: Tag[];

  @Field()
  @Column('timestamp', { precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  likeCount: number;

  @Field(() => [Like])
  @OneToMany(() => Like, likes => likes.note)
  likes: Like[];
}
