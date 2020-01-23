import { MinLength, MaxLength, Min, Max } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';
import { Tobacco } from '../../entity/Tobacco';

@InputType({ description: 'Note tobacco item data' })
export class TobaccoInput implements Partial<Tobacco> {
  @Field(() => String, { description: 'Brand length can be from 1 to 32 characters' })
  @MaxLength(32)
  @MinLength(1)
  brand: string;

  @Field(() => String, { description: 'Name length can be from 1 to 32 characters' })
  @MaxLength(32)
  @MinLength(1)
  name: string;

  @Field(() => Int, { description: 'Percentage value can be from 1 to 100' })
  @Max(100)
  @Min(1)
  percentage: number;
}
