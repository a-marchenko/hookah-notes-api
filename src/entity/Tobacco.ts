import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Note } from './Note';

@ObjectType()
@Entity('tobaccos')
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

  @Field()
  @Column('smallint')
  percentage: number;

  @ManyToOne(() => Note, note => note.tobaccos)
  note: Note;
}
