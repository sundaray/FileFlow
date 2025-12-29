import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    console.log(
      `[${timestamp}] ${method} ${url} ${statusCode} - ${duration}ms`
    );
  });

  next();
};
