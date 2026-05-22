# Daily Brew POS Backend

Backend for a point-of-sale and FIFO inventory system built for coffee shop operations.

## At a Glance

| Area | Status |
| --- | --- |
| HTTP API | Live |
| Auth + RBAC | Live (cookie-based sessions) |
| Inventory CRUD | Live |
| Orders checkout and settlement | Live |
| Analytics reporting | Live |
| Socket.IO realtime events | Live |
| Frontend app | Present (separate frontend folder) |
| OpenAPI / Swagger docs | Not present |
| Background job queue | Not present |
| Separate sales module | Not present |

## Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JWT (signed tokens stored in HttpOnly cookies)
- bcrypt
- Socket.IO
- Cloudinary uploads

## Architecture

```text
src/
├── app.ts                # Express app wiring
├── server.ts             # HTTP server bootstrap and websocket attachment
├── config/
│   ├── db.ts             # Prisma client / DB connection
│   ├── events.ts         # In-memory event bus
│   └── socket.ts         # Socket.IO listeners and fan-out
├── middlewares/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   └── error.middleware.ts
└── modules/
    ├── auth/
    ├── inventory/
    ├── orders/
    ├── analytics/
    └── audit/
```

## Live Modules

- `auth`: login, refresh, logout, registration, and avatar updates (cookie-based sessions).
- `inventory`: categories, ingredients, products, and suppliers.
- `orders`: POS checkout, parked order recall, and parked order settlement.
- `analytics`: financial overview, product velocity, and inventory health.
- `audit`: persistent log writes and audit event emission.

## Request Flow

1. Request hits an Express route.
2. `protect` validates the JWT (from `Authorization` header or `daily_brew_access_token` cookie) and attaches `req.user`.
3. `restrictTo` enforces role access where required.
4. Controllers validate payloads with Zod.
5. Services perform Prisma work inside transactions when needed.
6. Audit logs are written asynchronously (deferred to avoid blocking responses).
7. Domain events are emitted on `globalEventBus` after transaction boundaries.
8. Socket.IO forwards selected events to connected clients.

## Reliability Rules Implemented

- No WebSocket emission inside active Prisma transactions.
- Operational failures use explicit `{ statusCode }` errors.
- Missing resources map to 404.
- Duplicate unique values map to 409 where Prisma signals a conflict.
- Lists are returned with predictable ordering where applicable.
- Event dispatch is deferred and guarded so listener failures are contained.

## API Guide

### Base URL

All API routes are mounted under `/api/v1`.

### Common Response Shape

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "error": { "message": "...", "statusCode": 400 } }
```

### Auth (cookie-based sessions)

Auth has been migrated to an HttpOnly cookie session model (recommended for production):

- Successful login issues two cookies:
  - `daily_brew_access_token` — short-lived access JWT (sent on requests to authenticate).
  - `daily_brew_refresh_token` — long-lived refresh JWT (used to obtain new access tokens).

- Endpoints:
  - `POST /api/v1/auth/login` — accepts `{ username, password }`, sets HttpOnly cookies and returns the user payload.
  - `GET /api/v1/auth/me` — returns the currently authenticated user (uses `daily_brew_access_token` cookie or Authorization header).
  - `POST /api/v1/auth/refresh` — exchanges a valid `daily_brew_refresh_token` cookie for new cookies and user payload.
  - `POST /api/v1/auth/logout` — clears the auth cookies.

- Notes:
  - The backend sets cookies under the `/api/v1` path and uses `SameSite=Lax` by default; in production `secure` is enabled.
  - CORS must be configured to allow credentials from your frontend origin and the frontend API client should use `withCredentials: true`.

### Inventory

All inventory routes require auth.

#### Categories
- `POST /api/v1/inventory/categories` admin only
- `GET /api/v1/inventory/categories` admin or staff
- `GET /api/v1/inventory/categories/:id` admin or staff
- `PUT /api/v1/inventory/categories/:id` admin only
- `DELETE /api/v1/inventory/categories/:id` admin only

#### Ingredients
- `POST /api/v1/inventory/ingredients` admin or staff
- `GET /api/v1/inventory/ingredients` admin or staff
- `GET /api/v1/inventory/ingredients/:id` admin or staff
- `PUT /api/v1/inventory/ingredients/:id` admin only
- `DELETE /api/v1/inventory/ingredients/:id` admin only

Ingredient create and update routes accept multipart upload via the `image` field.

#### Products
- `POST /api/v1/inventory/products` admin only
- `GET /api/v1/inventory/products` admin or staff
- `GET /api/v1/inventory/products/:id` admin or staff
- `PUT /api/v1/inventory/products/:id` admin only
- `DELETE /api/v1/inventory/products/:id` admin only

Product create and update routes accept multipart upload via the `image` field.

#### Suppliers
- `POST /api/v1/inventory/suppliers` admin only
- `GET /api/v1/inventory/suppliers` admin or staff
- `GET /api/v1/inventory/suppliers/:id` admin or staff
- `PUT /api/v1/inventory/suppliers/:id` admin only
- `DELETE /api/v1/inventory/suppliers/:id` admin only

### Orders

All order routes require auth.

#### `POST /api/v1/orders`
- Creates a sale.
- Set `park: true` to save the order without stock deduction.
- Set `park: false` to process FIFO stock deductions immediately.

#### `GET /api/v1/orders/parked`
- Returns parked orders.

#### `PUT /api/v1/orders/parked/:id/finalize`
- Finalizes a parked order.

### Analytics

All analytics routes require auth and admin role.

#### `GET /api/v1/analytics/financials`
- Query params: `start_date`, `end_date`
- Returns revenue, COGS, gross profit, and margin.

#### `GET /api/v1/analytics/product-velocity`
- Query params: `start_date`, `end_date`
- Returns top-selling products.

#### `GET /api/v1/analytics/inventory-health`
- Returns per-ingredient stock health.

### Health

#### `GET /health`
- Public health check.

### Error Mapping

- `401` for missing or invalid auth.
- `403` for blocked roles.
- `404` for missing resources.
- `409` for duplicate or conflicting writes.
- `400` for validation failures.
- `500` for unexpected service failures.

## Socket Guide

### Event Flow

1. Service writes to Prisma.
2. Service emits to `globalEventBus` after the transaction boundary.
3. `src/config/socket.ts` listens for the event bus event.
4. Socket.IO forwards the payload to the intended room or all clients.

### Client Join Events

#### `join_admin_logs`
- Joins `admin_logs_room`.

#### `join_staff_alerts`
- Joins `staff_alerts_room`.

### Server Emitted Events

#### `new_audit_log`
- Sent to `admin_logs_room`.

#### `low_stock_alert`
- Sent to `staff_alerts_room`.

#### `ingredients_invalidate_cache`
- Broadcast to all connected clients.

### Socket Status

Live:
- Socket.IO server bootstrap.
- Room join handlers.
- Audit log fan-out.
- Low stock alert fan-out.
- Ingredients cache invalidation.
- Deferred emission outside Prisma transactions.

Not live:
- Socket authentication middleware.
- Typed client SDK.
- Realtime rate limiting.
- Cross-process event distribution.

## What’s Live

- Backend HTTP API.
- Cookie-based auth and role gating.
- Inventory management.
- Order checkout and parked settlement.
- Analytics reporting.
- Audit logging.
- Realtime notifications.

## What’s Not Live

- OpenAPI/Swagger documentation.
- Separate background worker queue.
- Separate sales module.
- Socket auth handshake.
- Cross-instance event bus.

## Run Commands

From the `backend` folder:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

If you prefer to run the app after building:

```bash
npm run build
NODE_ENV=production node ./dist/server.js
```

## Backend Environment Variables

Create a `.env` file in `backend/` with the following common variables (see `backend/.env.example` if present):

- `DATABASE_URL` — Postgres connection string.
- `JWT_SECRET` — secret used to sign access and refresh tokens.
- `JWT_ACCESS_EXPIRES_IN` — e.g. `15m` (access token lifetime).
- `JWT_REFRESH_EXPIRES_IN` — e.g. `7d` (refresh token lifetime).
- `PORT` — HTTP listen port (default 5000 in dev).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — for uploads.
- `NODE_ENV` — `development` or `production` (affects cookie `secure` flag).

## Notes About Cookies & Frontend Integration

- The frontend must call the API with credentials enabled and should not store JWTs in localStorage. Example Axios client setting:

```js
axios.create({ baseURL: 'http://localhost:5000/api/v1', withCredentials: true })
```

- On the frontend, resolve the session via `GET /api/v1/auth/me` and fall back to `POST /api/v1/auth/refresh` if the access cookie expired.

## Notes

- Prisma generation has already been verified in this workspace.
- The backend is structured to keep network I/O outside active Prisma transactions.
- Inventory and order flows rely on FIFO stock deduction logic.

## Quick curl session (example)

Use this short session to exercise the cookie-based login flow locally. It uses a cookie jar file (`cookies.txt`) so that HttpOnly cookies can be sent by subsequent requests.

1) Login (saves cookies):

```bash
curl --include --request POST 'http://localhost:5000/api/v1/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{"username":"admin_user","password":"secret123"}' \
  --cookie-jar cookies.txt
```

2) Get current user using saved cookies:

```bash
curl --include --request GET 'http://localhost:5000/api/v1/auth/me' \
  --cookie cookies.txt
```

3) Refresh session (updates cookies):

```bash
curl --include --request POST 'http://localhost:5000/api/v1/auth/refresh' \
  --cookie cookies.txt \
  --cookie-jar cookies.txt
```

4) Logout (clears cookies server-side):

```bash
curl --include --request POST 'http://localhost:5000/api/v1/auth/logout' \
  --cookie cookies.txt \
  --cookie-jar cookies.txt
```

Notes:
- Cookies are HttpOnly and cannot be read from browser JavaScript; that is expected.
- Ensure the backend is running on the host/port used above (`localhost:5000`), or change the URLs to match your environment.