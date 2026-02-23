# Implementation Plan: Agent and Rule Feature Parity with Skills

**Generated**: 2026-02-23
**Original Request**: Extend the API package to bring agents and rules to full feature parity with skills
**Scope**: API package only (plus minor shared schema additions)

## Analysis Summary

- Feature request refined with project context
- Discovered 22 files across api and shared packages
- 4 new files to create, 8 existing files to modify
- Generated 9-step implementation plan

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Extend the API package so agents and rules have the same query, service, and routing layers that skills already have. This means adding list/detail/create/download endpoints for both agents and rules, creating dedicated service layers for each, expanding the query layers with missing methods, and refactoring the batch upload service to delegate per-type logic to the new services rather than containing inline logic. The shared package also needs minor schema and type additions to support the new query and response shapes.

## Prerequisites

- [x] Confirm that the `agents` and `rules` database tables already exist with the expected schema (verified: `packages/api/src/db/schema.ts` has both tables with all required columns including `downloadCount`, `githubPath`, etc.)
- [x] Confirm that shared Zod schemas for `createAgentSchema`, `createRuleSchema`, `parseAgentMd`, and `parseRuleMd` already exist (verified: `packages/shared/src/schemas.ts` has all of these)
- [x] Confirm that the query barrel export at `packages/api/src/queries/index.ts` already exports `createAgentQueries` and `createRuleQueries` (verified)

## Implementation Steps

### Step 1: Add Query Schemas and Response Types to the Shared Package

**What**: Add `agentsQuerySchema` and `rulesQuerySchema` to the shared schemas file, and add `AgentDownloadResponse` and `RuleDownloadResponse` interfaces to the shared types file.
**Why**: The new route files will need query validation schemas (mirroring `skillsQuerySchema`), and the download endpoints need properly typed response shapes for end-to-end type safety via Hono RPC.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/schemas.ts` - Add two new query schemas at the end of the file
- `packages/shared/src/types.ts` - Add download response types and re-export new schemas as inferred types

**Changes:**

- In `packages/shared/src/schemas.ts`, after the existing `skillsQuerySchema` definition (line 276-278), add `agentsQuerySchema` and `rulesQuerySchema` -- both are `z.object({ search: z.string().optional() })`, identical in shape to `skillsQuerySchema`
- In `packages/shared/src/types.ts`, add imports for `agentsQuerySchema` and `rulesQuerySchema` from schemas
- In `packages/shared/src/types.ts`, add `AgentDownloadResponse` interface with fields: `agent: Agent`, `files: AgentFile[]`, `githubPath: string` (where `AgentFile` mirrors the existing `SkillFile` interface shape)
- In `packages/shared/src/types.ts`, add `RuleDownloadResponse` interface with fields: `rule: Rule`, `files: RuleFile[]`, `githubPath: string` (where `RuleFile` mirrors the existing `SkillFile` interface shape)
- Consider defining a single shared `DownloadableFile` interface instead of three separate file interfaces (`SkillFile`, `AgentFile`, `RuleFile`) since they all share the exact same shape (`downloadUrl`, `name`, `path`, `size`). Replace `SkillFile` with `DownloadableFile` and use it for all three response types. This reduces duplication without changing the public API shape.

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `agentsQuerySchema` and `rulesQuerySchema` are exported from `@emergent/shared`
- [ ] `AgentDownloadResponse`, `RuleDownloadResponse`, and `DownloadableFile` types are exported
- [ ] Existing `SkillDownloadResponse` updated to use `DownloadableFile` instead of `SkillFile` (keep `SkillFile` exported as a type alias for backward compat if the web package references it, otherwise remove)
- [ ] All validation commands pass

---

### Step 2: Expand Agent and Rule Query Layers

**What**: Add `selectAgentById`, `selectAgents` (with optional text search), and `incrementDownloadCount` methods to `agent.queries.ts`. Add the same three methods to `rule.queries.ts`.
**Why**: The services need these query methods to support get-by-id, list, and download-with-count-increment operations -- currently only `insertAgent`/`insertRule` exist.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/agent.queries.ts` - Add three new methods to the factory return object
- `packages/api/src/queries/rule.queries.ts` - Add three new methods to the factory return object

**Changes:**

- In `agent.queries.ts`, add imports for `and`, `eq`, `ilike`, `sql` from `drizzle-orm` (matching the import pattern in `skill.queries.ts`)
- Add `selectAgentById(id: string)` method that selects from `agents` table where `id` matches, returns single result with `| undefined` type assertion (identical pattern to `selectSkillById`)
- Add `selectAgents(filters?: { search?: string })` method that builds an optional `ilike` condition on `agents.name`, applies it as a where clause, and orders by `agents.name` (identical pattern to `selectSkills`)
- Add `incrementDownloadCount(id: string)` method that updates `agents.downloadCount` using `sql` template literal `${agents.downloadCount} + 1` where `id` matches (identical pattern to skill's `incrementDownloadCount`)
- Apply the exact same three additions to `rule.queries.ts`, substituting `rules` table and `rules.*` column references for `agents`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `agent.queries.ts` exports a factory returning four methods: `insertAgent`, `selectAgentById`, `selectAgents`, `incrementDownloadCount`
- [ ] `rule.queries.ts` exports a factory returning four methods: `insertRule`, `selectRuleById`, `selectRules`, `incrementDownloadCount`
- [ ] No changes needed to `packages/api/src/queries/index.ts` since it already re-exports `AgentQueries` and `RuleQueries` types (which are `ReturnType<typeof createXxxQueries>` and will automatically pick up the new methods)
- [ ] All validation commands pass

---

### Step 3: Create Agent Service

**What**: Create `packages/api/src/services/agent.service.ts` following the exact factory pattern of `skill.service.ts`.
**Why**: The agent service encapsulates business logic for creating, listing, fetching, and downloading agents, keeping route handlers thin and logic reusable (e.g., the upload service can delegate to it).
**Confidence**: High

**Files to Create:**

- `packages/api/src/services/agent.service.ts` - Factory function creating an agent service object

**Changes:**

- Import `CreateAgent` type and `agentsQuerySchema` from `@emergent/shared`, plus `parseAgentMd` for frontmatter validation
- Import `HTTPException` from `hono/http-exception`
- Import `GitHubClient` from `../lib/github.js` and `AgentQueries` from `../queries/index.js`
- Export `AgentService` type as `ReturnType<typeof createAgentService>`
- Define `AgentsQuery` type as `z.infer<typeof agentsQuerySchema>`
- Implement `createAgentService(queries: AgentQueries, github: GitHubClient)` factory function
- Include private `deriveGithubPath(name: string)` returning `agents/${name}`
- Implement `createAgent(data: CreateAgent)` method:
  - Find the `.md` file in `data.files` (using `endsWith('.md')`)
  - Throw 400 HTTPException if no `.md` file found
  - Decode base64 content and call `parseAgentMd()` to validate and extract frontmatter
  - Throw 400 with descriptive message on validation failure
  - Derive GitHub path, map files to `${githubPath}/${file.path}` format, call `github.commitFiles()`
  - Call `queries.insertAgent()` passing `name`, `description`, `githubPath`, and frontmatter fields (`color`, `model`, `tools`)
  - Return the inserted record
- Implement `getAgents(query?: AgentsQuery)` delegating to `queries.selectAgents(query)`
- Implement `getAgentById(id: string)` calling `queries.selectAgentById()` with 404 HTTPException if not found
- Implement `downloadAgent(id: string)` calling `selectAgentById`, throwing 404 if missing, calling `incrementDownloadCount`, calling `github.listFiles(agent.githubPath)`, returning `{ agent, files, githubPath }`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `agent.service.ts` exists with exported `AgentService` type and `createAgentService` factory
- [ ] Four public methods: `createAgent`, `getAgents`, `getAgentById`, `downloadAgent`
- [ ] Pattern matches `skill.service.ts` structurally (same error handling, same GitHub-first-then-DB order)
- [ ] All validation commands pass

---

### Step 4: Create Rule Service

**What**: Create `packages/api/src/services/rule.service.ts` following the exact same factory pattern.
**Why**: Same rationale as the agent service -- encapsulate rule-specific business logic for CRUD and download operations.
**Confidence**: High

**Files to Create:**

- `packages/api/src/services/rule.service.ts` - Factory function creating a rule service object

**Changes:**

- Follow the identical structure as `agent.service.ts` from Step 3, with these substitutions:
  - Import `CreateRule` and `rulesQuerySchema` instead of agent equivalents
  - Import `parseRuleMd` instead of `parseAgentMd`
  - Import `RuleQueries` instead of `AgentQueries`
  - Export `RuleService` type and `createRuleService` factory
  - `deriveGithubPath` returns `rules/${name}` instead of `agents/${name}`
  - `createRule(data: CreateRule)` validates via `parseRuleMd`, extracts `frontmatter.paths`, passes `name`, `description`, `githubPath`, `paths` to `queries.insertRule()`
  - `getRules`, `getRuleById` (404), `downloadRule` (increment count, list files) -- same pattern
  - Download return shape is `{ rule, files, githubPath }`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rule.service.ts` exists with exported `RuleService` type and `createRuleService` factory
- [ ] Four public methods: `createRule`, `getRules`, `getRuleById`, `downloadRule`
- [ ] All validation commands pass

---

### Step 5: Update Service Barrel Exports

**What**: Add `AgentService` and `RuleService` exports to `packages/api/src/services/index.ts`.
**Why**: The env types and DI middleware import services from this barrel file; both new services must be accessible from it.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/index.ts` - Add two new export lines

**Changes:**

- Add `export { createAgentService, type AgentService } from './agent.service.js'`
- Add `export { createRuleService, type RuleService } from './rule.service.js'`
- Maintain alphabetical ordering consistent with the existing export style

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `AgentService`, `createAgentService`, `RuleService`, `createRuleService` are all importable from `../services/index.js`
- [ ] All validation commands pass

---

### Step 6: Create Agent Routes

**What**: Create `packages/api/src/routes/agents.ts` with four endpoints mirroring the skills router.
**Why**: This exposes the agent service methods as HTTP endpoints, completing the API surface for agents.
**Confidence**: High

**Files to Create:**

- `packages/api/src/routes/agents.ts` - Hono router with four agent endpoints

**Changes:**

- Import `createAgentSchema` and `agentsQuerySchema` from `@emergent/shared`
- Import `zValidator` from `@hono/zod-validator`
- Import `Hono` from `hono` and `z` from `zod`
- Import `AppEnv` type from `../types/env.js`
- Define local `idParamSchema` as `z.object({ id: z.string().uuid() })` (same as in skills.ts)
- Create `agentsRouter` as `new Hono<AppEnv>()` with chained route definitions:
  - `GET /` - validate query with `agentsQuerySchema`, call `c.get('agentService').getAgents(query)`, return `c.json({ data: agents })`
  - `GET /:id` - validate params with `idParamSchema`, call `getAgentById(id)`, return `c.json({ data: agent })`
  - `POST /` - validate json with `createAgentSchema`, call `createAgent(data)`, return `c.json({ data: agent }, 201)`
  - `GET /:id/download` - validate params with `idParamSchema`, call `downloadAgent(id)`, return `c.json({ data: result })`
- Export `agentsRouter`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `agents.ts` exports `agentsRouter` with four endpoints
- [ ] Route handler pattern matches `skills.ts` exactly (same validation, same response wrapping)
- [ ] All validation commands pass

---

### Step 7: Create Rule Routes

**What**: Create `packages/api/src/routes/rules.ts` with four endpoints mirroring the skills and agents routers.
**Why**: Same rationale as agent routes -- expose rule service methods as HTTP endpoints.
**Confidence**: High

**Files to Create:**

- `packages/api/src/routes/rules.ts` - Hono router with four rule endpoints

**Changes:**

- Follow identical structure as `agents.ts` from Step 6, with these substitutions:
  - Import `createRuleSchema` and `rulesQuerySchema` instead of agent equivalents
  - Create `rulesRouter` instead of `agentsRouter`
  - Use `c.get('ruleService')` instead of `c.get('agentService')`
  - Call `getRules`, `getRuleById`, `createRule`, `downloadRule` instead of agent equivalents
  - Response data keys remain `{ data: ... }` wrapping (consistent with all other routes)
- Export `rulesRouter`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rules.ts` exports `rulesRouter` with four endpoints
- [ ] All validation commands pass

---

### Step 8: Update Dependency Injection Layer (env.ts and index.ts)

**What**: Add `agentService` and `ruleService` to the Hono `Variables` type in `env.ts`, instantiate both in the DI middleware in `index.ts`, and register the new route files on the Hono app.
**Why**: Without updating the DI layer, `c.get('agentService')` and `c.get('ruleService')` calls in the route handlers would be type errors and would return `undefined` at runtime.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/types/env.ts` - Expand `Variables` type with two new service properties
- `packages/api/src/index.ts` - Instantiate services, set on context, register routes, update AppType

**Changes:**

In `env.ts`:
- Add import of `AgentService` and `RuleService` from `../services/index.js` (add to existing import from that path)
- Add `agentService: AgentService` and `ruleService: RuleService` to the `Variables` type object

In `index.ts`:
- Add imports for `agentsRouter` from `./routes/agents.js` and `rulesRouter` from `./routes/rules.js`
- Add imports for `createAgentService` and `createRuleService` from `./services/index.js` (add to existing import)
- In the DI middleware (the `app.use('/api/*', async (c, next) => { ... })` block), after the existing `skillService` creation:
  - Add `const agentService = createAgentService(agentQueries, github)`
  - Add `const ruleService = createRuleService(ruleQueries, github)`
  - Add `c.set('agentService', agentService)`
  - Add `c.set('ruleService', ruleService)`
- In the routes section, update the chained `routes` assignment to include `.route('/api/agents', agentsRouter).route('/api/rules', rulesRouter)` (this is critical for `AppType` to include the new endpoints in the Hono RPC type)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `c.get('agentService')` returns `AgentService` type in route handlers
- [ ] `c.get('ruleService')` returns `RuleService` type in route handlers
- [ ] `AppType` includes all new agent and rule endpoints for Hono RPC type safety
- [ ] All validation commands pass

---

### Step 9: Refactor Upload Service to Delegate to Type Services

**What**: Refactor `upload.service.ts` to accept `SkillService`, `AgentService`, and `RuleService` instead of raw query factories, and delegate per-type validation and DB insertion to those services while keeping the atomic GitHub commit as the upload service's sole responsibility.
**Why**: The current upload service duplicates validation logic (frontmatter parsing, path derivation) that now lives in the type-specific services. Delegating to services eliminates duplication and ensures a single source of truth for each type's business logic.
**Confidence**: Medium -- This step requires careful restructuring.

**Recommended Approach**: Add internal `validateAgent`/`validateRule`/`validateSkill` methods to each type service that perform only frontmatter parsing and path derivation (no side effects). Add `insertAgentRecord`/`insertRuleRecord`/`insertSkillRecord` methods that do only the DB insert. The upload service calls validate methods in Phase 1, does the atomic GitHub commit in Phase 2, then calls insert methods in Phase 3.

**Files to Modify:**

- `packages/api/src/services/agent.service.ts` - Add `validateAgent` and `insertAgentRecord` methods
- `packages/api/src/services/rule.service.ts` - Add `validateRule` and `insertRuleRecord` methods
- `packages/api/src/services/skill.service.ts` - Add `validateSkill` and `insertSkillRecord` methods
- `packages/api/src/services/upload.service.ts` - Rewrite to delegate to service methods
- `packages/api/src/index.ts` - Update `createUploadService` call to pass services instead of queries

**Changes:**

In `skill.service.ts`:
- Add `validateSkill(data: CreateSkill)` method that performs the existing SKILL.md frontmatter validation and returns `{ ...data, githubPath: deriveGithubPath(data.name) }` or throws 400 HTTPException on failure
- Add `insertSkillRecord(values: { description: string; githubPath: string; name: string })` method that delegates directly to `queries.insertSkill(values)` and returns the result
- The existing `createSkill` method can be refactored to call `validateSkill` internally, then commit, then `insertSkillRecord`, reducing duplication within the service itself

In `agent.service.ts`:
- Add `validateAgent(data: CreateAgent)` method that finds the `.md` file, decodes and parses via `parseAgentMd`, derives GitHub path, and returns `{ ...data, frontmatter, githubPath }` or throws 400
- Add `insertAgentRecord(values: { color?: string; description: string; githubPath: string; model?: string; name: string; tools?: string[] })` method that delegates to `queries.insertAgent(values)`
- Refactor `createAgent` to use `validateAgent` and `insertAgentRecord` internally

In `rule.service.ts`:
- Add `validateRule(data: CreateRule)` method, same pattern with `parseRuleMd`
- Add `insertRuleRecord(values: { description: string; githubPath: string; name: string; paths?: string[] })` method that delegates to `queries.insertRule(values)`
- Refactor `createRule` to use `validateRule` and `insertRuleRecord` internally

In `upload.service.ts`:
- Change the factory signature from `createUploadService(skillQueries, agentQueries, ruleQueries, github)` to `createUploadService(skillService: SkillService, agentService: AgentService, ruleService: RuleService, github: GitHubClient)`
- Remove imports of query types, `parseSkillMd`, `parseAgentMd`, `parseRuleMd`
- Import `SkillService`, `AgentService`, `RuleService` types from `../services/index.js` (use `import type` to avoid circular runtime imports)
- Phase 1: Replace inline validation with `skillService.validateSkill(skill)`, `agentService.validateAgent(agent)`, `ruleService.validateRule(rule)` calls
- Phase 2: Keep the atomic GitHub commit logic unchanged
- Phase 3: Replace inline `queries.insertXxx()` calls with `skillService.insertSkillRecord(...)`, `agentService.insertAgentRecord(...)`, `ruleService.insertRuleRecord(...)`

In `index.ts`:
- Update the `createUploadService(...)` call in the DI middleware to pass `(skillService, agentService, ruleService, github)` instead of `(skillQueries, agentQueries, ruleQueries, github)`
- Ensure `agentService` and `ruleService` are created before `uploadService` in the middleware

**Important Note on Circular Imports**: The upload service will import types from the same services barrel that exports it. Since these are `type`-only imports, this will not cause a circular dependency at runtime. Use `import type` syntax explicitly.

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `upload.service.ts` no longer contains any frontmatter parsing logic or direct query calls
- [ ] `upload.service.ts` constructor takes services, not queries
- [ ] Each type service has `validateXxx` and `insertXxxRecord` methods
- [ ] The batch upload endpoint still functions correctly (atomic GitHub commit with sequential DB inserts)
- [ ] `createSkill`, `createAgent`, `createRule` methods internally use their own validate + insert methods (no logic duplication)
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] `AppType` export in `index.ts` includes agent and rule routes (verify by checking that the `routes` variable chains all five `.route()` calls)
- [ ] No circular runtime imports exist between service files (only `import type` cross-references)
- [ ] Existing skills endpoints and batch upload endpoint remain functional (no behavioral regression)
- [ ] All new endpoints follow identical patterns to existing skills endpoints:
  - `GET /api/agents` and `GET /api/rules` accept `?search=` query parameter
  - `GET /api/agents/:id` and `GET /api/rules/:id` return 404 for missing UUIDs
  - `POST /api/agents` and `POST /api/rules` validate request body and return 201
  - `GET /api/agents/:id/download` and `GET /api/rules/:id/download` increment download count

## Notes

- **No database migrations needed**: The `agents` and `rules` tables already exist with all required columns as confirmed in `packages/api/src/db/schema.ts`.
- **Shared `idParamSchema` duplication**: Both `skills.ts`, `agents.ts`, and `rules.ts` will define their own local `idParamSchema`. Could optionally be extracted to a shared location, but not required for this feature.
- **Web package not in scope**: The web frontend will automatically benefit from the updated `AppType` for Hono RPC type safety once it starts consuming the new endpoints.
- **Step ordering is critical**: Steps 1-2 must precede Steps 3-4 (services depend on query methods and shared schemas). Steps 3-5 must precede Steps 6-7 (routes depend on services being exported). Step 8 must follow Steps 5-7. Step 9 depends on Steps 3-5 being complete.
- **The `DownloadableFile` consolidation in Step 1** is a minor improvement that reduces three identical interfaces to one. If the web package currently imports `SkillFile` by name, keep it as a type alias to avoid breaking downstream consumers.
