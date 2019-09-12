import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany } from 'typeorm';
import { Note } from './Note';

@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar')
  colorText: string;

  @Column('varchar')
  colorBackground: string;

  @ManyToMany(() => Note, note => note.tags)
  notes: Note[];
}
