import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany } from 'typeorm';
import { Note } from './Note';

@ObjectType()
@Entity('tobacco')
export class Tobacco extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text')
  brand: string;

  @Field()
  @Column('text')
  name: string;

  @Field(() => [Note])
  @ManyToMany(() => Note, note => note.tobaccos)
  notes: Note[];
}
