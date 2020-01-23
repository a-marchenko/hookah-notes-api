import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from 'typeorm';
import { User } from './User';
import { Note } from './Note';

@ObjectType()
@Entity('likes')
export class Like extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User)
  @ManyToOne(() => User, user => user.likes)
  user: User;

  @Field(() => Note)
  @ManyToOne(() => Note, note => note.likes, { onDelete: 'CASCADE' })
  note: Note;
}
