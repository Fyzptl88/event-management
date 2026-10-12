import path from "path";
import dotenv from "dotenv";

// Load .env relative to apps/api directory, and fallback to cwd
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import adminAuthRouter from "./routes/admin-auth";
import eventsRouter from "./routes/events";
import adminEventsRouter from "./routes/admin-events";
import { AppError } from "./lib/errors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    data: {
      status: "ok",
    },
  });
});

// Mount routers
app.use("/api/auth", authRouter);
app.use("/api/admin/events", adminEventsRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/events", eventsRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  const status =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
      ? err.statusCode
      : 500;

  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred";

  res.status(status).json({
    error: {
      code,
      message,
    },
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
