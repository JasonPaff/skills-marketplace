# API Testing Implementation Plan

**Generated**: 2026-02-10
**Original Request**: "The API needs testing"
**Refined Request**: Comprehensive test coverage for @emergent/api with Vitest, Hono app.request() integration tests, unit tests for validation schemas, and a dependency injection refactor via createApp factory.

## Analysis Summary

- Feature request refined with project context and user clarification
- Discovered 23 files across 6 directories (7 critical, 6 high, 5 medium, 5 low)
- Generated 11-step implementation plan

## File Discovery Results

### Critical Files (Must Modify)
1. `packages/api/src/index.ts` - Main Hono app, DI refactor target
2. `packages/api/src/routes/skills.ts` - 6 endpoints, most complex
3. `packages/api/src/routes/projects.ts` - 4 endpoints, skills merge logic
4. `packages/api/src/routes/clients.ts` - 2 endpoints, simplest route
5. `packages/api/src/db/index.ts` - Database type to mock
6. `packages/api/src/lib/github.ts` - GitHubClient type to mock
7. `packages/api/package.json` - Add vitest dependency

### High Priority Files (Reference)
8. `packages/api/src/db/schema.ts` - Drizzle table definitions
9. `packages/api/src/db/validation.ts` - Zod validation schemas (unit test target)
10. `packages/shared/src/schemas.ts` - Shared Zod schemas for route validators
11. `packages/shared/src/constants.ts` - SKILL_CATEGORIES, RATING_MIN/MAX
12. `packages/shared/src/types.ts` - TypeScript types for assertions
13. `packages/api/src/db/seed.ts` - Sample data templates

### New Files to Create
- `packages/api/vitest.config.ts`
- `packages/api/src/__tests__/helpers/mock-db.ts`
- `packages/api/src/__tests__/helpers/mock-github.ts`
- `packages/api/src/__tests__/helpers/test-app.ts`
- `packages/api/src/__tests__/integration/clients.test.ts`
- `packages/api/src/__tests__/integration/projects.test.ts`
- `packages/api/src/__tests__/integration/skills.test.ts`
- `packages/api/src/__tests__/integration/app.test.ts`
- `packages/api/src/__tests__/unit/validation.test.ts`

---

## Implementation Plan

### Overview

**Estimated Duration**: 6-8 hours
**Complexity**: High
**Risk Level**: Medium

### Quick Summary

This plan introduces comprehensive test coverage for the `@emergent/api` package by first refactoring the main Hono app entry point to support dependency injection via a `createApp` factory function, then building mock factories for the Database (Drizzle ORM) and GitHubClient dependencies, and finally writing integration tests for all 13 route endpoints plus unit tests for validation schemas. The DI refactor is surgical -- it extracts the existing middleware that hardcodes `createDb`/`createGitHubClient` into a configurable factory while preserving the current production behavior as the default.

### Prerequisites

- Node.js >= 20 and pnpm 10.4.1 installed
- Familiarity with the existing Drizzle ORM schema in `packages/api/src/db/schema.ts` (4 tables: clients, projects, skills, projectSkills)
- Understanding that all route handlers already use `c.get('db')` and `c.get('github')` -- the DI pattern is already partially in place via Hono context variables

---

### Step 1: Install Vitest and Configure Test Infrastructure

**What**: Add Vitest as a dev dependency to `@emergent/api`, create the Vitest configuration file, add a `test` script to the API package, register the `test` task in Turborepo, and add a root-level `test` script.
**Why**: No test infrastructure exists. This establishes the foundation that all subsequent steps depend on.
**Confidence**: High

**Files to Create:**
- `packages/api/vitest.config.ts` - Vitest configuration using `defineConfig`, targeting `node` environment, `include` pattern for `src/__tests__/**/*.test.ts`, `globals: true`

**Files to Modify:**
- `packages/api/package.json` - Add `vitest` to devDependencies, add `"test"` and `"test:watch"` scripts
- `turbo.json` - Add `"test"` task with `"dependsOn": ["^build"]`
- `package.json` (root) - Add `"test"` script: `"turbo test --filter=@emergent/api"`
- `packages/api/tsconfig.json` - Add `"types": ["vitest/globals"]` to compilerOptions

**Validation Commands:**
```bash
cd packages/api && pnpm install && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- `pnpm run test` executes Vitest (may report "no test files found")
- `pnpm run typecheck` passes with vitest globals types
- All validation commands pass

---

### Step 2: Refactor `index.ts` to Export a `createApp` Factory Function

**What**: Extract the Hono app construction into a `createApp` factory that accepts optional `db` and `github` dependencies, keeping current production behavior as the default.
**Why**: The current middleware hardcodes `createDb` and `createGitHubClient`. Tests need to inject mocks without real external connections. Route handlers already use `c.get('db')`/`c.get('github')` so they need no changes.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/index.ts` - Define `AppDependencies` interface with optional `db` and `github` fields. Move all Hono app setup into `createApp(deps?)`. In DI middleware: use `deps.db` if provided, otherwise call `createDb`. Export `createApp` as named export. Keep `export default app` where `app = createApp()`.

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- `createApp` and `Env` exported as named exports
- `export default app` still works for production
- `pnpm run dev` still starts correctly
- All validation commands pass

---

### Step 3: Create the Database Mock Factory

**What**: Create a mock factory producing a fake `Database` object matching the Drizzle ORM query builder interface as used by route handlers.
**Why**: Route handlers call chained Drizzle methods (`db.select().from().where().orderBy()`, `db.insert().values().returning()`, etc.). The mock must return chainable objects with `vi.fn()` at every node.
**Confidence**: Medium

**Files to Create:**
- `packages/api/src/__tests__/helpers/mock-db.ts` - `createMockDb()` factory returning chainable mock matching Database type. Must support: select/from/where/orderBy/innerJoin chains, insert/values/returning chains, update/set/where/returning chains. Each method is a `vi.fn()` for assertion capability.

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- `createMockDb()` produces object where chained calls don't throw
- Each method in chain is a `vi.fn()`
- TypeScript compiles without errors

---

### Step 4: Create the GitHub Client Mock Factory

**What**: Create a mock factory producing a fake `GitHubClient` with all 4 methods as `vi.fn()`.
**Why**: The download endpoint calls `github.listFiles()`. Tests must not make real GitHub API calls.
**Confidence**: High

**Files to Create:**
- `packages/api/src/__tests__/helpers/mock-github.ts` - `createMockGitHubClient()` with `commitFile`, `commitFiles`, `getContents`, `listFiles` as `vi.fn()`. `listFiles` defaults to empty array.

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- All 4 methods are `vi.fn()` instances
- `github.listFiles('path')` resolves to an array
- All validation commands pass

---

### Step 5: Create the Test App Helper

**What**: Create a `createTestApp` helper that wires `createApp` with mock factories, providing a single function for all integration tests.
**Why**: Avoids duplicating mock setup boilerplate across every test file.
**Confidence**: High

**Files to Create:**
- `packages/api/src/__tests__/helpers/test-app.ts` - `createTestApp()` composing `createMockDb()`, `createMockGitHubClient()`, and `createApp({ db, github })`. Returns `{ app, mockDb, mockGithub }`.

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- Returns object with `app`, `mockDb`, `mockGithub`
- `app` is a Hono instance accepting `app.request()` calls
- All validation commands pass

---

### Step 6: Write Integration Tests for Client Routes

**What**: Integration tests for `GET /api/clients` and `POST /api/clients`.
**Why**: Simplest route file -- ideal starting point for establishing test patterns.
**Confidence**: High

**Files to Create:**
- `packages/api/src/__tests__/integration/clients.test.ts`

**Test Cases:**
- GET /api/clients - Returns 200 with data array
- GET /api/clients - Returns 200 with empty array
- POST /api/clients - Returns 201 for valid input
- POST /api/clients - Returns 400 for invalid input (missing name)
- POST /api/clients - Returns 400 for empty name
- Verify Content-Type is application/json

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
```

**Success Criteria:**
- All client route tests pass
- Both happy paths and validation errors tested
- `pnpm run test` exits 0

---

### Step 7: Write Integration Tests for Project Routes

**What**: Integration tests for all 4 project endpoints including the complex skills merge logic.
**Why**: Projects involve innerJoin queries, optional filtering, and skills deduplication.
**Confidence**: Medium

**Files to Create:**
- `packages/api/src/__tests__/integration/projects.test.ts`

**Test Cases:**
- GET /api/projects - List (no filter)
- GET /api/projects?clientId=uuid - Filtered list
- GET /api/projects/:id - Single project with client name
- GET /api/projects/:id - 404 not found
- GET /api/projects/:id - 400 invalid UUID
- GET /api/projects/:id/skills - Merged skills array
- GET /api/projects/:id/skills - Deduplication (project-specific overrides global)
- GET /api/projects/:id/skills - Only global skills when no custom skills
- POST /api/projects - 201 valid input
- POST /api/projects - 404 client not found
- POST /api/projects - 400 missing fields

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
```

**Success Criteria:**
- All 11+ project route tests pass
- Skills merge/deduplication explicitly tested
- 404 and 400 errors verified

---

### Step 8: Write Integration Tests for Skills Routes

**What**: Integration tests for all 6 skill endpoints (list, get, create, download, rate, fork).
**Why**: Most complex route file with GitHub integration, rating math, fork logic, and query filtering.
**Confidence**: Medium

**Files to Create:**
- `packages/api/src/__tests__/integration/skills.test.ts`

**Test Cases (20+):**
- List: no filters, category filter, search filter, isGlobal filter, empty results
- Get: success, 404, invalid UUID
- Create: global skill, project-specific skill, 404 project not found, 400 invalid input, githubPath construction
- Download: success with GitHub file listing, download count increment, 404, verify listFiles called
- Rate: success, rating calculation verified, 404, 400 out of range, 400 missing email
- Fork: success, parentSkillId set, isGlobal false, githubPath from project slug, 404 skill/project, newName override

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
```

**Success Criteria:**
- All 20+ skill route tests pass
- GitHub mock integration verified
- Rating math explicitly tested
- Fork logic with project slug tested

---

### Step 9: Write Integration Tests for App-Level Behavior

**What**: Integration tests for health check, 404 handler, and global error handler.
**Why**: App-level behaviors defined in index.ts outside route files.
**Confidence**: High

**Files to Create:**
- `packages/api/src/__tests__/integration/app.test.ts`

**Test Cases:**
- GET /api/health - Returns 200 with status and timestamp
- GET /api/health - Timestamp is valid ISO 8601
- GET /nonexistent - Returns 404 with error structure
- GET /api/nonexistent - Returns 404
- HTTPException returns correct status and message
- Unhandled error returns 500 with generic structure

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
```

**Success Criteria:**
- Health check validates timestamp format
- 404 handler verifies exact JSON structure
- 500 error handler verifies generic error response

---

### Step 10: Write Unit Tests for Validation Schemas

**What**: Unit tests for Zod validation schemas in `db/validation.ts` and shared schemas.
**Why**: Validation schemas define the API input contract. Unit testing provides fast feedback and documents expected inputs.
**Confidence**: High

**Files to Create:**
- `packages/api/src/__tests__/unit/validation.test.ts`

**Test Cases:**
- insertClientSchema: valid input, empty name, optional description
- insertProjectSchema: valid input, UUID clientId required, empty name
- insertSkillSchema: valid input, name regex (lowercase+hyphens only), category validation, isGlobal boolean
- rateSkillSchema: rating within range, outside range, valid email required
- forkSkillSchema: valid projectId UUID, optional newName
- skillsQuerySchema: all optional, isGlobal string-to-boolean transform
- projectsQuerySchema: optional clientId UUID validation

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
```

**Success Criteria:**
- All validation schema tests pass
- Both valid and invalid inputs tested
- Edge cases covered (empty strings, boundary values, regex patterns)

---

### Step 11: Final Verification and Test Coverage Review

**What**: Run complete test suite, verify all tests pass, confirm lint and typecheck clean across monorepo.
**Why**: Final quality gate ensuring all steps integrate correctly.
**Confidence**: High

**Validation Commands:**
```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run test
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- All tests pass (target: 50+ test cases across 5 test files)
- Zero lint errors in API package
- Zero TypeScript errors in API package
- Monorepo-level typecheck passes

---

## Quality Gates

- All TypeScript files pass `pnpm run typecheck` (API package and monorepo root)
- All files pass `pnpm run lint:fix` with zero remaining errors
- `pnpm run test` passes with all test cases green
- DI refactor does not change production runtime behavior
- No real database connections or GitHub API calls during tests
- Mock factories are reusable and reset-friendly (fresh mocks per test via beforeEach)

## Notes

- **Mock DB chain complexity**: Drizzle ORM uses deep method chaining. The mock must handle chains of varying depth (2-step to 4-step). Every chain method returns the mock proxy, with terminal position being configurable `vi.fn()`. Type assertions (`as unknown as Database`) at the createTestApp boundary are acceptable.
- **Sequential mock return values**: Several endpoints make multiple sequential `db.select()` calls (e.g., fork: lookup skill, then lookup project). Use Vitest's `mockResolvedValueOnce` for this.
- **Zod v4 compatibility**: Project uses Zod v4. The `safeParse` API is stable across v3/v4.
- **No CORS in tests**: `app.request()` bypasses CORS (browser-only enforcement). Expected and correct.
- **dotenv import guard**: The top-level `await import('dotenv/config')` runs only when `NODE_ENV !== 'production'`. In tests, set `NODE_ENV=test` in Vitest config or ensure the conditional skips for test environment.
