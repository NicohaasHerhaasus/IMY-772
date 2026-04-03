import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../../application/errors/app.errors';

type ValidatorFn = (data: any) => string[];

export function validate(validator: ValidatorFn) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validator(req.body);
    if (errors.length > 0) {
      next(new ValidationError(errors));
      return;
    }
    next();
  };
}
