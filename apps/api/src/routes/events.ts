import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Category, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middlewares/auth";
import { validateQuery } from "../lib/validate";
import { AppError } from "../lib/errors";

const router = Router();

const emptyStringToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const getEventsQuerySchema = z.object({
  category: z.preprocess(
    emptyStringToUndefined,
    z.nativeEnum(Category, { errorMap: () => ({ message: "Invalid category" }) }).optional()
  ),
  city: z.preprocess(emptyStringToUndefined, z.string().optional()),
  q: z.preprocess(emptyStringToUndefined, z.string().optional()),
  page: z.preprocess(
    (val) => (val === undefined || val === "" ? 1 : val),
    z.coerce
      .number({ invalid_type_error: "Page must be a number" })
      .int({ message: "Page must be an integer" })
      .min(1, { message: "Page must be at least 1" })
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === "" ? 6 : val),
    z.coerce
      .number({ invalid_type_error: "Limit must be a number" })
      .int({ message: "Limit must be an integer" })
      .min(1, { message: "Limit must be at least 1" })
      .max(50, { message: "Limit cannot exceed 50" })
  ),
});

type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;

// GET /api/events (with query filters)
router.get(
  "/",
  optionalAuth,
  validateQuery(getEventsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, city, q, page, limit } = req.query as unknown as GetEventsQuery;

      const where: Prisma.EventWhereInput = {
        isActive: true,
        startsAt: { gte: new Date() },
      };

      if (category) {
        where.category = category;
      }

      const trimmedCity = city?.trim();
      if (trimmedCity) {
        where.city = trimmedCity;
      }

      const trimmedQ = q?.trim();
      if (trimmedQ) {
        where.OR = [
          { title: { contains: trimmedQ } },
          { description: { contains: trimmedQ } },
        ];
      }

      const skip = (page - 1) * limit;

      const [events, total] = await prisma.$transaction([
        prisma.event.findMany({
          where,
          orderBy: { startsAt: "asc" },
          skip,
          take: limit,
        }),
        prisma.event.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      let remindedIds = new Set<string>();
      if (req.user && events.length > 0) {
        const eventIds = events.map((e) => e.id);
        const reminders = await prisma.reminder.findMany({
          where: {
            userId: req.user.sub,
            eventId: { in: eventIds },
          },
          select: { eventId: true },
        });
        remindedIds = new Set(reminders.map((r) => r.eventId));
      }

      const data = events.map((event) => ({
        ...event,
        reminded: remindedIds.has(event.id),
      }));

      res.status(200).json({
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/events/cities (must be registered BEFORE /api/events/:id)
router.get("/cities", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const cityRecords = await prisma.event.findMany({
      where: {
        isActive: true,
        startsAt: { gte: now },
      },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });

    res.status(200).json({
      data: cityRecords.map((c) => c.city),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id (active only, else 404)
router.get("/:id", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
    });

    if (!event) {
      throw new AppError(404, "NOT_FOUND", "Event not found");
    }

    let reminded = false;
    if (req.user) {
      const reminder = await prisma.reminder.findUnique({
        where: {
          userId_eventId: {
            userId: req.user.sub,
            eventId: event.id,
          },
        },
      });
      reminded = !!reminder;
    }

    res.status(200).json({
      data: {
        ...event,
        reminded,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
