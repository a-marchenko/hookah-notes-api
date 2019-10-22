import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany } from 'typeorm';
import { Note } from './Note';

@ObjectType()
@Entity('tags')
export class Tag extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('varchar')
  title: string;

  @Field()
  @Column('int')
  hue: number;

  @Field(() => Note)
  @ManyToMany(() => Note, note => note.tags)
  notes: Note[];
}
