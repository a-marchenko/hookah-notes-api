import { MinLength, MaxLength } from 'class-validator';
import { InputType, Field, ID } from 'type-graphql';
import { Tobacco } from '../../entity/Tobacco';

@InputType({ description: 'New tobacco data' })
export class AddTobaccoInput implements Partial<Tobacco> {
  @Field(() => String, { description: 'Brand length can be from 1 to 24 characters' })
  @MaxLength(24)
  @MinLength(1)
  brand: string;

  @Field(() => String, { description: 'Name length can be from 1 to 24 characters' })
  @MaxLength(24)
  @MinLength(1)
  name: string;
}

@InputType({ description: 'Update tobacco data' })
export class UpdateTobaccoInput extends AddTobaccoInput {
  @Field(() => ID)
  id: number;
}
