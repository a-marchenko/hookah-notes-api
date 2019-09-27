import { MinLength, MaxLength } from 'class-validator';
import { InputType, Field, ID, Int } from 'type-graphql';
import { Tag } from '../../entity/Tag';

@InputType()
export class HSLColor {
  @Field(() => Int)
  h: number;

  @Field(() => Int)
  s: number;

  @Field(() => Int)
  l: number;
}

@InputType({ description: 'New tag data' })
export class AddTagInput implements Partial<Tag> {
  @Field(() => String, { description: 'Title length can be from 2 to 16 characters' })
  @MaxLength(16)
  @MinLength(2)
  title: string;

  @Field(() => HSLColor, { description: 'HSL color value, ex. "{h:50, s:100, l:50}"' })
  textColorInput: HSLColor;

  @Field(() => HSLColor, { description: 'HSL color value, ex. "{h:50, s:100, l:30}"' })
  backgroundColorInput: HSLColor;
}

@InputType({ description: 'Update tag data' })
export class UpdateTagInput extends AddTagInput {
  @Field(() => ID)
  id: number;
}
