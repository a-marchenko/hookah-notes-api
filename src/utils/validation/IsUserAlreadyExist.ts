import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { User } from '../../entity/User';

@ValidatorConstraint({ async: true })
export class IsUserAlreadyExistConstraint implements ValidatorConstraintInterface {
  validate(nameOrEmail: string) {
    if (nameOrEmail.includes('@')) {
      return User.findOne({ where: { email: nameOrEmail } }).then(user => {
        if (user) return false;
        return true;
      });
    } else {
      return User.findOne({ where: { username: nameOrEmail } }).then(user => {
        if (user) return false;
        return true;
      });
    }
  }
}

export function IsUserAlreadyExist(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserAlreadyExistConstraint,
    });
  };
}
