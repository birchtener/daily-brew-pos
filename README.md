# Daily Brew POS Backend

Backend for a point-of-sale and FIFO inventory system built for coffee shop operations.

## At a Glance

| Area | Status |
| --- | --- |
| HTTP API | Live |
| Auth + RBAC | Live |
| Inventory CRUD | Live |
| Orders checkout and settlement | Live |
| Analytics reporting | Live |
| Socket.IO realtime events | Live |
| Frontend app | Not present |
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
- JWT
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

- `auth`: login, registration, and avatar updates.
- `inventory`: categories, ingredients, products, and suppliers.
- `orders`: POS checkout, parked order recall, and parked order settlement.
- `analytics`: financial overview, product velocity, and inventory health.
- `audit`: persistent log writes and audit event emission.

## Request Flow

1. Request hits an Express route.
2. `protect` validates the JWT and attaches `req.user`.
3. `restrictTo` enforces role access where required.
4. Controllers validate payloads with Zod.
5. Services perform Prisma work.
6. Audit logs are written asynchronously.
7. Domain events are emitted on `globalEventBus`.
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

### Auth

#### `POST /api/v1/auth/login`
- Public.
- Body:

```json
{
  "username": "admin_user",
  "password": "secret123"
}
```

#### `POST /api/v1/auth/register`
- Protected.
- Admin only.

#### `PUT /api/v1/auth/avatar`
- Protected.
- Admin or staff.
- Multipart form-data with `avatar` file field.

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
- JWT auth and role gating.
- Inventory management.
- Order checkout and parked settlement.
- Analytics reporting.
- Audit logging.
- Realtime notifications.

## What’s Not Live

- Frontend application.
- OpenAPI/Swagger documentation.
- Separate background worker queue.
- Separate sales module.
- Socket auth handshake.
- Cross-instance event bus.

## Run Commands

From the `backend` folder:

```bash
npm install
npm run dev
npm run build
```

## Notes

- Prisma generation has already been verified in this workspace.
- The backend is structured to keep network I/O outside active Prisma transactions.
- Inventory and order flows rely on FIFO stock deduction logic.