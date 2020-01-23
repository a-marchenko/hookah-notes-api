import { InputType, Field, Int, ID } from 'type-graphql';
import { MinLength, MaxLength, IsIn, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Note } from '../../entity/Note';
import { TobaccoInput } from '../Tobacco/CustomTypes';
import { SumOfPercentageValues } from '../../utils/validation/SumOfPercentageValues';
import { TagInput } from '../Tag/CustomTypes';

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

  @Field(() => [TobaccoInput], { description: 'From 1 to 4 tobacco items' })
  @SumOfPercentageValues()
  @ArrayMaxSize(4)
  @ArrayMinSize(1)
  tobaccosInput: TobaccoInput[];

  @Field({ nullable: true, description: 'Optional note description' })
  description?: string;

  @Field(() => [TagInput], { nullable: true, description: 'Up to 4 optional tags' })
  @ArrayMaxSize(4)
  tagsInput?: TagInput[];
}

@InputType({ description: 'Update note data' })
export class UpdateNoteInput extends AddNoteInput {
  @Field(() => ID)
  id: number;
}

@InputType({ description: 'Notes search parameters' })
export class SearchNotesInput {
  @Field({ nullable: true, description: 'Note title parameter' })
  title?: string;

  @Field({ nullable: true, description: 'Note author`s username parameter' })
  authorUsername?: string;

  @Field(() => Int, { nullable: true, description: 'Note duration parameter. Duration value can be: 1, 2, 3, 4, 5' })
  @IsIn([1, 2, 3, 4, 5], { message: 'Incorrect duration value' })
  duration?: number;

  @Field(() => Int, { nullable: true, description: 'Note strength parameter. Strength value can be: 1, 2, 3, 4, 5' })
  @IsIn([1, 2, 3, 4, 5], { message: 'Incorrect strength value' })
  strength?: number;

  @Field({ nullable: true, description: 'Tobacco brand parameter' })
  tobaccoBrand?: string;

  @Field({ nullable: true, description: 'Tobacco name parameter' })
  tobaccoName?: string;

  @Field({ nullable: true, description: 'Tag title parameter' })
  tagTitle?: string;
}
