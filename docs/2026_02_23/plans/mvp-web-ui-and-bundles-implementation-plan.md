# MVP Web UI with Bundle Entity - Implementation Plan

**Generated**: 2026-02-23
**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan introduces a `bundles` entity across the full stack (database schema, API layers, shared schemas, and web frontend) and builds out the MVP web UI with a unified marketplace homepage, detail pages for all entity types, and an upload page. The bundle entity groups skills, agents, and rules that were uploaded together via batch upload, tracked through three join tables. The web frontend replaces the placeholder home page with a TanStack React Table-powered data table showing all item types, with filtering, search, sorting, and URL-driven state.

## Prerequisites

- [ ] Ensure local development environment runs (`pnpm dev` starts API on :8787 and Web on :3000)
- [ ] Database connection is configured via `DATABASE_URL` in `.env`
- [ ] GitHub credentials configured (`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`)
- [ ] Confirm `@lukemorales/query-key-factory` is installed in web package (already in `package.json`)

## Implementation Steps

### Step 1: Add Bundle Zod Schemas and Types to Shared Package

**What**: Define bundle-related Zod schemas in `packages/shared/src/schemas.ts`, inferred types in `packages/shared/src/types.ts`, and add `'bundle'` to the `ITEM_TYPES` constant in `packages/shared/src/constants.ts`.
**Why**: The shared package defines the contract used across API validation, frontend type inference, and CLI. All other layers depend on these schemas, so they must come first.
**Confidence**: High

**Files to Modify:**
- `packages/shared/src/schemas.ts` - Add bundle schemas
- `packages/shared/src/types.ts` - Add Bundle types
- `packages/shared/src/constants.ts` - Add 'bundle' to ITEM_TYPES

**Changes:**
- In `schemas.ts`, add a `createBundleSchema` with fields: `name` (same lowercase-alphanumeric-with-hyphens pattern used for skills/agents/rules), `description` (string, min 1, max 500). No files array since bundles are metadata-only records linking existing items.
- In `schemas.ts`, add a `bundleSchema` extending `createBundleSchema` with `id` (uuid), `githubPath` (string), `downloadCount` (non-negative integer), `uploadedAt` (iso datetime).
- In `schemas.ts`, add a `bundlesQuerySchema` with optional `search` string, matching the pattern used by `skillsQuerySchema`, `agentsQuerySchema`, and `rulesQuerySchema`.
- In `schemas.ts`, add a `bundleWithItemsSchema` that extends `bundleSchema` with optional arrays: `skills` (array of `skillSchema`), `agents` (array of `agentSchema`), `rules` (array of `ruleSchema`).
- In `types.ts`, import the new schemas and add inferred types: `Bundle`, `BundleWithItems`, `CreateBundle`, `BundlesQuery`, and a `BundleDownloadResponse` interface following the same pattern as `SkillDownloadResponse`.
- In `constants.ts`, change `ITEM_TYPES` from `['skill', 'agent', 'rule']` to `['skill', 'agent', 'rule', 'bundle']`.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `bundleSchema`, `createBundleSchema`, `bundlesQuerySchema`, and `bundleWithItemsSchema` are exported from `schemas.ts`
- [ ] `Bundle`, `BundleWithItems`, `CreateBundle`, `BundlesQuery`, and `BundleDownloadResponse` types are exported from `types.ts`
- [ ] `ITEM_TYPES` includes `'bundle'` and `ItemType` union includes `'bundle'`
- [ ] All validation commands pass

---

### Step 2: Add Bundles Table and Join Tables to Database Schema

**What**: Define the `bundles` table and three join tables (`bundle_skills`, `bundle_agents`, `bundle_rules`) in the Drizzle ORM schema, plus corresponding insert/select validation schemas.
**Why**: The database schema must exist before queries, services, or routes can reference it. The join tables establish the many-to-many relationships between bundles and their contained items.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/db/schema.ts` - Add bundles table, 3 join tables, and relations
- `packages/api/src/db/validation.ts` - Add bundle insert/select schemas

**Changes:**
- In `schema.ts`, add a `bundles` pgTable with columns: `id` (uuid, primaryKey, defaultRandom), `name` (varchar 100, notNull), `description` (varchar 500, notNull), `githubPath` (varchar 500, notNull), `downloadCount` (integer, default 0, notNull), `uploadedAt` (timestamp with timezone, defaultNow, notNull). Follow the same column ordering convention as existing tables.
- Add `bundleSkills` pgTable with columns: `bundleId` (uuid, references `bundles.id`), `skillId` (uuid, references `skills.id`), with a composite primary key of both columns.
- Add `bundleAgents` pgTable with same pattern referencing `agents.id`.
- Add `bundleRules` pgTable with same pattern referencing `rules.id`.
- Add Drizzle `relations()` for `bundles` pointing to the three join tables, and relations for each join table pointing back to bundles and the respective entity.
- Update existing `agentsRelations`, `rulesRelations`, and `skillsRelations` to include their join table relations.
- In `validation.ts`, add `insertBundleSchema` and `selectBundleSchema` using `createInsertSchema`/`createSelectSchema` from `drizzle-zod`, omitting `id`, `downloadCount`, and `uploadedAt` from the insert schema.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `bundles`, `bundleSkills`, `bundleAgents`, `bundleRules` tables exported from `schema.ts`
- [ ] Relations properly defined for all join tables and the bundles table
- [ ] `insertBundleSchema` and `selectBundleSchema` exported from `validation.ts`
- [ ] All validation commands pass

---

### Step 3: Generate and Apply Database Migration

**What**: Generate a Drizzle migration from the schema changes and apply it to the database.
**Why**: The database must match the updated schema before any queries can execute against the new tables.
**Confidence**: High

**Validation Commands:**
```bash
pnpm db:generate && pnpm db:migrate
```

**Success Criteria:**
- [ ] Migration file generated in the drizzle migrations directory
- [ ] Migration applied successfully with no errors
- [ ] `bundles`, `bundle_skills`, `bundle_agents`, `bundle_rules` tables exist in the database

---

### Step 4: Create Bundle Queries

**What**: Create `packages/api/src/queries/bundle.queries.ts` following the factory pattern, and export from the queries index.
**Why**: The queries layer provides database access functions that the service layer depends on. It must follow the `createXxxQueries(db)` factory pattern used by skill, agent, and rule queries.
**Confidence**: High

**Files to Create:**
- `packages/api/src/queries/bundle.queries.ts` - Bundle query factory

**Files to Modify:**
- `packages/api/src/queries/index.ts` - Export bundle queries

**Changes:**
- Create `bundle.queries.ts` with a `createBundleQueries(db: Database)` factory function returning an object with these methods:
  - `selectBundles(filters?: { search?: string })` - Query bundles with optional name ilike filter, ordered by name.
  - `selectBundleById(id: string)` - Select single bundle by ID.
  - `selectBundleWithItems(id: string)` - Select bundle by ID and query the three join tables to resolve the associated skills, agents, and rules.
  - `insertBundle(values: { description: string; githubPath: string; name: string })` - Insert a bundle record and return it.
  - `linkSkillToBundle(bundleId: string, skillId: string)` - Insert into `bundleSkills` join table.
  - `linkAgentToBundle(bundleId: string, agentId: string)` - Insert into `bundleAgents` join table.
  - `linkRuleToBundle(bundleId: string, ruleId: string)` - Insert into `bundleRules` join table.
  - `incrementDownloadCount(id: string)` - Same SQL increment pattern as other entities.
- Export `BundleQueries` type and the `createBundleQueries` function.
- In `queries/index.ts`, add export for `createBundleQueries` and `BundleQueries` type.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `createBundleQueries` factory function follows the exact same pattern as `createSkillQueries`
- [ ] All eight query methods implemented
- [ ] Exported from `queries/index.ts`
- [ ] All validation commands pass

---

### Step 5: Create Bundle Service

**What**: Create `packages/api/src/services/bundle.service.ts` following the factory pattern, and export from the services index.
**Why**: The service layer contains business logic and orchestrates between queries and GitHub.
**Confidence**: High

**Files to Create:**
- `packages/api/src/services/bundle.service.ts` - Bundle business logic

**Files to Modify:**
- `packages/api/src/services/index.ts` - Export bundle service

**Changes:**
- Create `bundle.service.ts` with a `createBundleService(queries: BundleQueries, github: GitHubClient)` factory function. Export `BundleService` type.
- Implement these methods:
  - `getBundles(query?)` - Delegate to `queries.selectBundles(query)`.
  - `getBundleById(id)` - Call `queries.selectBundleWithItems(id)`, throw `HTTPException(404)` if not found.
  - `createBundle(data: { name, description })` - Derive `githubPath` as `bundles/${name}`. Insert record via queries. Return the created bundle.
  - `createBundleWithLinks(data: { name, description, skillIds, agentIds, ruleIds })` - Create the bundle record, then link each item ID via the appropriate query method.
  - `downloadBundle(id)` - Fetch bundle with items, increment download count, aggregate all GitHub files from linked items.
- In `services/index.ts`, add export.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `createBundleService` follows the exact factory pattern of `createSkillService`
- [ ] Five service methods implemented
- [ ] Exported from `services/index.ts`
- [ ] All validation commands pass

---

### Step 6: Create Bundle Routes

**What**: Create `packages/api/src/routes/bundles.ts` with GET list, GET by ID, GET download, and POST create endpoints.
**Why**: The routes expose the bundle service methods as REST API endpoints.
**Confidence**: High

**Files to Create:**
- `packages/api/src/routes/bundles.ts` - Bundle REST endpoints

**Changes:**
- Create a `bundlesRouter` as a `new Hono<AppEnv>()` with chained route definitions:
  - `GET /` - Validate query with `bundlesQuerySchema`, call `getBundles(query)`, return `c.json({ data: bundles })`.
  - `GET /:id` - Validate param with `idParamSchema`, call `getBundleById(id)`, return bundle with populated items.
  - `POST /` - Validate JSON body with `createBundleSchema`, call `createBundle(data)`, return 201.
  - `GET /:id/download` - Validate param, call `downloadBundle(id)`, return download response.
- Follow the exact same structure as `packages/api/src/routes/skills.ts`.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Four route handlers defined
- [ ] All use `zValidator` for input validation
- [ ] Router exported for mounting
- [ ] All validation commands pass

---

### Step 7: Wire Bundle DI and Routes into API Index

**What**: Add bundle query creation, service instantiation, and context injection to the API middleware, mount bundle routes, and include them in the `AppType` export chain.
**Why**: Without wiring into the DI middleware and route chain, the bundle endpoints will not be accessible and the Hono RPC type will not include bundle routes.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/types/env.ts` - Add `bundleService` to Variables
- `packages/api/src/index.ts` - Wire DI, mount routes, update route chain

**Changes:**
- In `env.ts`, add `bundleService: BundleService` to the `Variables` type.
- In `index.ts`:
  - Import `createBundleQueries`, `createBundleService`, and `bundlesRouter`.
  - In the DI middleware, create `bundleQueries` and `bundleService`, inject via `c.set('bundleService', bundleService)`.
  - Add `.route('/api/bundles', bundlesRouter)` to the `routes` chain.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `bundleService` is available on the Hono context
- [ ] Bundle routes mounted at `/api/bundles`
- [ ] `AppType` includes bundle route types
- [ ] All validation commands pass

---

### Step 8: Modify Upload Service to Auto-Create Bundles

**What**: Update `upload.service.ts` to automatically create a bundle record when a batch upload contains multiple items.
**Why**: Batch uploads with multiple items should automatically generate a bundle to group them together.
**Confidence**: Medium

**Files to Modify:**
- `packages/api/src/services/upload.service.ts` - Add bundle creation to batch flow
- `packages/api/src/index.ts` - Pass `bundleService` to `createUploadService`

**Changes:**
- Modify `createUploadService` signature to accept `bundleService: BundleService` as an additional parameter.
- After Phase 3 (database record insertion), add Phase 4: if total inserted items > 1, create a bundle via `bundleService.createBundleWithLinks()`.
- Derive bundle name from item names or timestamp.
- Add the created bundle to the return value.
- In `index.ts`, update the `createUploadService` call to pass `bundleService`.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Batch uploads with 2+ items automatically create a bundle record
- [ ] All inserted items are linked to the bundle via join tables
- [ ] Single-item uploads do not create a bundle
- [ ] All validation commands pass

---

### Step 9: Extend Web API Client with Agent, Rule, and Bundle Functions

**What**: Add API client functions for agents, rules, and bundles to `packages/web/src/lib/api.ts`.
**Why**: The frontend needs typed API client functions. Currently only skill functions exist.
**Confidence**: High

**Files to Modify:**
- `packages/web/src/lib/api.ts` - Add agent, rule, bundle API functions

**Changes:**
- Add 4 agent functions: `fetchAgents`, `fetchAgent`, `downloadAgent`, `createAgent`
- Add 4 rule functions: `fetchRules`, `fetchRule`, `downloadRule`, `createRule`
- Add 3 bundle functions: `fetchBundles`, `fetchBundle`, `downloadBundle`
- All functions use the existing `hc<AppType>()` client and `throwIfNotOk()` helper.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] 11 new API functions added
- [ ] All use the existing client and `throwIfNotOk` pattern
- [ ] Type-safe via Hono RPC
- [ ] All validation commands pass

---

### Step 10: Create React Query Key Factory and Hooks

**What**: Create the query key factory and individual hook files for each entity type.
**Why**: React Query hooks provide the data-fetching layer for the frontend.
**Confidence**: High

**Files to Create:**
- `packages/web/src/lib/query/keys.ts` - Query key factory
- `packages/web/src/lib/query/use-skills.ts` - Skills hooks
- `packages/web/src/lib/query/use-skill.ts` - Single skill hook
- `packages/web/src/lib/query/use-agents.ts` - Agents hooks
- `packages/web/src/lib/query/use-rules.ts` - Rules hooks
- `packages/web/src/lib/query/use-bundles.ts` - Bundles hooks
- `packages/web/src/lib/query/use-create-skill.ts` - Skill creation mutation
- `packages/web/src/lib/query/use-batch-upload.ts` - Batch upload mutation

**Changes:**
- In `keys.ts`, use `createQueryKeyStore` from `@lukemorales/query-key-factory` for skills, agents, rules, bundles keys.
- Each list hook: `useQuery` with factory key and fetch function.
- Each detail hook: `useQuery` with detail key, enabled only when id is truthy.
- `useCreateSkill`: `useMutation` invalidating skills list on success.
- `useBatchUpload`: `useMutation` invalidating all entity list keys on success.

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Query key factory created with keys for all four entity types
- [ ] 8 hook files created
- [ ] All hooks use the query key factory
- [ ] Mutation hooks invalidate appropriate keys on success
- [ ] All validation commands pass

---

### Step 11: Build the Marketplace Home Page

**What**: Replace the placeholder in `page.tsx` with a unified marketplace data table.
**Why**: This is the primary user-facing view of the marketplace.
**Confidence**: Medium

**Files to Modify:**
- `packages/web/src/app/page.tsx` - Replace placeholder

**Files to Create:**
- `packages/web/src/app/_components/marketplace-table.tsx` - Client component for the data table

**Changes:**
- `page.tsx`: Server Component with `PageHeader` and `MarketplaceTable` client component.
- `marketplace-table.tsx`: `'use client'` component that:
  - Fetches all four entity types via hooks
  - Normalizes into unified row objects with `id`, `type`, `name`, `description`, `downloadCount`, `uploadedAt`
  - Uses `nuqs` for URL-driven `search` and `type` filter state
  - Uses `useDebouncedValue` for search debounce
  - Renders toolbar with search `Input`, type filter `Select`, result count
  - Defines `ColumnDef` array: Type (Badge), Name (link), Description, Downloads, Uploaded, Actions (copy CLI + download)
  - Passes data to existing `DataTable` component
  - Loading and error states handled

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Home page displays data table with all four entity types
- [ ] Type badges with distinct colors per entity type
- [ ] Search input filters with debouncing
- [ ] Type filter dropdown works
- [ ] Column sorting works
- [ ] URL state via nuqs is shareable
- [ ] Actions column has copy CLI and download buttons
- [ ] All validation commands pass

---

### Step 12: Create Detail Pages for All Entity Types

**What**: Create detail pages at `skills/[id]/page.tsx`, `agents/[id]/page.tsx`, `rules/[id]/page.tsx`, and `bundles/[id]/page.tsx`.
**Why**: Users need to view detailed information about each item.
**Confidence**: High

**Files to Create:**
- `packages/web/src/app/skills/[id]/page.tsx` - Skill detail page
- `packages/web/src/app/agents/[id]/page.tsx` - Agent detail page
- `packages/web/src/app/rules/[id]/page.tsx` - Rule detail page
- `packages/web/src/app/bundles/[id]/page.tsx` - Bundle detail page

**Changes:**
- Each detail page: Server Component receiving `params` with `id` (await params in Next.js 16).
- Renders `BackLink` to `/`, then a client component that:
  - Calls the appropriate `useXxx(id)` hook
  - Shows loading state, error state via `ErrorAlert`
  - Renders metadata in a `Card`: name, description, type badge, download count, uploaded date, GitHub path
  - Download button and "Copy CLI command" button
- Skill-specific: version field
- Agent-specific: model, color, tools list
- Rule-specific: paths array
- Bundle-specific: contained items listed as three sections with links to detail pages

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] All four detail pages render at their routes
- [ ] Full metadata displayed
- [ ] Bundle detail shows linked items with navigation
- [ ] Download and copy CLI actions work
- [ ] All validation commands pass

---

### Step 13: Create the Upload Page

**What**: Build an upload page at `packages/web/src/app/upload/page.tsx`.
**Why**: Users need a way to upload new items through the web UI.
**Confidence**: Medium

**Files to Create:**
- `packages/web/src/app/upload/page.tsx` - Upload page
- `packages/web/src/app/upload/_components/upload-form.tsx` - Client component with form logic

**Changes:**
- `page.tsx`: Server Component with `PageHeader` and `UploadForm` client component.
- `upload-form.tsx`: `'use client'` component that:
  - Provides file drop zone accepting folders and `.zip` files
  - Uses `detectFolderStructure` and `extractZipFiles` from existing utilities
  - Shows preview of detected items with validation status
  - For single-skill uploads: name and description fields from frontmatter
  - For batch uploads: summary table of detected items by type
  - Submit button calling appropriate mutation hook
  - Success redirects to detail page or home
  - Error display via `ErrorAlert`

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Upload page renders at `/upload`
- [ ] File input accepts folder and ZIP uploads
- [ ] Structure detection works for single and batch
- [ ] Preview shows detected items
- [ ] Mutations work for both upload types
- [ ] All validation commands pass

---

### Step 14: Add Navigation to Layout

**What**: Add a top navigation bar to `layout.tsx`.
**Why**: Users need consistent navigation between pages.
**Confidence**: High

**Files to Modify:**
- `packages/web/src/app/layout.tsx` - Add navigation header

**Changes:**
- Add `<header>` with nav bar: app name linking to `/`, "Browse" and "Upload" links
- Move `ThemeToggle` into header
- Style with existing design tokens: `bg-surface`, `border-b border-border`
- Wrap `{children}` in `<main>` with consistent padding

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Navigation header on all pages
- [ ] Links work correctly
- [ ] Theme toggle in header
- [ ] All validation commands pass

---

### Step 15: End-to-End Verification and Cleanup

**What**: Verify the full stack works end-to-end.
**Why**: Final verification ensures all pieces integrate correctly.
**Confidence**: High

**Validation Commands:**
```bash
pnpm lint:fix && pnpm typecheck && pnpm build
```

**Success Criteria:**
- [ ] `pnpm lint:fix` passes with zero errors
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm build` succeeds for all packages
- [ ] Home page displays merged data table
- [ ] Detail pages render correctly
- [ ] Upload page handles single and batch uploads
- [ ] Batch uploads create bundles automatically
- [ ] URL state is persisted and shareable

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck` across all four packages
- [ ] All files pass `pnpm lint:fix` with zero remaining errors
- [ ] `pnpm build` succeeds for all packages
- [ ] Database migration applied and schema in sync
- [ ] Hono `AppType` includes bundle routes (verified by frontend type-safe API calls compiling)
- [ ] All React Query hooks consume data correctly and invalidate on mutations
- [ ] URL-driven state via nuqs works for search and type filter
- [ ] No console errors in browser when navigating between pages

## Notes

- **Drizzle join table composite keys**: Use `primaryKey({ columns: [table.col1, table.col2] })` syntax for composite primary keys.
- **Bundle download aggregation**: Aggregates files from all linked items. Acceptable for MVP; optimize later if needed.
- **Upload service parameter change**: Adding `bundleService` changes `createUploadService` signature. Steps 5, 7, and 8 must be completed in sequence.
- **Nuqs v2.8.8**: Use `parseAsString` from `nuqs` with the already-configured `NuqsAdapter` in `providers.tsx`.
- **Next.js 16 async params**: Detail pages must `await params` before accessing `params.id`.
- **`@lukemorales/query-key-factory`**: Use `createQueryKeyStore` for structured key definitions.
