# API

Express + TypeScript API structured with **clean architecture** principles: dependencies point inward, and the domain does not depend on frameworks or databases.

## Layers

| Layer | Path | Responsibility |
|--------|------|------------------|
| **Domain** | `src/domain/` | Entities and **ports** (interfaces). No Express, no infrastructure imports. |
| **Application** | `src/application/` | Services / use cases. Orchestrate domain logic using ports only. |
| **Infrastructure** | `src/infrastructure/` | Adapters: implementations of ports (e.g. mock or real persistence). |
| **Presentation** | `src/presentation/http/` | HTTP: Express routes and controllers. Translate HTTP ↔ application calls. |

**Dependency rule:** `presentation` → `application` → `domain` ← `infrastructure` (infrastructure implements interfaces defined in domain).

## Request flow (example)

For `GET /api/items`:

1. **Route** (`presentation/http/routes/item.routes.ts`) maps the path to a controller.
2. **Controller** calls the **application service** (`ItemService`).
3. **Service** uses the **`IItemRepository` port** from the domain.
4. **Infrastructure** (`MockItemRepository`) implements that port (replace with a DB-backed class later without changing domain or service contracts).

Composition (wiring implementations to services) lives at the presentation edge (e.g. route file), so the rest of the stack stays easy to test and swap.

## Project layout

```
src/
  domain/
    entities/          # Core types (e.g. Item)
    ports/             # Repository / service interfaces
  application/
    services/          # Use-case / application services
  infrastructure/
    persistence/       # Port implementations (mock, DB, etc.)
  presentation/http/
    controllers/
    routes/
  app.ts               # Express app, middleware, route mounting
  server.ts            # HTTP server bootstrap
```

## Scripts

From the `api/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Run with hot reload (`ts-node-dev`). |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run compiled `node dist/server.js`. |

## Environment

Copy `.env.example` to `.env` and adjust values. Do not commit `.env` (it is listed in the repository root `.gitignore`).

## Adding a feature

1. Define or extend **entities** and **ports** in `domain/`.
2. Add **application** logic that depends only on ports.
3. Implement the port in **infrastructure** (or extend a mock).
4. Expose via **routes** + **controllers** and register the router in `app.ts`.
