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
import { Tobacco } from './Tobacco';
import { Tag } from './Tag';
import { Like } from './Like';

@Entity('notes')
export class Note extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  title: string;

  @ManyToOne(() => User, author => author.notes)
  author: User;

  @Column('smallint')
  duration: number;

  @Column('smallint')
  strength: number;

  @ManyToMany(() => Tobacco, tobacco => tobacco.notes)
  @JoinTable()
  tobaccos: Tobacco[];

  @Column({ type: 'smallint', array: true })
  proportions: number[];

  @Column('text')
  description: string;

  @ManyToMany(() => Tag, tag => tag.notes)
  @JoinTable()
  tags: Tag[];

  @Column('timestamp', { precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;

  @Column('integer', { default: 0 })
  likeCount: number;

  @OneToMany(() => Like, likes => likes.note)
  likes: Like[];
}
