import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Category } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middlewares/auth";
import { validateBody } from "../lib/validate";
import { AppError } from "../lib/errors";

const router = Router();

// Apply requireAdmin to all admin event routes
router.use(requireAdmin);

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.nativeEnum(Category, { errorMap: () => ({ message: "Invalid category" }) }),
  city: z.string().min(1, "City is required"),
  startsAt: z.string().datetime({ message: "startsAt must be a valid ISO-8601 datetime string" }),
  price: z.number().int({ message: "Price must be an integer" }).min(0, { message: "Price must be >= 0" }),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url({ message: "imageUrl must be a valid URL" }),
});

const updateEventStatusSchema = z.object({
  isActive: z.boolean({ required_error: "isActive is required and must be a boolean" }),
});

// GET /api/admin/events (all events, newest startsAt first)
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startsAt: "desc" },
    });

    res.status(200).json({
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/events (create new event)
router.post(
  "/",
  validateBody(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, category, city, startsAt, price, description, imageUrl } = req.body;

      const event = await prisma.event.create({
        data: {
          title,
          category,
          city,
          startsAt: new Date(startsAt),
          price,
          description,
          imageUrl,
          isActive: true,
        },
      });

      res.status(201).json({
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/events/:id/status (toggle event isActive)
router.patch(
  "/:id/status",
  validateBody(updateEventStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const existingEvent = await prisma.event.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        throw new AppError(404, "NOT_FOUND", "Event not found");
      }

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { isActive },
      });

      res.status(200).json({
        data: updatedEvent,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
