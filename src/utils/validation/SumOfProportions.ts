import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { sum, values } from 'lodash';

@ValidatorConstraint()
export class SumOfProportionsConstraint implements ValidatorConstraintInterface {
  validate(proportions: number[]) {
    if (sum(values(proportions)) === 100) {
      return true;
    } else {
      return false;
    }
  }
}

export function SumOfProportions(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SumOfProportionsConstraint,
    });
  };
}
