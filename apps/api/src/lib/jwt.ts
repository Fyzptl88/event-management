import jwt from "jsonwebtoken";
import { AppError } from "./errors";

export interface JwtPayload {
  sub: string;
  role: "user" | "admin";
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "default_jwt_secret_change_in_production";
};

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!decoded.sub || !decoded.role || !["user", "admin"].includes(decoded.role)) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token payload");
    }
    return decoded;
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
};
