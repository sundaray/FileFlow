import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  message: string;
  details?: any;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'File not found';
  } else if (err instanceof Error) {
    message = err.message;
  }

  const response: any = {
    code,
    message,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
