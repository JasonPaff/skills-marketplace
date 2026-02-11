# Query Layer (Data Access Layer) Implementation Plan

**Generated**: 2026-02-11
**Original Request**: "add a query layer to the API implementation that the services can use. The query layer will house all the drizzle code for the different services."

**Refined Request**: Introduce a dedicated query layer (data access layer) into the API package that encapsulates all Drizzle ORM database operations currently inlined within the service layer. The project uses Hono v4 with a factory function pattern (e.g., `createXxxService(db)`) and Drizzle ORM v0.45 with Neon serverless PostgreSQL. Currently, three services -- `skill.service.ts` (13 Drizzle calls), `project.service.ts` (7 Drizzle calls), and `client.service.ts` (2 Drizzle calls) -- contain direct Drizzle query construction using operators like `eq`, `and`, `ilike`, `sql`, and `innerJoin` across four tables (`clients`, `projects`, `skills`, `projectSkills`). The query layer should follow the existing factory function pattern (`createXxxQueries(db)`) returning plain objects with typed query methods, mirroring the convention established by the service layer. Each query module will import the `Database` type from `db/index.ts` and table definitions from `db/schema.ts`, centralizing all Drizzle operator imports within the query layer. Services will become Drizzle-free, delegating all database operations to the corresponding query module.

## Analysis Summary

- Feature request refined with project context
- Discovered 20 files across 6 directories
- Generated 10-step implementation plan
- 22 Drizzle operations to extract across 3 services

## File Discovery Results

### New Files to Create

```
packages/api/src/
  queries/
    index.ts                   # Barrel exports
    client.queries.ts          # createClientQueries(db) -- 2 query functions
    project.queries.ts         # createProjectQueries(db) -- 7 query functions
    skill.queries.ts           # createSkillQueries(db) -- 7 distinct methods (13 calls consolidated)
```

### Existing Files to Modify

| File | Changes |
|------|---------|
| `packages/api/src/services/client.service.ts` | Replace db with ClientQueries |
| `packages/api/src/services/project.service.ts` | Replace db with ProjectQueries |
| `packages/api/src/services/skill.service.ts` | Replace db with SkillQueries |
| `packages/api/src/index.ts` | Update DI middleware to create query instances |

### Drizzle Operations Inventory (22 total)

| Table | SELECT | INSERT | UPDATE | Total |
|-------|--------|--------|--------|-------|
| skills | 7 | 2 | 2 | 11 |
| projects | 4 | 1 | 0 | 5 |
| clients | 2 | 1 | 0 | 3 |
| projectSkills | 1 | 2 | 0 | 3 |

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Extract all 22 Drizzle ORM database operations currently inlined within three service files (`skill.service.ts`, `project.service.ts`, `client.service.ts`) into a dedicated query layer under `packages/api/src/queries/`. Each query module follows the existing factory function pattern (`createXxxQueries(db)`) returning plain objects with typed methods. Services become Drizzle-free, delegating all database access to their corresponding query module while retaining HTTPException throws and business logic. The DI middleware in `src/index.ts` is updated to instantiate query objects and inject them into service factories.

## Prerequisites

- [ ] Existing `pnpm run typecheck` and `pnpm run lint:fix` pass on current codebase (run from `packages/api`)
- [ ] Familiarity with the factory function pattern used in `packages/api/src/services/` and `packages/api/src/lib/github.ts`
- [ ] No other branches modifying the service layer concurrently

## Implementation Steps

### Step 1: Create the Client Query Module

**What**: Create `packages/api/src/queries/client.queries.ts` containing a `createClientQueries(db)` factory function that encapsulates the 2 Drizzle operations currently in `client.service.ts`.
**Why**: This is the simplest query module (only 2 operations) and establishes the pattern for the other modules.
**Confidence**: High

**Files to Create:**

- `packages/api/src/queries/client.queries.ts` - Factory function with typed query methods for the `clients` table

**Changes:**

- Define and export a `createClientQueries(db: Database)` factory function that accepts the `Database` type imported from `../db/index.js`
- Import the `clients` table definition from `../db/schema.js`
- Implement `insertClient(data)` -- accepts `{ name, description }`, performs `db.insert(clients).values(...).returning()`, returns the first row (the inserted client record)
- Implement `selectAllClients()` -- performs `db.select().from(clients).orderBy(clients.name)`, returns the full array
- Export a `ClientQueries` type alias as `ReturnType<typeof createClientQueries>` (mirrors the `ClientService` type pattern)

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `packages/api/src/queries/client.queries.ts` exists and exports `createClientQueries` and `ClientQueries`
- [ ] TypeScript compiles with no errors
- [ ] Linting passes

---

### Step 2: Create the Project Query Module

**What**: Create `packages/api/src/queries/project.queries.ts` containing a `createProjectQueries(db)` factory function that encapsulates the 7 Drizzle operations currently in `project.service.ts`.
**Why**: The project queries use `innerJoin`, multi-column selects, and optional filtering -- establishing the pattern for more complex query extraction.
**Confidence**: High

**Files to Create:**

- `packages/api/src/queries/project.queries.ts` - Factory function with typed query methods for `projects`, `clients`, `projectSkills`, and `skills` tables

**Changes:**

- Define and export a `createProjectQueries(db: Database)` factory function
- Import `Database` type from `../db/index.js`
- Import `clients`, `projects`, `projectSkills`, `skills` table definitions from `../db/schema.js`
- Import Drizzle operators: `eq` from `drizzle-orm`
- Implement 7 query methods, each returning data directly (no HTTPException throws):
  1. `selectClientById(clientId: string)` -- selects from `clients` where `id = clientId`, returns the first row or `undefined`
  2. `insertProject(data)` -- inserts into `projects` with `.returning()`, returns the first row
  3. `selectProjectByIdWithClient(id: string)` -- performs the `innerJoin` select with the 7-column projection (id, name, description, clientId, clientName, isActive, createdAt), returns the first row or `undefined`
  4. `selectProjectsWithClient(clientId?: string)` -- performs the `innerJoin` select with the same 7-column projection, applies optional `where` clause if `clientId` is provided, returns the full array
  5. `selectProjectById(projectId: string)` -- simple select from `projects` by ID, returns first row or `undefined` (used by `getProjectSkills` to verify project existence)
  6. `selectProjectSkillsByProjectId(projectId: string)` -- performs the `innerJoin` select from `projectSkills` joined with `skills`, using the 15-column projection matching the current service code, returns the full array
  7. `selectGlobalSkills()` -- selects from `skills` where `isGlobal = true`, returns the full array
- Export a `ProjectQueries` type alias as `ReturnType<typeof createProjectQueries>`

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `packages/api/src/queries/project.queries.ts` exists and exports `createProjectQueries` and `ProjectQueries`
- [ ] All 7 query methods are defined with correct return types
- [ ] TypeScript compiles with no errors
- [ ] Linting passes

---

### Step 3: Create the Skill Query Module

**What**: Create `packages/api/src/queries/skill.queries.ts` containing a `createSkillQueries(db)` factory function that encapsulates the 13 Drizzle operations currently in `skill.service.ts`.
**Why**: This is the largest query module and contains the most diverse set of operations (select, insert, update with SQL template literals, filtered queries with dynamic conditions).
**Confidence**: High

**Files to Create:**

- `packages/api/src/queries/skill.queries.ts` - Factory function with typed query methods for `skills`, `projects`, and `projectSkills` tables

**Changes:**

- Define and export a `createSkillQueries(db: Database)` factory function
- Import `Database` type from `../db/index.js`
- Import `skills`, `projects`, `projectSkills` table definitions from `../db/schema.js`
- Import Drizzle operators: `eq`, `and`, `ilike`, `sql` from `drizzle-orm`
- Implement query methods that consolidate the 13 Drizzle calls into 7 distinct methods:
  1. `selectSkillById(id: string)` -- selects from `skills` where `id = id`, returns the first row or `undefined`. Replaces 4 identical calls in `downloadSkill`, `forkSkill`, `getSkillById`, and `rateSkill`
  2. `selectProjectById(projectId: string)` -- selects from `projects` where `id = projectId`, returns the first row or `undefined`. Replaces 2 identical calls in `deriveGithubPath` and `forkSkill`
  3. `insertSkill(values)` -- inserts into `skills` with `.returning()`, returns the first row. Accepts the full set of columns used across both `createSkill` and `forkSkill`
  4. `insertProjectSkill(values)` -- inserts into `projectSkills` with `{ projectId, skillId, isCustomized }`, no `.returning()` needed. Replaces 2 identical calls
  5. `incrementDownloadCount(id: string)` -- updates `skills` set `downloadCount = downloadCount + 1` using the `sql` template literal
  6. `updateSkillRating(id: string, data)` -- updates `skills` set `averageRating`, `ratingCount`, `totalRating` where `id = id`, with `.returning()`, returns the first row
  7. `selectSkills(filters?)` -- accepts optional filter parameters (search, category, isGlobal), builds the dynamic `and(...)` condition using `ilike` and `eq`, returns the full array ordered by `skills.name`
- Export a `SkillQueries` type alias as `ReturnType<typeof createSkillQueries>`

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `packages/api/src/queries/skill.queries.ts` exists and exports `createSkillQueries` and `SkillQueries`
- [ ] 7 distinct query methods covering all 13 original Drizzle calls
- [ ] Filter-building logic for `selectSkills` is self-contained within the query method
- [ ] TypeScript compiles with no errors
- [ ] Linting passes

---

### Step 4: Create the Queries Barrel Export

**What**: Create `packages/api/src/queries/index.ts` as a barrel export file re-exporting all query factories and their types.
**Why**: Follows the existing convention established by `packages/api/src/services/index.ts` for clean, centralized imports.
**Confidence**: High

**Files to Create:**

- `packages/api/src/queries/index.ts` - Barrel export for all query modules

**Changes:**

- Re-export `createClientQueries` and `ClientQueries` type from `./client.queries.js`
- Re-export `createProjectQueries` and `ProjectQueries` type from `./project.queries.js`
- Re-export `createSkillQueries` and `SkillQueries` type from `./skill.queries.js`
- Follow the exact export style used in `packages/api/src/services/index.ts`

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `packages/api/src/queries/index.ts` exists and re-exports all 3 factory functions and 3 type aliases
- [ ] Import paths use `.js` extensions consistent with the ESM module resolution
- [ ] TypeScript compiles with no errors
- [ ] Linting passes

---

### Step 5: Refactor the Client Service to Use the Query Layer

**What**: Modify `packages/api/src/services/client.service.ts` to accept a `ClientQueries` instance instead of a `Database` instance.
**Why**: Eliminates direct Drizzle usage from the simplest service first, validating the integration pattern.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/client.service.ts`

**Changes:**

- Change import: remove `Database` from `../db/index.js`, add `ClientQueries` from `../queries/index.js`
- Remove the `clients` import from `../db/schema.js`
- Change factory signature from `createClientService(db: Database)` to `createClientService(queries: ClientQueries)`
- In `createClient`: replace `db.insert(clients).values({...}).returning()` with `queries.insertClient({...})`
- In `getClients`: replace `db.select().from(clients).orderBy(clients.name)` with `queries.selectAllClients()`

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `client.service.ts` has zero imports from `drizzle-orm` or `../db/schema.js`
- [ ] All database operations delegate to `queries.*` methods
- [ ] `ClientService` type remains unchanged from consumers' perspective
- [ ] TypeScript compiles with no errors

---

### Step 6: Refactor the Project Service to Use the Query Layer

**What**: Modify `packages/api/src/services/project.service.ts` to accept a `ProjectQueries` instance instead of a `Database` instance.
**Why**: Removes all Drizzle usage from the project service, keeping only HTTPException throws and business logic.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/project.service.ts`

**Changes:**

- Change import: remove `Database` from `../db/index.js`, add `ProjectQueries` from `../queries/index.js`
- Remove imports: `eq` from `drizzle-orm`, `clients`, `projects`, `projectSkills`, `skills` from `../db/schema.js`
- Change factory signature from `createProjectService(db: Database)` to `createProjectService(queries: ProjectQueries)`
- In `createProject`: replace client verification and project insert with `queries.selectClientById()` and `queries.insertProject()` -- keep HTTPException throw
- In `getProjectById`: replace innerJoin select with `queries.selectProjectByIdWithClient(id)` -- keep HTTPException throw
- In `getProjects`: replace innerJoin select with `queries.selectProjectsWithClient(query?.clientId)`
- In `getProjectSkills`: replace project verification, project-skills join, and global skills select with query methods -- keep skill-merging business logic and HTTPException throw

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `project.service.ts` has zero imports from `drizzle-orm` or `../db/schema.js`
- [ ] HTTPException throws for not-found entities remain in the service
- [ ] Skill-merging business logic remains in `getProjectSkills`
- [ ] `ProjectService` type remains unchanged from consumers' perspective

---

### Step 7: Refactor the Skill Service to Use the Query Layer

**What**: Modify `packages/api/src/services/skill.service.ts` to accept a `SkillQueries` instance alongside the existing `GitHubClient`.
**Why**: Largest refactor -- removes `eq`, `and`, `ilike`, `sql` and all schema imports while preserving business logic and GitHub integration.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/skill.service.ts`

**Changes:**

- Change import: remove `Database` from `../db/index.js`, add `SkillQueries` from `../queries/index.js`
- Remove imports: `and`, `eq`, `ilike`, `sql` from `drizzle-orm`, `projects`, `projectSkills`, `skills` from `../db/schema.js`
- Change factory signature from `createSkillService(db: Database, github: GitHubClient)` to `createSkillService(queries: SkillQueries, github: GitHubClient)`
- In `deriveGithubPath`: replace project lookup with `queries.selectProjectById()` -- keep HTTPException throw and slug logic
- In `createSkill`: replace skill insert and project-skill insert with `queries.insertSkill()` and `queries.insertProjectSkill()`
- In `downloadSkill`: replace skill lookup and download count update with `queries.selectSkillById()` and `queries.incrementDownloadCount()` -- keep GitHub listFiles call
- In `forkSkill`: replace all lookups and inserts with query methods -- keep slug derivation logic
- In `getSkillById`: replace with `queries.selectSkillById()` -- keep HTTPException throw
- In `getSkills`: replace entire filter-building block with `queries.selectSkills(query)`
- In `rateSkill`: replace skill lookup and rating update with query methods -- keep rating calculation logic

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `skill.service.ts` has zero imports from `drizzle-orm` or `../db/schema.js`
- [ ] All 13 Drizzle calls replaced with query method delegations
- [ ] HTTPException throws, rating calculation, and GitHub integration remain untouched
- [ ] `SkillService` type remains unchanged from consumers' perspective

---

### Step 8: Update the DI Middleware and Entry Point

**What**: Modify `packages/api/src/index.ts` to instantiate query objects and pass them to the updated service factories.
**Why**: The service factory signatures have changed -- they now accept query objects instead of raw `Database` instances.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/index.ts`

**Changes:**

- Add import of `createClientQueries`, `createProjectQueries`, `createSkillQueries` from `./queries/index.js`
- In the `/api/*` middleware (lines 35-55), after `db` and `github` instantiation:
  - Create `const clientQueries = createClientQueries(db)`
  - Create `const projectQueries = createProjectQueries(db)`
  - Create `const skillQueries = createSkillQueries(db)`
  - Change `createClientService(db)` to `createClientService(clientQueries)`
  - Change `createProjectService(db)` to `createProjectService(projectQueries)`
  - Change `createSkillService(db, github)` to `createSkillService(skillQueries, github)`

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `src/index.ts` imports from `./queries/index.js`
- [ ] All three query instances are created from `db`
- [ ] All three service factories receive query instances instead of `db` directly
- [ ] TypeScript compiles with zero errors across the entire project
- [ ] Linting passes

---

### Step 9: Verify the Services Barrel Export

**What**: Verify that `packages/api/src/services/index.ts` still correctly re-exports all service factories and types.
**Why**: The service factory signatures changed internally, but `ReturnType<typeof createXxxService>` type aliases should auto-update.
**Confidence**: High

**Files to Verify:**

- `packages/api/src/services/index.ts`

**Changes:**

- No actual changes expected -- verify the 3 existing export lines are still correct

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `services/index.ts` still exports all factory functions and types correctly
- [ ] All consuming files resolve correctly
- [ ] TypeScript compiles with zero errors

---

### Step 10: Full Build Verification

**What**: Run the complete build pipeline to ensure everything compiles and bundles correctly.
**Why**: Final verification that the refactoring did not break the build, types, or lint rules.
**Confidence**: High

**Files to Modify:** None (verification only)

**Validation Commands:**

```bash
cd packages/api && pnpm run lint:fix && pnpm run typecheck && pnpm run build
```

**Success Criteria:**

- [ ] `pnpm run lint:fix` passes with no errors
- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run build` succeeds and produces output in `dist/`
- [ ] `packages/api/src/queries/` directory contains: `index.ts`, `client.queries.ts`, `project.queries.ts`, `skill.queries.ts`
- [ ] No service file imports anything from `drizzle-orm` or `../db/schema.js`
- [ ] Only query files import Drizzle operators and schema tables

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` (run from `packages/api`)
- [ ] All files pass `pnpm run lint:fix` (run from `packages/api`)
- [ ] `pnpm run build` succeeds without errors
- [ ] Zero Drizzle imports (`drizzle-orm`, `../db/schema.js`) remain in any service file
- [ ] All Drizzle operator imports (`eq`, `and`, `ilike`, `sql`) are centralized in query files only
- [ ] All HTTPException throws remain exclusively in service files, not in query files
- [ ] Query functions return `undefined` or arrays (never throw HTTPException)
- [ ] Service public APIs (method signatures and return types) are unchanged -- route handlers require zero modifications
- [ ] The `AppEnv` type in `types/env.ts` requires no changes (service types are inferred via `ReturnType`)

## Notes

- **No route handler changes required.** Routes consume services via `c.get('skillService')` etc., and the service public APIs remain identical. The refactoring is invisible to the route layer.

- **The `AppEnv` type auto-updates.** The `Variables` type references service types via `ReturnType<typeof createXxxService>`, which auto-update since the factory return types are unchanged.

- **Query method consolidation in skill.queries.ts.** The 13 Drizzle calls collapse into 7 distinct query methods because several calls are identical patterns (e.g., "find skill by ID" appears 4 times).

- **The `selectProjectById` method appears in both project.queries.ts and skill.queries.ts.** This is intentional -- each query module is self-contained and domain-scoped. The duplication of a single simple query is the pragmatic choice over cross-module coupling.

- **Filter logic moves into the query layer.** The dynamic condition-building in `getSkills` is inherently a query concern, not business logic.

- **The `db` and `github` variables remain on context.** Leave them in place for potential future use.

- **Execution order for Steps 5-8.** Steps 5-7 modify service factory signatures, causing temporary TypeScript errors in `src/index.ts` until Step 8 resolves them. You can implement Steps 5-8 in a single batch if preferred.
