import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { sum, values } from 'lodash';
import { Tobacco } from 'src/entity/Tobacco';

@ValidatorConstraint()
export class SumOfPercentageValuesConstraint implements ValidatorConstraintInterface {
  validate(noteTobaccos: Tobacco[]) {
    let proportions: number[] = [];
    noteTobaccos.forEach(element => {
      proportions.push(element.percentage);
    });
    if (sum(values(proportions)) === 100) {
      return true;
    } else {
      return false;
    }
  }
}

export function SumOfPercentageValues(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SumOfPercentageValuesConstraint,
    });
  };
}
