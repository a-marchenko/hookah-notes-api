import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany } from 'typeorm';
import { Note } from './Note';

@Entity('tobacco')
export class Tobacco extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  brand: string;

  @Column('text')
  name: string;

  @ManyToMany(() => Note, note => note.tobaccos)
  notes: Note[];
}
