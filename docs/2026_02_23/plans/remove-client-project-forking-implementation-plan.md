# Remove Client, Project, and Skill-Forking Concepts - Implementation Plan

**Generated**: 2026-02-23
**Original Request**: Remove all client, project, and skill-forking concepts from the Skills Marketplace across packages/api, packages/shared, and packages/web for MVP simplification.

## Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Strip all client, project, and skill-forking concepts from the shared, API, and web packages to simplify the MVP. This involves deleting 8 files, modifying 16 files, and simplifying GitHub path derivation from `{type}/global/{name}` to `{type}/{name}`. The database will be reset, so no migration is needed. The CLI package is out of scope but will be affected by shared package changes (documented as a known issue).

## Prerequisites

- [ ] Confirm database will be reset after this change (no migration needed)
- [ ] Acknowledge CLI package (`packages/cli/`) will need a separate follow-up to remove `SkillScope`, `SKILL_SCOPES`, `fetchProjects`, and `fetchProjectSkills` references

## Implementation Steps

### Step 1: Clean Up Shared Package - Constants

**What**: Remove `SKILL_SCOPES` and `SkillScope` from the shared constants file.
**Why**: The global/project scope distinction only exists to support project-based skill organization, which is being removed. `INSTALL_TARGETS`, `ITEM_TYPES`, and `API_VERSION` remain.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/constants.ts` - Remove `SKILL_SCOPES` array and `SkillScope` type export

**Changes:**

- Remove the `SKILL_SCOPES` const array declaration
- Remove the `SkillScope` type export

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] `packages/shared/src/constants.ts` only exports `INSTALL_TARGETS`, `InstallTarget`, `ITEM_TYPES`, `ItemType`, and `API_VERSION`
- [ ] Note: typecheck will likely fail at this step due to CLI references to `SkillScope` -- this is expected and will be addressed as a known issue outside this plan's scope
- [ ] All validation commands pass (excluding CLI package errors if present)

---

### Step 2: Clean Up Shared Package - Schemas

**What**: Remove all client, project, fork, and project query schemas from the shared schemas file, and remove `parentSkillId` from `skillSchema`.
**Why**: These schemas define the data contracts for concepts being eliminated. Removing them from the shared package cascades the removal to all consumers.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/schemas.ts` - Remove 7 schema exports and one field

**Changes:**

- Remove the entire `Client Schemas` section (`createClientSchema`, `clientSchema`)
- Remove the entire `Project Schemas` section (`createProjectSchema`, `projectSchema`, `projectWithClientSchema`)
- Remove `forkSkillSchema` from the Skill Schemas section
- Remove `parentSkillId` field from `skillSchema`
- Remove `projectsQuerySchema` from the Query Schemas section

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] No client, project, fork, or projectsQuery schema exports remain in `schemas.ts`
- [ ] `skillSchema` no longer contains `parentSkillId`
- [ ] All remaining schemas (skill, agent, rule, batch upload, skillsQuery, frontmatter parsers) are intact

---

### Step 3: Clean Up Shared Package - Types

**What**: Remove all client, project, fork, and project-skill type exports from the shared types file.
**Why**: These inferred types derive from the schemas removed in Step 2 and would cause compile errors if left in place.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/types.ts` - Remove 7 type exports and their schema imports

**Changes:**

- Remove imports of `clientSchema`, `createClientSchema`, `createProjectSchema`, `forkSkillSchema`, `projectSchema`, `projectWithClientSchema` from the import statement
- Remove type exports: `Client`, `CreateClient`, `CreateProject`, `ForkSkill`, `Project`, `ProjectSkill` (interface), `ProjectWithClient`

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Only `Agent`, `ApiError`, `ApiResponse`, `CreateAgent`, `CreateBatchUpload`, `CreateRule`, `CreateSkill`, `Rule`, `Skill`, `SkillDownloadResponse`, `SkillFile` types remain exported
- [ ] All validation commands pass for the shared package

---

### Step 4: Clean Up API Package - Database Schema

**What**: Remove clients, projects, and projectSkills tables along with their relations from the Drizzle schema, and remove `parentSkillId` from the skills table.
**Why**: These tables back the organizational hierarchy being removed. With the database reset, no migration is needed.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/schema.ts` - Remove 3 tables, 3 relations definitions, simplify 1 relation

**Changes:**

- Remove the entire `Clients` section (`clients` table, `clientsRelations`)
- Remove the entire `Projects` section (`projects` table, `projectsRelations`)
- Remove the entire `Project Skills (Join Table)` section (`projectSkills` table, `projectSkillsRelations`)
- Remove `parentSkillId` column from the `skills` table
- Simplify `skillsRelations` to remove both `parentSkill` and `projectSkills` references
- Remove unused imports from `drizzle-orm/pg-core`: `boolean`, `uniqueIndex` (verify these are not used by remaining tables)
- Remove unused import: `relations` from `drizzle-orm` if no relations remain that use it (agents and rules have empty relations, so `relations` import is still needed)

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Only `agents`, `agentsRelations`, `rules`, `rulesRelations`, `skills`, `skillsRelations` remain in `schema.ts`
- [ ] `skills` table has no `parentSkillId` column
- [ ] All validation commands pass

---

### Step 5: Clean Up API Package - Database Validation Schemas

**What**: Remove all client, project, and projectSkills validation schemas and their supporting constants from the Drizzle-Zod validation file.
**Why**: These validation schemas reference the deleted tables and are no longer needed.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/validation.ts` - Remove 3 sections of schemas, 3 omit constants, and clean up imports

**Changes:**

- Remove imports of `clients`, `projects`, `projectSkills` from `./schema.js`
- Remove `omitClientInsertFields` constant
- Remove `omitProjectInsertFields` constant
- Remove `omitProjectSkillInsertFields` constant
- Remove the entire `Client Schemas` section (`insertClientSchema`, `selectClientSchema`)
- Remove the entire `Project Schemas` section (`insertProjectSchema`, `selectProjectSchema`)
- Remove the entire `Project Skills Schemas` section (`insertProjectSkillSchema`, `selectProjectSkillSchema`)

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Only agent, skill, and rule schemas remain in `validation.ts`
- [ ] All validation commands pass

---

### Step 6: Clean Up API Package - Skill Queries

**What**: Remove project-related query methods and the `parentSkillId` parameter from skill queries.
**Why**: `selectProjectById`, `insertProjectSkill`, and `parentSkillId` on `insertSkill` all support forking/project association which is being removed.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/skill.queries.ts` - Remove 2 methods, simplify 1 method, clean imports

**Changes:**

- Remove import of `projects` and `projectSkills` from `../db/schema.js`
- Remove the `insertProjectSkill` method entirely
- Remove the `selectProjectById` method entirely
- Remove `parentSkillId` from the `insertSkill` method's `values` parameter type

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] `skill.queries.ts` only imports `skills` from schema
- [ ] `insertSkill` values type only has `description`, `githubPath`, `name`, and optional `version`
- [ ] All validation commands pass

---

### Step 7: Delete Client and Project Query and Service Files

**What**: Delete the 4 files for client and project queries and services that are no longer needed.
**Why**: These files entirely implement client and project CRUD operations which are being removed.
**Confidence**: High

**Files to Delete:**

- `packages/api/src/queries/client.queries.ts`
- `packages/api/src/queries/project.queries.ts`
- `packages/api/src/services/client.service.ts`
- `packages/api/src/services/project.service.ts`

**Changes:**

- Delete all 4 files

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] All 4 files are deleted from disk
- [ ] Note: typecheck will fail here because index barrels still reference them -- this is resolved in the next step

---

### Step 8: Update Query and Service Index Barrels

**What**: Remove client and project exports from the queries and services barrel files.
**Why**: The barrel files still re-export the deleted modules, which will cause import resolution failures.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/index.ts` - Remove client and project query exports
- `packages/api/src/services/index.ts` - Remove client and project service exports

**Changes:**

- In `packages/api/src/queries/index.ts`: Remove the `createClientQueries`/`ClientQueries` and `createProjectQueries`/`ProjectQueries` export lines
- In `packages/api/src/services/index.ts`: Remove the `createClientService`/`ClientService` and `createProjectService`/`ProjectService` export lines

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] `queries/index.ts` only exports `AgentQueries`, `RuleQueries`, `SkillQueries` and their factory functions
- [ ] `services/index.ts` only exports `SkillService`, `UploadService` and their factory functions
- [ ] All validation commands pass

---

### Step 9: Clean Up Skill Service - Remove Fork Logic

**What**: Remove the `forkSkill` method and simplify `deriveGithubPath` from `skills/global/{name}` to `skills/{name}`.
**Why**: Forking requires projects and parent-skill tracking, both of which are being removed. The `global` path segment was a namespace for distinguishing global vs project-scoped skills.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/skill.service.ts` - Remove 1 method, simplify 1 function, clean imports

**Changes:**

- Remove `ForkSkill` from the import of `@emergent/shared` types
- Remove the entire `forkSkill` method
- Simplify `deriveGithubPath` to return `skills/${name}` instead of `skills/global/${name}`

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] No `forkSkill` method exists in `skill.service.ts`
- [ ] `deriveGithubPath` returns paths in the format `skills/{name}`
- [ ] All validation commands pass

---

### Step 10: Clean Up Upload Service - Simplify Paths

**What**: Simplify GitHub path derivation for agents and rules in the batch upload service.
**Why**: The `global` path segment is a namespace artifact of the project-scoping system being removed.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/upload.service.ts` - Simplify 3 path derivations

**Changes:**

- Change skill path from `skills/global/${skill.name}` to `skills/${skill.name}`
- Change agent path from `agents/global/${agent.name}` to `agents/${agent.name}`
- Change rule path from `rules/global/${rule.name}` to `rules/${rule.name}`

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] All three path derivations use the simplified format without `global`
- [ ] All validation commands pass

---

### Step 11: Clean Up Skills Router - Remove Fork Endpoint

**What**: Remove the `POST /api/skills/:id/fork` endpoint and its schema import.
**Why**: The fork endpoint creates project-scoped copies of skills, which requires both project and parent-skill tracking.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/routes/skills.ts` - Remove 1 endpoint, clean imports

**Changes:**

- Remove `forkSkillSchema` from the `@emergent/shared` import
- Remove the entire `.post('/:id/fork', ...)` route chain

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Skills router only has GET `/`, GET `/:id`, POST `/`, GET `/:id/download` endpoints
- [ ] No reference to `forkSkillSchema` remains
- [ ] All validation commands pass

---

### Step 12: Delete Client and Project Route Files

**What**: Delete the client and project route handler files.
**Why**: These files define the `/api/clients` and `/api/projects` route groups which are being removed entirely.
**Confidence**: High

**Files to Delete:**

- `packages/api/src/routes/clients.ts`
- `packages/api/src/routes/projects.ts`

**Changes:**

- Delete both files

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Both route files are deleted
- [ ] Note: typecheck will fail until the main app entry point is updated in the next step

---

### Step 13: Update API Entry Point and Environment Types

**What**: Remove all client/project wiring from the main Hono app entry point and clean up the AppEnv type definition.
**Why**: The entry point imports deleted route files, creates deleted query/service factories, and injects them via `c.set()`. The AppEnv type declares the deleted services in its Variables interface.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/types/env.ts` - Remove `clientService` and `projectService` from Variables, clean type imports
- `packages/api/src/index.ts` - Remove all client/project imports, factory instantiations, context injections, and route compositions

**Changes in `packages/api/src/types/env.ts`:**

- Remove `ClientService` and `ProjectService` from the type import
- Remove `clientService` and `projectService` properties from the `Variables` type

**Changes in `packages/api/src/index.ts`:**

- Remove `createClientQueries` and `createProjectQueries` from the queries import
- Remove `clientsRouter` import from `./routes/clients.js`
- Remove `projectsRouter` import from `./routes/projects.js`
- Remove `createClientService` and `createProjectService` from the services import
- Remove `clientQueries` and `projectQueries` instantiations in the middleware
- Remove `clientService` and `projectService` instantiations in the middleware
- Remove `c.set('clientService', ...)` and `c.set('projectService', ...)` calls
- Remove `.route('/api/projects', projectsRouter)` and `.route('/api/clients', clientsRouter)` from the route composition chain

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] `AppEnv.Variables` only contains `db`, `github`, `skillService`, `uploadService`
- [ ] `index.ts` only imports and wires `skillsRouter` and `uploadRouter`
- [ ] Middleware only creates `agentQueries`, `ruleQueries`, `skillQueries` and `skillService`, `uploadService`
- [ ] `AppType` export still works correctly (Hono RPC auto-shrinks)
- [ ] All validation commands pass

---

### Step 14: Clean Up Web Package - API Client

**What**: Remove all client, project, and fork API functions from the web API client.
**Why**: These functions call API endpoints that no longer exist after the backend changes.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/api.ts` - Remove 6 functions and clean type imports

**Changes:**

- Remove `CreateClient`, `CreateProject`, `ForkSkill` from the type import
- Remove `createClient` function
- Remove `createProject` function
- Remove `fetchClients` function
- Remove `fetchProject` function
- Remove `fetchProjects` function
- Remove `fetchProjectSkills` function
- Remove `forkSkill` function
- Remove stale section comments (`// --- Clients`, `// --- Projects`) that become orphaned

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Only `createBatchUpload`, `createSkill`, `downloadSkill`, `fetchSkill`, `fetchSkills` functions remain
- [ ] No client, project, or fork type imports remain
- [ ] All validation commands pass

---

### Step 15: Clean Up Web Package - Query Keys and Delete Hook Files

**What**: Remove client and project query key definitions and delete the query hook files.
**Why**: The query keys reference removed entities, and the hook files wrap removed API functions.
**Confidence**: High

**Files to Delete:**

- `packages/web/src/lib/query/use-clients.ts`
- `packages/web/src/lib/query/use-projects.ts`

**Files to Modify:**

- `packages/web/src/lib/query/keys.ts` - Remove clients and projects key definitions

**Changes:**

- Delete both hook files
- In `keys.ts`: Remove the `clients` key definition (with its `queryKey: null`)
- In `keys.ts`: Remove the `projects` key definition (with its `contextQueries` containing `detail` and `list`)

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] Both hook files are deleted
- [ ] `keys.ts` only defines `skills` query keys
- [ ] All validation commands pass

---

### Step 16: Clean Up Web Package - Skill Stats Component

**What**: Remove the fork/parent reference from the skill stats display component.
**Why**: The component displays "Fork" or "Original" based on `parentSkillId`, which no longer exists on the `Skill` type.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-stats.tsx` - Remove the parentSkillId-based stat

**Changes:**

- Remove the second stat `div` that displays "Fork" or "Original" based on `skill.parentSkillId`
- Adjust the grid layout from `grid-cols-2` to a single-column or single-stat layout since only download count remains (or replace the fork stat with version display)

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] No reference to `parentSkillId` in `skill-stats.tsx`
- [ ] Component still renders download count correctly
- [ ] All validation commands pass

---

### Step 17: Full Workspace Validation

**What**: Run full lint and typecheck across the entire monorepo to catch any remaining issues.
**Why**: Changes cascade across packages via shared types and Hono RPC inference. A full workspace validation ensures nothing was missed.
**Confidence**: High

**Validation Commands:**

```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**

- [ ] All packages pass lint with no errors (warnings acceptable)
- [ ] All packages pass typecheck with no errors (CLI package may have errors due to `SkillScope` removal from shared -- this is the documented known issue)
- [ ] Any warnings or suggestions addressed or documented

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck` (excluding known CLI package impact)
- [ ] All files pass `pnpm lint:fix`
- [ ] No references to `client`, `project`, `fork`, `parentSkillId`, `SKILL_SCOPES`, or `SkillScope` remain in `packages/api/` or `packages/web/`
- [ ] `packages/shared/src/` has no client, project, or fork schema/type exports
- [ ] The Hono `AppType` export compiles and only exposes `/api/skills` and `/api/upload` route groups (plus `/api/health`)
- [ ] GitHub paths use simplified format: `skills/{name}`, `agents/{name}`, `rules/{name}` (no `global` segment)

## Notes

1. **CLI Package Impact (Known Issue)**: The CLI package (`packages/cli/`) imports `SkillScope`, `SKILL_SCOPES` from `@emergent/shared` and uses them in the install command and provider adapters. It also has `fetchProjects` and `fetchProjectSkills` API calls. These will break after this change. A separate follow-up task is required to update the CLI to remove scope selection and project-based workflows. The CLI is explicitly out of scope for this plan.

2. **Database Reset Required**: This plan assumes the database will be completely reset. The Drizzle schema changes remove tables and columns without generating migration files. After completing this plan, run `pnpm db:generate` to create a fresh migration from the new schema, then apply it to a clean database.

3. **GitHub Repository Cleanup**: Existing files stored under `skills/global/`, `agents/global/`, and `rules/global/` paths in the GitHub repository will become orphaned. Consider cleaning up the GitHub repository to remove the `global` subdirectories.

4. **Execution Order**: Steps 1-3 (shared package) must complete before Steps 4-13 (API package), which must complete before Steps 14-16 (web package). This bottom-up order respects the dependency graph: shared is consumed by both API and web, and the Hono `AppType` exported by API is consumed by the web's RPC client.

5. **Step 7 and 12 (File Deletions)**: Typecheck will temporarily fail after deleting files but before updating their barrel imports. Steps 7+8 and 12+13 should be executed together to minimize time in a broken state.
