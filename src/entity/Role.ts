import { ObjectType, Field, Int } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToOne } from 'typeorm';
import { User } from './User';

@ObjectType()
@Entity('roles')
export class Role extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User)
  @OneToOne(() => User, user => user.role, { cascade: true })
  user: User;

  @Field()
  @Column('text', { default: 'user' })
  roleName: 'user' | 'admin' | 'super';

  @Field()
  @Column('timestamp', { precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;
}
