import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/jwt";
import { AppError } from "../lib/errors";

export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch {
    // optionalAuth does not reject on invalid token, simply continues unauthenticated
    req.user = undefined;
  }
  next();
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing authorization token"));
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireUser = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing authorization token"));
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== "user") {
      return next(new AppError(403, "FORBIDDEN", "Forbidden: user role required"));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing authorization token"));
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return next(new AppError(403, "FORBIDDEN", "Forbidden: admin role required"));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};
