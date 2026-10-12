import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { AppError } from "../lib/errors";
import { validateBody } from "../lib/validate";
import { requireAuth } from "../middlewares/auth";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getClearCookieOptions } from "../lib/cookie";

const router = Router();

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/signup
router.post(
  "/signup",
  validateBody(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(409, "CONFLICT", "Email is already registered");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash },
      });

      const token = signToken({ sub: user.id, role: "user" });
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(201).json({
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: "user",
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
      }

      const token = signToken({ sub: user.id, role: "user" });
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(200).json({
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: "user",
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({
    data: {
      message: "Logged out successfully",
    },
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPayload = req.user!;

    if (userPayload.role === "admin") {
      return res.status(200).json({
        data: {
          id: "admin",
          email: process.env.ADMIN_EMAIL || "admin@example.com",
          role: "admin",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.sub },
      include: { favouriteCategories: true },
    });

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "User not found");
    }

    res.status(200).json({
      data: {
        id: user.id,
        email: user.email,
        role: "user",
        favouriteCategories: user.favouriteCategories.map((fc) => fc.category),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
