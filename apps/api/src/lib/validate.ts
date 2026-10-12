import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./errors";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.errors.map((e) => e.message).join(", ");
      return next(new AppError(400, "BAD_REQUEST", issues || "Invalid input"));
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.errors.map((e) => e.message).join(", ");
      return next(new AppError(400, "BAD_REQUEST", issues || "Invalid query parameters"));
    }
    req.query = result.data;
    next();
  };
};

export const parseData = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message).join(", ");
    throw new AppError(400, "BAD_REQUEST", issues || "Invalid input");
  }
  return result.data;
};
