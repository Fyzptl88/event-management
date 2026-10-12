import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { signToken } from "../lib/jwt";
import { AppError } from "../lib/errors";
import { validateBody } from "../lib/validate";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "../lib/cookie";

const router = Router();

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/admin/login
router.post(
  "/login",
  validateBody(adminLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const expectedEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      const expectedPassword = process.env.ADMIN_PASSWORD || "adminpassword123";

      if (email !== expectedEmail || password !== expectedPassword) {
        throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
      }

      const token = signToken({ sub: "admin", role: "admin" });
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(200).json({
        data: {
          token,
          user: {
            id: "admin",
            email: expectedEmail,
            role: "admin",
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
