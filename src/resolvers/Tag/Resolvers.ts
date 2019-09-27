import { Resolver, Query, Arg } from 'type-graphql';
import { Tag } from '../../entity/Tag';

@Resolver()
export class TagResolver {
  @Query(() => Tag)
  async tag(@Arg('id') id: number) {
    return await Tag.findOne(id);
  }

  @Query(() => [Tag])
  async tags() {
    return await Tag.find();
  }
}
