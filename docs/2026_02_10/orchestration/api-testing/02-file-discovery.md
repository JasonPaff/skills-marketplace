# Step 2: File Discovery

**Started**: 2026-02-10T00:02:00Z
**Completed**: 2026-02-10T00:05:00Z
**Duration**: ~175 seconds
**Status**: Completed

## Input

Refined feature request for comprehensive API testing with DI refactor.

## Discovery Statistics

- Directories explored: 6
- Candidate files examined: 28
- Critical priority files: 7
- High priority files: 6
- Medium priority files: 5
- Low priority files: 5
- Total relevant files: 23
- Existing test files found: 0
- Existing test configuration: None

## Discovered Files

### Critical Priority (Must Be Modified)

| # | File | Why |
|---|------|-----|
| 1 | `packages/api/src/index.ts` | Main Hono app entry point. PRIMARY file for DI refactor. Lines 48-59 hardcode real createDb and createGitHubClient. Must extract createApp factory. |
| 2 | `packages/api/src/routes/skills.ts` | 6 endpoints, most complex route file. Contains GitHub integration, rating math, fork logic. |
| 3 | `packages/api/src/routes/projects.ts` | 4 endpoints. Complex skills merging logic with deduplication. |
| 4 | `packages/api/src/routes/clients.ts` | 2 endpoints. Simplest route, good starting point for test validation. |
| 5 | `packages/api/src/db/index.ts` | Creates Drizzle ORM instances. Exports `Database` type that must be mocked. Has dbCache Map. |
| 6 | `packages/api/src/lib/github.ts` | GitHub client wrapper. Exports `GitHubClient` type. Only `listFiles` used in routes. |
| 7 | `packages/api/package.json` | Must add vitest, test script. Currently zero test dependencies. |

### High Priority (Heavily Referenced)

| # | File | Why |
|---|------|-----|
| 8 | `packages/api/src/db/schema.ts` | 4 Drizzle tables - shapes for mock data. |
| 9 | `packages/api/src/db/validation.ts` | Zod validation schemas from drizzle-zod. Unit test target. |
| 10 | `packages/shared/src/schemas.ts` | Shared Zod schemas used in route validators. |
| 11 | `packages/shared/src/constants.ts` | SKILL_CATEGORIES, RATING_MIN/MAX needed for test data. |
| 12 | `packages/shared/src/types.ts` | TypeScript types for test assertions. |
| 13 | `packages/api/src/db/seed.ts` | Sample data templates for mock data. |

### Medium Priority (Context for Test Design)

| # | File | Why |
|---|------|-----|
| 14 | `packages/api/tsconfig.json` | ESNext module, bundler resolution. Vitest must align. |
| 15 | `tsconfig.base.json` | Base TypeScript config. |
| 16 | `turbo.json` | Needs new "test" task. |
| 17 | `package.json` (root) | May need root "test" script. |
| 18 | `packages/shared/package.json` | Zod v4 workspace dependency. |

### Low Priority (Tangentially Relevant)

| # | File | Why |
|---|------|-----|
| 19 | `packages/api/tsup.config.ts` | Build config, likely no changes. |
| 20 | `packages/api/eslint.config.mjs` | May need test file patterns. |
| 21 | `pnpm-workspace.yaml` | Workspace structure, no changes needed. |
| 22 | `packages/api/.env.example` | Documents env vars. Tests should not need them with DI. |
| 23 | `.claude/rules/hono-routing.md` | Hono conventions for test code. |

## Architecture Insights

### Current DI Pattern (Already Partially in Place)

The codebase already uses Hono context variables (`c.set()` / `c.get()`) for dependency injection. The middleware in `index.ts` lines 48-59 creates real instances and sets them on context. Route handlers access via `c.get('db')` and `c.get('github')` -- they are already DI-friendly.

### DI Refactor Approach

Extract a `createApp({ db, github })` factory that accepts optional overrides:
- In production: `createApp()` with no overrides, falls back to real instances
- In tests: `createApp({ db: mockDb, github: mockGithub })` for testable app
- Route files need NO modification

### External Dependencies to Mock

1. **Database** (`Database` type = `ReturnType<typeof buildDb>`): Drizzle query builder API
2. **GitHub** (`GitHubClient` type = `ReturnType<typeof createGitHubClient>`): Only `listFiles` used in routes

### Endpoint Inventory

- Skills: GET /api/skills, GET /api/skills/:id, POST /api/skills, GET /api/skills/:id/download, POST /api/skills/:id/rate, POST /api/skills/:id/fork
- Projects: GET /api/projects, GET /api/projects/:id, GET /api/projects/:id/skills, POST /api/projects
- Clients: GET /api/clients, POST /api/clients
- App: GET /api/health, notFound handler, onError handler

### New Files to Create

- `packages/api/vitest.config.ts`
- `packages/api/src/__tests__/` directory with test files
- Test helper/fixture files for mock data and factories

## File Path Validation

All 23 discovered files confirmed to exist via file system checks during agent exploration.
