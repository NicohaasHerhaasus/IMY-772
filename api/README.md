# IMY-772 API — Backend overview


## Quick start

1. **PostgreSQL** must be running and reachable. Create a database (e.g. `imy772`) matching `DB_NAME` in `.env`.
2. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your real DB credentials and a strong `JWT_SECRET` for anything beyond local dev.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. On startup the server checks the DB, runs a small **migration** (creates `users` table if needed), then listens on `PORT` (default `3000`).

5. Health check: `GET http://localhost:3000/health`

---

## What is clean architecture (simple version)?

**Goal:** keep the **rules of the app** (who can register, how passwords are checked, what a user is) **independent** of **details that change often** (Express routes, PostgreSQL, JWT libraries).

Imagine concentric circles:

- **Inside:** “what the application *does*” and core types.
- **Outside:** “how we talk to the world” (HTTP, SQL, hashing libraries).

**Rule of thumb:** code in the center should **not import** Express or `pg`. Outer layers call inward; inner layers define **interfaces** (ports) that outer layers **implement**.

That way you can:

- Change the database or add tests with a **fake repository** without rewriting register/login logic.
- Keep HTTP response shapes and status codes in one place (controllers + error middleware).

This project uses **folder names** (`domain`, `application`, `infrastructure`, `presentation`) that are common in backend code. They line up with the classic “Entities → Use cases → Interface adapters → Frameworks” picture like this:

| Classic idea | Our folders (roughly) |
|--------------|------------------------|
| Entities, core rules | `src/domain/` |
| Use cases (orchestration) | `src/application/` |
| Adapters (DB, HTTP glue) | `src/infrastructure/`, `src/presentation/` |
| Frameworks (Express, `pg`) | Used inside infrastructure & presentation |

You do **not** have to use those exact classic names in folders; the **important part** is **which module imports which**.

---

## How this repo maps to those ideas

| Layer | Path | What lives here |
|-------|------|------------------|
| **Domain** | `src/domain/` | **User** shape, **roles**, and the **repository port** (`IUserRepository`) — contracts only, no Express/`pg`. |
| **Application** | `src/application/` | **Auth service** (register / login / profile), **DTOs** + validation helpers, **typed errors** for HTTP mapping. |
| **Infrastructure** | `src/infrastructure/` | **PostgreSQL** user repository, **connection pool**, **migrations**, **bcrypt** and **JWT** helpers. |
| **Presentation** | `src/presentation/http/` | **Routes**, **controllers**, **middleware** (auth, validation, errors). |
| **Config** | `src/config/` | Reading **env** into settings (e.g. DB connection options). Not business logic. |

**Composition (wiring):** `auth.routes.ts` creates concrete classes (`PostgresUserRepository`, `PasswordService`, `TokenService`) and passes them into `AuthService` and `AuthController`. That wiring sits at the **edge** so inner layers stay unaware of which DB or framework you chose.

---

## The dependency rule

**Intended direction (inner = stable, outer = details):**

- `presentation` may call `application` and uses Express types.
- `application` orchestrates use cases and should **not** depend on `express` or `pg`.
- `domain` has **no** framework or database imports.
- `infrastructure` implements **ports** (e.g. `IUserRepository`) and talks to PostgreSQL, bcrypt, JWT libraries.

**In *strict* clean architecture,** the application layer would depend only on **interfaces** for hashing and tokens too, with implementations in infrastructure. **In this repo,** `AuthService` imports **`PasswordService`** and **`TokenService`** concrete classes from `infrastructure` as a **pragmatic shortcut** (fewer files). The important inversion is still **`IUserRepository`**: you can swap Postgres for another store without changing the service’s *shape* of work, as long as you inject a different implementation.

**Avoid:**

- `domain` importing `application`, `infrastructure`, or `presentation` (the core should stay framework-free).
- Putting SQL, `pg`, or Express `req`/`res` inside `AuthService` — keep that in infrastructure and presentation.

**Normal pattern:** `infrastructure` **does** import from `domain` (to implement `IUserRepository` and map rows to your `User` type). That direction is correct.

---

## Folder-by-folder guide

```
src/
  app.ts                 # Express app: global middleware, mounts routes, error handler
  server.ts              # Boot: DB ping, migrations, then listen

  config/
    database.config.ts   # Builds DB config from environment variables

  domain/
    entities/            # user.entity.ts — core User type
    enums/               # role.enum.ts — admin / user
    ports/               # user.repository.port.ts — IUserRepository interface

  application/
    dtos/                # register.dto.ts, login.dto.ts — request shapes + validate* functions
    errors/              # app.errors.ts — AppError, ValidationError, etc.
    services/            # auth.service.ts — register, login, getProfile

  infrastructure/
    database/
      pool.ts            # Singleton pg Pool (reused DB connections)
      migrations/        # 001_create_users.ts — schema setup
    persistence/
      postgres-user.repository.ts  # IUserRepository for PostgreSQL
    security/
      password.service.ts          # bcrypt hash/compare
      token.service.ts             # JWT sign/verify

  presentation/http/
    controllers/         # auth.controller.ts — maps HTTP ↔ AuthService
    routes/              # auth.routes.ts — paths + middleware + wiring
    middleware/          # auth, validation, error handling
```

---

## How a request flows through the layers

This section walks from **the moment the request hits the machine** down to **the database and back**, in order. The **order of middleware in `app.ts` matters**: Express runs each `app.use` from top to bottom until something sends a response or calls `next(err)`.

### 1. Before any HTTP request: the process is listening

1. You run `npm run dev`, which starts **`server.ts`**.
2. **`server.ts`** loads **`app.ts`**, connects to PostgreSQL, runs migrations, then calls **`app.listen(PORT)`**.
3. Node’s HTTP server opens a **listening socket** (e.g. port `3000`). It is now waiting for TCP connections from clients (browser, Postman, the frontend, etc.).

Nothing in “clean architecture” runs yet — this is just **boot + network setup**.

### 2. The request arrives at the server

1. The client sends an HTTP message (e.g. `POST /api/auth/register`) over **TCP** to your host and port.
2. Node accepts the connection and hands the raw HTTP stream to **Express**.
3. Express builds a **`req`** (incoming request: method, URL, headers, body stream) and a **`res`** (object used to write status, headers, body back). This is still **inside the framework** — not your domain code.

### 3. Global middleware in `app.ts` (every request, in this order)

Defined in [`src/app.ts`](src/app.ts):

| Step | What runs | What it does |
|------|-----------|----------------|
| A | `express.json()` | Reads the body for JSON requests. If the body is **not valid JSON** (e.g. trailing comma), parsing fails and Express forwards an error to **`errorMiddleware`** → **400** with a clear message. If OK, parsed fields appear on **`req.body`**. |
| B | `cors()` | Adds CORS headers so browsers (your React app on another origin) are allowed to call the API. Does not change your business logic. |

Then Express **matches the path**:

- **`GET /health`** → handled immediately by the inline handler; response is sent and **nothing else** in the stack runs for that request.
- Any path starting with **`/api/auth`** → forwarded to the **auth router** (still in `app.ts`: `app.use('/api/auth', authRoutes)`).

So for auth routes, the request has already passed **JSON parsing** and **CORS** before it reaches your routes file.

### 4. Auth router (`auth.routes.ts`) — path + per-route middleware

The router is mounted at **`/api/auth`**, so:

- Route `POST /register` → full URL is **`POST /api/auth/register`**
- Route `POST /login` → **`POST /api/auth/login`**
- Route `GET /me` → **`GET /api/auth/me`**

Express matches **method + path** and runs the **middleware chain for that route** in order.

**For `POST /api/auth/register` and `POST /api/auth/login`:**

1. **`validate(validateRegisterDTO)`** or **`validate(validateLoginDTO)`** runs. It reads **`req.body`** and, if something is wrong, calls **`next(new ValidationError(...))`**. That **skips** the controller and jumps to **error handling** (see below).
2. If validation passes, **`next()`** runs and Express calls the **controller** method.

**For `GET /api/auth/me`:**

1. **`authMiddleware`** runs first. It reads **`Authorization: Bearer <token>`**, uses **`TokenService`** to verify the JWT, and sets **`req.userId`** (and role). On failure it calls **`next(UnauthorizedError)`**.
2. If OK, the **controller** `getProfile` runs.

The router file is also where **dependency injection** happens: it constructs **`PostgresUserRepository`**, **`AuthService`**, **`AuthController`** once at startup. Each request reuses those instances.

### 5. Controller (`auth.controller.ts`) — HTTP ↔ application

The controller is a **thin adapter**:

- It takes **`req`** / **`res`** / **`next`** (Express).
- It calls **`authService.register(req.body)`** (or login / getProfile) with **plain data**, not HTTP objects.
- On success it sets **status code** and **JSON shape** (`{ status: 'success', data: ... }`).
- On failure it does **`next(error)`** so it does not send HTML or inconsistent JSON — the **error middleware** does that.

At this point you cross from **presentation** into **application** (`AuthService`).

### 6. Application service (`auth.service.ts`) — use case

This is the **orchestration** step (no Express here):

- **Register:** check email not taken (`IUserRepository`), hash password (`PasswordService`), create user (repository), sign JWT (`TokenService`), return user without password + token.
- **Login:** find user, compare password, sign JWT.
- **Profile:** load user by id, strip password.

If something is wrong it **throws** `ConflictError`, `UnauthorizedError`, `NotFoundError`, etc. The controller catches and forwards with **`next(error)`**.

### 7. Infrastructure — database and crypto

- **`PostgresUserRepository`** runs **SQL** via the shared **`Pool`**. PostgreSQL executes the query and returns rows; the repository maps rows to your **`User`** type.
- **`PasswordService`** / **`TokenService`** call **bcrypt** and **jsonwebtoken**.

### 8. Response travels back

1. The service **returns** a value to the controller.
2. The controller sends **`res.status(...).json(...)`**.
3. Express flushes the HTTP response to the client.

### 9. When something goes wrong: `errorMiddleware`

Registered **last** in `app.ts` with **four arguments** `(err, req, res, next)` so Express treats it as the **error handler**.

Errors can enter it from:

- **Invalid JSON** (body parser),
- **Validation middleware** (`ValidationError`),
- **Auth middleware** (`UnauthorizedError`),
- **Controller** `next(error)` from **`AppError`** subclasses.

The middleware picks the right **HTTP status** and **JSON body** and sends the response. That is why controllers use **`next(error)`** instead of duplicating error JSON everywhere.

### Flow diagram (mental model)

```text
Client
  → TCP / HTTP into Node
  → Express builds req, res
  → express.json()  →  cors()
  → match /health OR mount /api/auth
  → auth: validate* OR authMiddleware
  → AuthController
  → AuthService
  → IUserRepository (PostgresUserRepository) + Pool → PostgreSQL
                    PasswordService / TokenService
  ← return through service → controller → res.json()
  (or next(err) → errorMiddleware → res.json() error)
```

---

## HTTP API reference

Base path for auth: **`/api/auth`**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness check |
| `POST` | `/api/auth/register` | No | Create user; returns user + JWT |
| `POST` | `/api/auth/login` | No | Sign in; returns user + JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Current user profile |

**Register body (JSON):** `name`, `surname`, `email`, `password` (min 8 chars), optional `role` (`admin` or `user`).

**Login body (JSON):** `email`, `password`.

**Protected routes:** header `Authorization: Bearer <token>`.

**JSON bodies** must be valid JSON (no trailing commas after the last property).

---

## Adding a new feature

1. **Domain:** Add or extend **entities**, **enums**, and **ports** (interfaces) in `src/domain/` if the core model or persistence contract changes.
2. **Application:** Add **DTOs** + validators, **errors** if needed, and a **service** (use case) that only talks to **ports** and plain types—not to `pg` or Express.
3. **Infrastructure:** Implement new or updated ports (e.g. new repository methods, new migration file if the schema changes).
4. **Presentation:** Add **routes**, **middleware** if shared, **controller** handlers (or inline handlers), and register the router in **`app.ts`**.
5. **Errors:** Throw **`AppError`** subclasses (or `ValidationError`) so **`errorMiddleware`** returns consistent responses.

For **sampling sites**, rivers, and field data, you would repeat the same pattern: entity + port → service → Postgres adapter → HTTP routes.

---
