import { InputType, Field, Int, ID } from 'type-graphql';
import { MinLength, MaxLength, IsIn, IsPositive, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Note } from '../../entity/Note';
import { AddTobaccoInput, UpdateTobaccoInput } from '../Tobacco/CustomTypes';
import { SumOfProportions } from '../../utils/validation/SumOfProportions';
import { AddTagInput, UpdateTagInput } from '../Tag/CustomTypes';

@InputType({ description: 'New note data' })
export class AddNoteInput implements Partial<Note> {
  @Field({ description: 'Title length can be from 2 to 48 characters' })
  @MaxLength(48)
  @MinLength(2)
  title: string;

  @Field(() => Int, { description: 'Duration value can be: 1, 2, 3, 4, 5' })
  @IsIn([1, 2, 3, 4, 5], { message: 'Incorrect duration value' })
  duration: number;

  @Field(() => Int, { description: 'Strength value can be: 1, 2, 3, 4, 5' })
  @IsIn([1, 2, 3, 4, 5], { message: 'Incorrect strength value' })
  strength: number;

  @Field(() => [AddTobaccoInput], { description: 'From 1 to 4 tobacco items' })
  @ArrayMaxSize(4)
  @ArrayMinSize(1)
  tobaccosInput: AddTobaccoInput[];

  @Field(() => [Int], { description: 'Percentage of each tobacco, sum of values should be 100' })
  @SumOfProportions()
  @IsPositive({ each: true })
  proportions: number[];

  @Field({ nullable: true, description: 'Optional note description' })
  description?: string;

  @Field(() => [AddTagInput], { nullable: true, description: 'Up to 4 optional tags' })
  @ArrayMaxSize(4)
  tagsInput?: AddTagInput[];
}

@InputType({ description: 'Update note data' })
export class UpdateNoteInput extends AddNoteInput {
  @Field(() => ID)
  id: number;

  @Field(() => [UpdateTobaccoInput], { description: 'From 1 to 4 tobacco items' })
  @ArrayMaxSize(4)
  @ArrayMinSize(1)
  tobaccosInput: UpdateTobaccoInput[];

  @Field(() => [UpdateTagInput], { nullable: true, description: 'Up to 4 optional tags' })
  @ArrayMaxSize(4)
  tagsInput?: UpdateTagInput[];
}
