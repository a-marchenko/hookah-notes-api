import { MinLength, MaxLength, Min, Max } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';
import { Tag } from '../../entity/Tag';

@InputType({ description: 'New tag data' })
export class TagInput implements Partial<Tag> {
  @Field(() => String, { description: 'Title length can be from 2 to 16 characters' })
  @MaxLength(16)
  @MinLength(2)
  title: string;

  @Max(360)
  @Min(0)
  @Field(() => Int, { description: 'Color hue can be from 0 to 360' })
  hue: number;
}
