import { createConnection } from 'typeorm';

import { User } from '../../entity/User';
import { Role } from '../../entity/Role';
import { Follow } from '../../entity/Follow';
import { Note } from '../../entity/Note';
import { Tobacco } from '../../entity/Tobacco';
import { Tag } from '../../entity/Tag';
import { Like } from '../../entity/Like';

const entities = [User, Role, Follow, Note, Tobacco, Tag, Like];

export const testConnection = async (drop = false) => {
  return await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'hn-test',
    synchronize: true,
    logging: false,
    dropSchema: drop,
    entities: entities,
  });
};
