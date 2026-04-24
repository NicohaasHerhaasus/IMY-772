import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../../application/errors/app.errors';

/** body-parser / express.json attach this when JSON.parse fails (e.g. trailing comma). */
const ENTITY_PARSE_FAILED = 'entity.parse.failed';
const ENTITY_TOO_LARGE = 'entity.too.large';

type BodyParserError = Error & {
  type?: string;
  statusCode?: number;
  status?: number;
};

function isBodyParserError(err: Error): err is BodyParserError {
  return typeof (err as BodyParserError).type === 'string';
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isBodyParserError(err)) {
    if (err.type === ENTITY_PARSE_FAILED) {
      res.status(400).json({
        status: 'error',
        message:
          'Invalid JSON in request body. Common fixes: remove a trailing comma after the last property, use double quotes for all keys and string values, and ensure the body is valid JSON.',
      });
      return;
    }
    if (err.type === ENTITY_TOO_LARGE) {
      res.status(413).json({
        status: 'error',
        message: 'Request body is too large.',
      });
      return;
    }
  }

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err.name, err.message, err);
  } else {
    console.error('Unhandled error:', err.name, err.message);
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error.',
  });
}
