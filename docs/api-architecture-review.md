# API Package Architecture Review

**Date:** 2026-02-11
**Scope:** `packages/api` — Hono v4 REST API
**Purpose:** Ensure the API foundation follows best practices before scaling. The API serves both a CLI (`@emergent/skills`) and a web frontend (`@emergent/web`), so consistency, maintainability, and clean patterns are critical.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Architecture Overview](#current-architecture-overview)
- [What's Working Well](#whats-working-well)
- [Issues & Recommendations](#issues--recommendations)
  - [1. No Service Layer](#1-no-service-layer)
  - [2. Inconsistent Error Response Shapes](#2-inconsistent-error-response-shapes)
  - [3. Env Type Duplication Across Route Files](#3-env-type-duplication-across-route-files)
  - [4. Validation Schema Duplication & Confusion](#4-validation-schema-duplication--confusion)
  - [5. idParamSchema Duplicated](#5-idparamschema-duplicated)
  - [6. Race Condition in Rating Endpoint](#6-race-condition-in-rating-endpoint)
  - [7. GitHub Client Created Per Request](#7-github-client-created-per-request)
  - [8. Error Messages Leak Internal Details in Production](#8-error-messages-leak-internal-details-in-production)
  - [9. No Pagination on List Endpoints](#9-no-pagination-on-list-endpoints)
  - [10. projectSlug Logic Duplicated](#10-projectslug-logic-duplicated)
- [Recommended Target Architecture](#recommended-target-architecture)
- [Summary Checklist](#summary-checklist)

---

## Executive Summary

The API has a solid foundation — proper Hono typing, Zod validation on all inputs, a shared types package, and clean Drizzle schemas. However, as we prepare to scale, several structural issues need to be addressed:

1. **No service layer** — business logic lives directly in route handlers, making it hard to reuse, test, and maintain.
2. **Inconsistent error responses** — three different error shapes reach consumers depending on the error source.
3. **Type and schema duplication** — the `Env` type, `idParamSchema`, validation schemas, and utility logic are duplicated across files.
4. **A race condition** in the rating endpoint and a **per-request GitHub client instantiation** that should be cached.

The recommended path forward is to introduce a service layer with proper dependency injection, normalize all error responses, and consolidate duplicated code — all before adding new endpoints.

---

## Current Architecture Overview

```
packages/api/src/
  index.ts                  # App setup, middleware, route mounting, error handling
  db/
    index.ts                # Database connection factory (Neon + Drizzle, cached by URL)
    schema.ts               # Drizzle table definitions (clients, projects, skills, project_skills)
    seed.ts                 # Database seeder script
    validation.ts           # Zod schemas derived from Drizzle via drizzle-zod
  lib/
    github.ts               # GitHub API client (Octokit wrapper)
  routes/
    clients.ts              # Client CRUD (2 endpoints)
    projects.ts             # Project CRUD + project skills (4 endpoints)
    skills.ts               # Skill CRUD, download, rate, fork (6 endpoints)
```

**Total: 12 endpoints** (10 routes + 1 health check + 1 not-found handler)

**Key dependencies:**
- Hono v4 (HTTP framework)
- Drizzle ORM + Neon serverless PostgreSQL
- Zod v4 + `@hono/zod-validator` (request validation)
- Octokit (GitHub API)
- `@emergent/shared` (types, schemas, constants shared with CLI and web)

---

## What's Working Well

These patterns are correct and should be preserved:

- **Typed Hono `Env`** with `Bindings` (env vars) and `Variables` (request-scoped context) — this is the idiomatic Hono pattern for DI.
- **`@hono/zod-validator`** applied to every endpoint that accepts user input — query, param, and JSON body validation is consistent.
- **Consistent `{ data: T }` response envelope** on all success responses — this is exactly what consumers (CLI + web) need.
- **`@emergent/shared` package** — shared Zod schemas and TypeScript types inferred from them. Single source of truth for the contract between API, CLI, and web.
- **Database connection caching** via the `Map<string, Database>` in `db/index.ts` — avoids creating new connections on every request.
- **Clean Drizzle schema** with proper relations, foreign key constraints, and a unique index on `(projectId, skillId)` in the join table.
- **`HTTPException`** usage for known errors (404s) — correct Hono pattern per project rules.
- **Platform-flexible deployment** — supports Cloudflare Workers bindings (`c.env`) with `process.env` fallback.

---

## Issues & Recommendations

### 1. No Service Layer

**Priority:** Critical
**Files affected:** All route files

Every route handler currently contains inline business logic — database queries, data transformations, multi-step orchestration, and computed values. This is the single biggest issue to address before scaling.

**Examples of business logic that belongs in services:**

| Location | Logic | Problem |
|----------|-------|---------|
| `skills.ts:72-85` | GitHub path derivation (global vs project-specific, slug generation) | Duplicated in fork handler too |
| `skills.ts:90-109` | Skill creation + conditional project_skills linkage | Multi-step orchestration in handler |
| `skills.ts:160-162` | Rating average calculation | Business rule in handler |
| `skills.ts:188-228` | Fork: lookup original, lookup project, derive path, insert, link | Complex orchestration |
| `projects.ts:78-111` | Fetch project skills + global skills, merge with dedup | Data aggregation logic in handler |

**Why this matters:**
- **Reusability:** The fork and create handlers both need GitHub path derivation. If another endpoint needs it, we copy-paste again.
- **Testability:** Business logic buried in Hono handlers can only be tested via HTTP integration tests. Services can be unit tested directly.
- **Maintainability:** When business rules change (e.g., path format, rating algorithm), you have to find the handler, parse through HTTP concerns, and modify inline logic.
- **Consistency for consumers:** Both CLI and web call the same API. If business logic is scattered, it's harder to ensure consistent behavior.

**Recommendation:** Create service modules (`SkillService`, `ProjectService`, `ClientService`) that encapsulate all business logic and database queries. Route handlers should become thin orchestrators: validate input, call service, return response.

```typescript
// What a route handler should look like after refactoring:
skillsRouter.post('/', zValidator('json', insertSkillSchema), async (c) => {
  const skillService = c.get('skillService');
  const input = c.req.valid('json');
  const skill = await skillService.create(input);
  return c.json({ data: skill }, 201);
});
```

```typescript
// services/skill.service.ts — owns the business logic
export function createSkillService(db: Database, github: GitHubClient) {
  return {
    async create(input: CreateSkill) {
      const githubPath = await this.resolveGithubPath(input);
      const [skill] = await db.insert(skills).values({ ...input, githubPath }).returning();
      if (!input.isGlobal && input.projectId) {
        await db.insert(projectSkills).values({ projectId: input.projectId, skillId: skill.id });
      }
      return skill;
    },

    async resolveGithubPath(input: { isGlobal: boolean; name: string; projectId?: string }) {
      if (input.isGlobal) return `skills/global/${input.name}`;
      const project = await this.getProjectOrThrow(input.projectId!);
      const slug = project.name.toLowerCase().replace(/\s+/g, '-');
      return `skills/projects/${slug}/${input.name}`;
    },

    // ... rate, fork, download, list, getById
  };
}
```

---

### 2. Inconsistent Error Response Shapes

**Priority:** High
**Files affected:** `index.ts:75-99`, all route files, `@emergent/shared/types.ts`

The `ApiError` type in `@emergent/shared` defines the expected error shape:

```typescript
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
```

But three different error shapes actually reach consumers:

| Error Source | What Consumers Receive |
|-------------|----------------------|
| `app.notFound()` / `app.onError()` | `{ error, message, statusCode }` — matches `ApiError` |
| `HTTPException` via `err.getResponse()` | Hono's default response format (does NOT match `ApiError`) |
| `zValidator` validation failures | Zod's raw error output (does NOT match `ApiError`) |

**Impact:** CLI and web consumers can't reliably parse error responses. They'd need different error-handling code paths depending on what type of error occurred.

**Recommendation:**

1. **Normalize `HTTPException` in `onError`:** Instead of calling `err.getResponse()`, extract the status and message and return your standard `ApiError` shape.

```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      message: err.message,
      statusCode: err.status,
    }, err.status);
  }
  // ... 500 handler
});
```

2. **Add a custom validation error hook to `zValidator`:** Create a reusable hook that transforms Zod errors into the `ApiError` shape.

```typescript
import type { ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

export function validated<T extends keyof ValidationTargets>(target: T, schema: ZodSchema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: 'Validation Error',
        message: result.error.issues.map(i => i.message).join(', '),
        statusCode: 400,
      }, 400);
    }
  });
}
```

---

### 3. Env Type Duplication Across Route Files

**Priority:** Medium
**Files affected:** `index.ts:20-31`, `clients.ts:9-13`, `projects.ts:13-17`, `skills.ts:14-19`

The Hono `Env` type is re-declared in every route file with slightly different shapes:

- `index.ts` — full type with `Bindings` + `Variables` (db, github)
- `clients.ts` — `Variables: { db: Database }`
- `projects.ts` — `Variables: { db: Database }`
- `skills.ts` — `Variables: { db: Database; github: GitHubClient }`

When services are added to context, every file will need updating.

**Recommendation:** Define and export a single `AppEnv` type from one shared location (e.g., `src/env.ts`). All route files import it.

```typescript
// src/env.ts
export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_TOKEN: string;
  };
  Variables: {
    db: Database;
    github: GitHubClient;
    skillService: SkillService;
    projectService: ProjectService;
    clientService: ClientService;
  };
};
```

---

### 4. Validation Schema Duplication & Confusion

**Priority:** Medium
**Files affected:** `db/validation.ts`, `@emergent/shared/schemas.ts`

Two sources of validation schemas exist:

| File | Approach | Used For |
|------|----------|----------|
| `db/validation.ts` | `drizzle-zod` (`createInsertSchema` / `createSelectSchema`) | Client + Project insert/select |
| `@emergent/shared/schemas.ts` | Hand-written Zod schemas | Skill insert, rating, fork, queries |

The overlap is confusing:
- `insertSkillSchema` in `validation.ts` is literally just `export const insertSkillSchema = createSkillSchema` — a re-export alias.
- Client and project insert schemas are derived from Drizzle, but the skill insert schema comes from `shared`.
- `shared` also has `clientSchema` and `projectSchema` that overlap with the select schemas from `drizzle-zod`.

**Recommendation:** Consolidate on one approach. Since `@emergent/shared` already exists and is consumed by CLI + web (which don't have access to Drizzle schemas), make `shared` the single source of truth for all validation schemas. The API's `db/validation.ts` can be reduced to just the `drizzle-zod` select schemas (for internal DB type inference) or eliminated entirely.

---

### 5. idParamSchema Duplicated

**Priority:** Low
**Files affected:** `skills.ts:23`, `projects.ts:19`

The exact same schema is defined in two files:

```typescript
const idParamSchema = z.object({ id: z.string().uuid() });
```

**Recommendation:** Define once and export from `@emergent/shared/schemas.ts` (it's a general-purpose schema that any consumer could use) or from a shared location within the API package.

---

### 6. Race Condition in Rating Endpoint

**Priority:** High
**Files affected:** `skills.ts:149-176`

The rating endpoint performs a **read-then-update**:

```typescript
// Step 1: Read current values
const [skill] = await db.select().from(skills).where(eq(skills.id, id));

// Step 2: Compute in JavaScript
const newTotalRating = skill.totalRating + rating;
const newRatingCount = skill.ratingCount + 1;
const newAverageRating = (newTotalRating / newRatingCount).toFixed(2);

// Step 3: Write back
await db.update(skills).set({ totalRating: newTotalRating, ... });
```

If two users rate the same skill simultaneously, one rating can be lost. Both read the same `totalRating`, both increment, and the second write overwrites the first.

**Recommendation:** Use an atomic SQL update, which is already the pattern used for `downloadCount` on line 129:

```typescript
await db
  .update(skills)
  .set({
    ratingCount: sql`${skills.ratingCount} + 1`,
    totalRating: sql`${skills.totalRating} + ${rating}`,
    averageRating: sql`(${skills.totalRating} + ${rating})::decimal / (${skills.ratingCount} + 1)`,
  })
  .where(eq(skills.id, id))
  .returning();
```

---

### 7. GitHub Client Created Per Request

**Priority:** Medium
**Files affected:** `index.ts:50-54`

The DI middleware creates a new `GitHubClient` (and internally a new `Octokit` instance) on every `/api/*` request:

```typescript
app.use('/api/*', async (c, next) => {
  const github = createGitHubClient({ ... }); // New instance every request
  c.set('github', github);
  await next();
});
```

The database connection is cached via `dbCache`, but the GitHub client is not.

**Recommendation:** Apply the same caching pattern. Since the GitHub config comes from env vars and doesn't change per-request, create the client once:

```typescript
let githubClient: GitHubClient | null = null;

function getGitHubClient(config: GitHubConfig): GitHubClient {
  if (!githubClient) {
    githubClient = createGitHubClient(config);
  }
  return githubClient;
}
```

Or, more elegantly, handle this when refactoring the DI middleware to inject services.

---

### 8. Error Messages Leak Internal Details in Production

**Priority:** Medium
**Files affected:** `index.ts:91-98`

The global error handler sends the raw error message to the client:

```typescript
app.onError((err, c) => {
  // ...
  return c.json({
    error: 'Internal server error',
    message: err.message,  // <-- could contain stack traces, SQL errors, etc.
    statusCode: 500,
  }, 500);
});
```

In production, unexpected errors (database connection failures, ORM errors, etc.) could expose internal implementation details.

**Recommendation:** Send a generic message to the client, log the real error server-side:

```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Known error — safe to return message
    return c.json({ error: err.message, message: err.message, statusCode: err.status }, err.status);
  }

  console.error('Unhandled error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  return c.json({
    error: 'Internal server error',
    message: isProduction ? 'An unexpected error occurred' : err.message,
    statusCode: 500,
  }, 500);
});
```

---

### 9. No Pagination on List Endpoints

**Priority:** Medium
**Files affected:** `skills.ts:26-47`, `projects.ts:24-44`, `clients.ts:18-22`

All list endpoints return every matching record with no limit. As data grows, this will cause performance issues and poor UX.

**Recommendation:** Add `limit` and `offset` (or cursor-based pagination) to all list endpoints. Define a shared pagination schema:

```typescript
// @emergent/shared/schemas.ts
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
```

And a consistent paginated response shape:

```typescript
// @emergent/shared/types.ts
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

---

### 10. projectSlug Logic Duplicated

**Priority:** Low
**Files affected:** `skills.ts:83`, `skills.ts:203`

The slug derivation logic appears in two places:

```typescript
// skills.ts:83
const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');

// skills.ts:203
const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
```

**Recommendation:** Extract into a utility function (or into the `ProjectService` when the service layer is introduced):

```typescript
export function toProjectSlug(projectName: string): string {
  return projectName.toLowerCase().replace(/\s+/g, '-');
}
```

---

## Recommended Target Architecture

```
packages/api/src/
  index.ts                      # App setup, mount middleware + routes
  env.ts                        # Shared AppEnv type (single definition)
  middleware/
    error-handler.ts            # Normalized error responses (ApiError shape)
    inject-dependencies.ts      # DI middleware: db, github, services → context
  routes/
    clients.ts                  # Thin handlers: validate → service → respond
    projects.ts
    skills.ts
  services/
    client.service.ts           # Business logic + DB queries for clients
    project.service.ts          # Business logic + DB queries for projects
    skill.service.ts            # Business logic + DB queries for skills
  db/
    index.ts                    # Database connection factory (unchanged)
    schema.ts                   # Drizzle table definitions (unchanged)
    seed.ts                     # Database seeder (unchanged)
  lib/
    github.ts                   # GitHub API client (unchanged)
```

**Key principles of the target architecture:**

1. **Route handlers are thin** — validate input (via zValidator), call a service method, return `{ data }` or throw.
2. **Services own business logic** — database queries, computed values, multi-step orchestration, external API calls.
3. **DI via Hono context** — middleware creates services once per request (or caches them) and injects via `c.set()`. Services receive their dependencies (db, github) at construction time.
4. **Single `AppEnv` type** — defined once, imported everywhere. When a new service is added, update one file.
5. **Consistent error shape** — all errors (validation, not-found, server) return the `ApiError` format. Consumers always know what to parse.
6. **Pagination built in** — every list endpoint supports `limit`/`offset` from day one.

---

## Summary Checklist

| # | Area | Priority | Status | Action |
|---|------|----------|--------|--------|
| 1 | Service layer | Critical | Missing | Create `SkillService`, `ProjectService`, `ClientService` |
| 2 | Error response consistency | High | Broken | Normalize all errors to `ApiError` shape |
| 3 | Env type duplication | Medium | Duplicated | Single `AppEnv` type in `src/env.ts` |
| 4 | Validation schema duplication | Medium | Confusing | Consolidate on `@emergent/shared` as source of truth |
| 5 | `idParamSchema` duplication | Low | Duplicated | Define once, share across routes |
| 6 | Rating race condition | High | Bug | Use atomic SQL update (like `downloadCount`) |
| 7 | GitHub client per request | Medium | Wasteful | Cache like DB connection |
| 8 | Error message leakage | Medium | Security | Generic message in production |
| 9 | No pagination | Medium | Missing | Add `limit`/`offset` to all list endpoints |
| 10 | `projectSlug` duplication | Low | Duplicated | Extract to utility or service method |
