import { Resolver, Query, Arg } from 'type-graphql';
import { Tobacco } from '../../entity/Tobacco';

@Resolver()
export class TobaccoResolver {
  @Query(() => Tobacco)
  async tobacco(@Arg('id') id: number) {
    return await Tobacco.findOne(id);
  }

  @Query(() => [Tobacco])
  async tobaccos() {
    return await Tobacco.find();
  }
}
