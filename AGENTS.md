
PROJECT: "Community Events Board". An admin posts local events; visitors browse them.
Do NOT build anything not listed here. No extra features.

STACK
- Monorepo (npm workspaces): apps/api and apps/web. TypeScript strict everywhere.
- apps/api: Node + Express + Prisma + MySQL, zod validation, bcryptjs, jsonwebtoken, cookie-parser, cors not needed.
- apps/web: Next.js (App Router) + Tailwind + shadcn/ui + lucide-react + TanStack Query + framer-motion + sonner (toasts).
- Web NEVER talks to the DB. It only calls the JSON API at /api/* (Next rewrites proxy /api/* to Express, so everything is same-origin).

ENV
- api: DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PORT=4000
- web: API_URL=http://localhost:4000, JWT_SECRET (same value, used only by middleware to verify tokens)

API CONVENTIONS
- Success: { "data": ... }. Paginated: { "data": [...], "meta": { page, limit, total, totalPages } }.
- Error: { "error": { "code": string, "message": string } } with correct HTTP status (400, 401, 403, 404, 409, 500).
- Validate all input with zod. Never return passwordHash.
- Auth: JWT (7d) with claims { sub, role: "user" | "admin" }. Accept token from `Authorization: Bearer` OR httpOnly cookie "token". Login/signup return { data: { token, user } } AND set the cookie (httpOnly, sameSite=lax, secure in production).
- Middlewares: optionalAuth (attaches user if token valid), requireUser (role user), requireAdmin (role admin).

DATA MODEL (Prisma, MySQL)
- Category enum: MUSIC, WORKSHOP, FOOD, SPORTS, KIDS
- User: id, email (unique), passwordHash, createdAt
- Event: id, title, category, city, startsAt (DateTime, stored UTC), price (Int, rupees, 0 = free), description (Text), imageUrl, isActive (Boolean, default true), createdAt. Indexes: (isActive, startsAt), category, city.
- FavouriteCategory: userId, category — composite PK (userId, category)
- Reminder: userId, eventId — composite PK
- CardDesign: userId, eventId, theme (string), stickers (Json array of sticker keys), updatedAt — unique (userId, eventId)
- Events are never deleted. Admin only toggles isActive.

API CONTRACT
Auth
- POST /api/auth/signup {email,password(min 8)} -> 201
- POST /api/auth/login {email,password}
- POST /api/auth/logout (clears cookie)
- GET  /api/auth/me -> { id, email, role, favouriteCategories }
- POST /api/admin/login {email,password} compared with ADMIN_EMAIL/ADMIN_PASSWORD env; issues role=admin token
Public / visitor
- GET  /api/events?category=&city=&q=&page=1&limit=6  (optionalAuth) -> only isActive AND startsAt >= now, ORDER BY startsAt ASC. category, city and q (matches title OR description, case-insensitive contains) combine with AND. Each event includes `reminded` (false if anonymous).
- GET  /api/events/cities -> distinct cities of active upcoming events (for the city dropdown)
- GET  /api/events/:id (optionalAuth) -> active events only (404 otherwise), includes `reminded`
User (requireUser)
- GET/PUT /api/me/favourite-categories  body: { categories: Category[] } (replaces the set)
- GET  /api/feed?page=&limit= -> upcoming active events in the user's favourite categories, nearest first
- PUT/DELETE /api/events/:id/reminder (idempotent)
- GET/PUT /api/events/:id/card-design  body: { theme: "sunset"|"ocean"|"forest", stickers: string[] (max 3, each one of: "party","music","star","fire","heart") }; GET returns null if none saved
Admin (requireAdmin)
- GET   /api/admin/events -> all events (active, inactive, past), newest startsAt first
- POST  /api/admin/events {title, category, city, startsAt (ISO), price>=0, description, imageUrl(url)}
- PATCH /api/admin/events/:id/status {isActive:boolean}

WEB RULES
- Pages: /events, /login, /signup, /preferences, /feed, /events/[id], /admin/login, /admin, /admin/events/new. "/" redirects to /events.
- Middleware (server-side): /admin/* (except /admin/login) needs valid admin token, else redirect /admin/login. /feed and /preferences need valid user token, else redirect /login.
- Formatting helpers in lib/format.ts: price with Intl en-IN (₹1,50,000; 0 => "Free"); date as "Sat, 18 Oct, 6:30 PM" in timeZone Asia/Kolkata (uppercase AM/PM).
- Every data view has: loading skeleton, friendly empty state, error state with Retry.
- Responsive (mobile-first), one colour scheme (indigo primary, amber accent, slate neutrals), font Inter, consistent spacing.
- Use <img> (not next/image) for event images, with a fallback placeholder onError, because admins paste arbitrary URLs.