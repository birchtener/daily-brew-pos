# Enterprise POS & FIFO Inventory Management System: Technical Engine Documentation
## Note: Frontend TODO
### This reference document provides a complete, low-level operational breakdown of the Point-of-Sale (POS) and First-In, First-Out (FIFO) Inventory Management backend engine.

## Core Directory File Map
```text
src/
├── config/
│   └── db.ts                         # Singly-instantiated Prisma PgAdapter Client pool
├── middlewares/
│   ├── auth.middleware.ts            # Bearer token validation & request context hydration
│   ├── rbac.middleware.ts            # Declarative role gating
│   └── error.middleware.ts           # Async exception catcher & automated database rollback logger
└── modules/
    ├── audit/
    │   └── audit.service.ts          # Asynchronous database-driven write engine
    ├── auth/
    │   ├── auth.validation.ts        # Zod typing parameters for employee creation
    │   ├── auth.service.ts           # Crypto password compiler & session emitter
    │   ├── auth.controller.ts        # Express runtime request mapping
    │   └── auth.routes.ts            # Isolation route maps for identity domains
    ├── inventory/
    │   ├── inventory.validation.ts   # Catalog and intake structural validation contracts
    │   ├── recipe.validation.ts      # Bill of materials formatting matrices
    │   ├── fifo.service.ts           # The FIFO inventory allocation algorithm
    │   ├── inventory.service.ts      # Catalog, supplier, and intake logic execution
    │   ├── recipe.service.ts         # BOM recipe transaction handlers
    │   ├── inventory.controller.ts   # Logistics controller pipeline maps
    │   └── inventory.routes.ts       # Network boundaries for logistics endpoints
    ├── orders/
    │   ├── orders.validation.ts      # Settle and parking array schemas
    │   ├── orders.service.ts         # POS transaction runner & allocation caller
    │   ├── orders.controller.ts      # Checkout queue parameter controllers
    │   └── orders.routes.ts          # Terminal transaction endpoint routes
    └── analytics/
        ├── analytics.validation.ts   # Date scope range validators
        ├── analytics.service.ts      # Relational analytics and margin metrics aggregators
        ├── analytics.controller.ts   # Business metrics controller mappings
        └── analytics.routes.ts       # Protected admin reporting endpoint routes
```

## Global Subsystem & Middleware Specification
### 1. Database Pooling Utility (`src/config/db.ts`)
- Operational Objective: Instantiates and exposes a single database connection using the @prisma/adapter-pg driver adapter.
- Technical Engine Role: Prevents database connection exhaustion by binding the client pool to the execution process, maintaining a single query hub for your modules.

### 2. Runtime Token Guard Middleware (`src/middlewares/auth.middleware.ts`)
- Function Name: protect(req, res, next)
- Operational Objective: Authorizes incoming requests by parsing JSON Web - Tokens from headers.
- Internal Pipeline Steps:
  1. Evaluates if the incoming request contains an Authorization header prefixed with Bearer .
  2. Validates the signature using jwt.verify() against your JWT_SECRET key.
  3. Transforms and attaches the payload details—including id, username, and role properties—directly onto Express's request lifecycle state context (req.user).

### 3. Role Gating Middleware (`src/middlewares/rbac.middleware.ts`)
- Function Name: restrictTo(...allowedRoles)
- Operational Objective: Blocks non-administrative personnel from executing sensitive endpoints.
- Internal Pipeline Steps:
  1. Scans the attached session payload context created by the protect guard middleware.
  2. Compares the user's role criteria against your defined permissions array.
  3. Blocks unauthorized callers with an immediate 403 Access Denied envelope if their credentials do not match permissions requirements.

### 4. Global Error Catching Interceptor (`src/middlewares/error.middleware.ts`)
- Function Name: errorHandler(err, req, res, next)
- Operational Objective: Intercepts failures, cleans database execution error details, logs issues, and formats response objects uniformly.
- Internal Pipeline Steps:
  1. Catches unhandled runtime errors, routing exceptions, and verification warnings.
  2. Automatically formats structural response envelopes down to clean 400 or 500 status codes.
  3. Extracts active user identity tags to log route crashes using the system AuditService.

## Domain Module Breakdowns & Method Specifications
### 1. `modules/audit` (System Logging System)
#### `AuditService.log({ message, category, type, userId })`
- Input Scope: message (string), category (LogCategory), type (LogType), userId (UUID string).
- Business Execution Logic: Writes persistent system metrics rows directly into your Log database ledger table.
- Internal Failure Mitigation: Wraps operations in localized `try/catch` safety loops. If database clusters lose availability, the service defaults to printing logs directly to system standard output (`console.error`), ensuring events remain traceable even during severe service degradation.

### 2. `modules/auth` (Identity & Access Operations)
```text
[POST /register] ──► Zod Contract Guard ──► Hashing (Bcrypt) ──► Write User Row ──► Emit Admin Audit Log
[POST /login]    ──► Zod Contract Guard ──► Compare Hash      ──► Generate JWT   ──► Emit Session Audit Log
```
#### `AuthService.register(input, currentActorId)`
- Input Scope: Parsed registration payload object, optional parent creator string parameter.
- Business Execution Logic:
  1. Queries the database to ensure the selected username is not already assigned to an employee.
  2. Salts and hashes passwords through a heavy 12-round bcrypt cost calculation loop.
  3. Inserts the user record, assigns system permissions roles, and registers the account trace using the AuditService.

#### `AuthService.login(input)`
- Input Scope: Login contract input properties (`username`, `password`).
- Business Execution Logic:
  1. Looks up target account records matching the input username parameter.
  2. Validates credentials using bcrypt.compare() against the stored database password hash.
  3. If valid, generates an authorization JWT containing user metadata, logs a connection stamp, and passes the token to your interface layers.

### 3. modules/inventory (Logistics, Catalog, & FIFO Engine)
#### `InventoryService.createCategory(input, userId)`
- Input Scope: Category configuration name payload property, active user session signature.
- Business Execution Logic: Inserts a new root inventory category classification row into your Category layout index table.
#### `InventoryService.createProduct(input, userId)`
- Input Scope: Product configuration object payload, active user session signature.
- Business Execution Logic: Populates menu data configurations inside the `Product` index table, registering items at baseline retail menu price variables.
#### `InventoryService.createSupplier(input, userId)`
- Input Scope: Supplier information fields, active user session signature.
- Business Execution Logic: Registers standard warehouse vendor identities to map physical raw ingredient supply manifests.
#### `InventoryService.createIngredient(input, userId)`
- Input Scope: Ingredient fields (`name`, `unit`), active user session signature.
- Business Execution Logic: Standardizes measurement units (e.g., `kg`, `l`, `ml`, `pcs`) across raw warehouse commodities before processing supplier order sheets.
#### `InventoryService.receiveSupplierOrder(input, userId)`
- Input Scope: Comprehensive incoming manifest array containing batch items, expiration arrays, and transaction costs.
- Business Execution Logic: Runs within an isolated transaction block (`$transaction`). It creates an entry tracking log inside the `SupplierOrders` table, generates child rows inside the `IngredientBatches` tracking ledger, sets remaining inventory indicators to match the incoming quantity received, and captures item costs to compute accurate financial reporting metrics.
#### `RecipeService.setProductRecipe(input, userId)`
- Input Scope: Recipe schema map matching parent products to raw warehouse sub-ingredients.
- Business Execution Logic: Uses an atomic database write-loop. It purges any old ingredient mappings for the product ID to prevent constraint row collisions, iterates through the new input component lists, and builds updated production mappings inside the `Recipes` bill of materials table.
#### `FIFOService.calculateFIFODeduction(tx, ingredientId, totalRequiredQuantity)`
- Input Scope: Active transactional database client context, component identifier, required fractional resource volume.
- Business Execution Logic:
  1. Queries available `IngredientBatches` records for the specific material ID where stock remaining is greater than zero, sorting records by arrival date (`received_at asc`).
  2. Iterates through rows chronologically to exhaust available stock from the oldest incoming batch before moving to the next.
  3. Decrements inventory balances row-by-row and calculates precise Cost of Goods Sold values by multiplying consumed volumes against specific original batch costs.
  4. Throws a protective `STOCKOUT EXCEPTION` rollback error if required volumes exceed on-hand batch totals, safely halting terminal checkout processes during supply shortfalls.

### 4. `modules/orders` (POS Transaction Matrix)
```
                  ┌──────────────────────┐
                  │ POST /api/v1/orders  │
                  └──────────┬───────────┘
                             │
                     [Is park: true?]
                       /          \
                     YES           NO
                     /              \
         ┌──────────▼───┐        ┌───▼────────────────────────┐
         │ Status: PARK │        │ Status: COMPLETED          │
         │ Save Line    │        │ Run FIFO Deductions        │
         │ Item Rows    │        │ Save Cost Logs to Deduct   │
         └──────────────┘        │ Process Payment Receipt    │
                                 └────────────────────────────┘
```

#### `OrdersService.processOrder(input, userId)`
- Input Scope: Checkout payload array containing selected items, optional promo code strings, and parking flags.
- Business Execution Logic:
  1. Pulls active price configurations from the `Product` table to verify prices on the backend, recalculating subtotal and final transaction balances safely.
  2. Creates parent ledger records inside the `Orders` table, setting statuses dynamically based on the input choice (`parked` vs. `completed`).
  3. If the order is marked as `completed`, it loops through line items, resolves associated recipe profiles, calls the `FIFOService` to drain active batches, and logs usage data inside the `OrderItemStockDeductions` tracking table.
#### `OrdersService.checkoutParkedOrder(orderId, input, userId)`
- Input Scope: URL target string identifier, updated line items layout parameters, active user signature.
- Business Execution Logic:
- Verifies that the parked order exists in the database with an active `parked` status context.
- Deletes old, cached line items to allow modification of the order before final checkout.
- Maps and updates the order with the new items array, updates parent totals, and sets the transaction status to `completed`.
- Runs the production recipe deduction loop, processes inventory levels through the FIFO engine, and writes a permanent ledger transaction record inside the `Payments` table.
#### `OrdersService.getParkedOrders()`
- Input Scope: None.
- Business Execution Logic: Retrieves active rows from the `Orders` table where the status is set to `parked`, returning cached orders so cashiers can quickly recall pending checkout queues.

### 5. `modules/analytics`(Business Intelligence Core)
#### `AnalyticsService.getFinancialOverview(filters)`
- Input Scope: Optional date filtering strings (`start_date`, `end_date`).
- Business Execution Logic:
  1. Queries the `Order`s table to calculate net store sales revenue across completed sales transactions within the selected timeframe.
  2. Sums historical cost data from the `OrderItemStockDeductions` table to calculate precise Cost of Goods Sold values matching actual FIFO batch acquisitions.
  3. Calculates real-time gross profit metrics and margins, protecting against division-by-zero crashes on empty database instances.
#### `AnalyticsService.getTopProducts(filters)`
- Input Scope: Date filtering parameters.
- Business Execution Logic: Uses database-level grouping (`groupBy`) on the `OrderItems` table to aggregate volumes and revenue across completed orders. It isolates the top ten highest-performing items and joins product descriptions to return clear, chart-ready datasets.
#### `AnalyticsService.getInventoryHealth()`
- Input Scope: None.
- Business Execution Logic:
  1. Scans raw materials tables and includes all associated open supplier rows where remaining stock values are greater than zero.
  2. Sums open batch quantities to calculate current on-hand inventory totals for each raw material.
  3. Evaluates balances to flag materials dynamically, returning indicators like OUT_OF_STOCK, LOW_STOCK_ALERT, or HEALTHY to inform reorder decisions.

## Developer Execution Reference: API Architecture Validation
### Below is an end-to-end integration checklist mapping typical user interactions to backend route paths, request models, and internal operational workflows.

```typescript
// 1. SYSTEM INITIALIZATION
// Ensure your .env configuration contains a valid DATABASE_URL string, then provision your Root Administrator:
// Command: npx tsx prisma/seed.ts

// 2. ADMIN AUTHENTICATION
// Path: POST /api/v1/auth/login
// Input Contract: LoginSchema -> Returns authorization JWT string

// 3. LOGISTICS PROVISIONING (ADMIN ONLY)
// Path: POST /api/v1/inventory/categories -> Register structural divisions
// Path: POST /api/v1/inventory/products   -> Populate sales item records with price parameters
// Path: POST /api/v1/inventory/ingredients-> Define unit matrices (kg, g, l, ml)

// 4. SUPPLY LINE INTRODUCTIONS
// Path: POST /api/v1/inventory/suppliers  -> Register supplier vendor profiles
// Path: POST /api/v1/inventory/intake     -> Receive stock, populating IngredientBatches with cost_per_unit variables

// 5. PRODUCTION MAPPING
// Path: POST /api/v1/inventory/products/recipe -> Map Product IDs to fractional raw ingredient components

// 6. TERMINAL OPERATIONS
// Path: POST /api/v1/orders              -> Process sales. Pass "park": true to cache baskets, or "park": false to trigger FIFO stock deductions
// Path: GET  /api/v1/orders/parked       -> Recall pending cached baskets
// Path: PUT  /api/v1/orders/parked/:id/finalize -> Modify quantities, collect payment, and deduct inventory via FIFO rules

// 7. EXECUTIVE MANAGEMENT (ADMIN ONLY)
// Path: GET /api/v1/analytics/financials       -> Monitor exact revenue, COGS, and profit margin statistics
// Path: GET /api/v1/analytics/product-velocity -> Track store sales velocity performance
// Path: GET /api/v1/analytics/inventory-health  -> View live asset balances and stock status alerts
```