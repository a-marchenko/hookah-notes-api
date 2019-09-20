import { ObjectType, Field, Int } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, OneToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';

@ObjectType()
@Unique(['username'])
@Entity('users')
export class User extends BaseEntity {
  @Field(() => Int)
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
  authCount: number;

  @Field()
  @Column('timestamp', { precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;
}
