# Batch Upload Skills/Agents/Rules Implementation Plan

**Generated**: 2026-02-12
**Original Request**: Rework the skill upload system to support uploading an entire .claude folder structure containing multiple skills, agents, and rules in a single upload.

**Refined Request**: Rework the skill upload system to support uploading an entire `.claude` folder structure containing multiple skills, agents, and rules in a single upload operation. Currently, the upload form in `packages/web/src/components/forms/skill-form.tsx` assumes a single skill per upload with one name and description tied to one `SKILL.md` file, but the new flow should detect when the uploaded folder contains `skills/`, `agents/`, and/or `rules/` subfolders and parse each subfolder according to its type. Skills are folders containing a `SKILL.md` with name/description frontmatter, agents are individual `.md` files with name/description/color/tools/model frontmatter, and rules are individual `.md` files with paths frontmatter. The upload form should remove its single name/description fields and instead derive all metadata from each item's parsed frontmatter, displaying a categorized preview UI that shows items grouped by type (for example, "3 Skills, 2 Agents, 1 Rule detected") with expandable sections revealing per-item validation status. To support this, add type-specific frontmatter parsers `parseAgentMd()` and `parseRuleMd()` alongside the existing `parseSkillMd()` in `packages/shared/src/schemas.ts`, backed by corresponding Zod schemas for agent frontmatter (name, description, color, tools, model) and rule frontmatter (paths). On the database side, create new `agents` and `rules` tables in `packages/api/src/db/schema.ts` mirroring the existing skills table structure (id, name, description, githubPath, downloadCount, uploadedAt) with type-specific columns added as needed. Each uploaded item gets its own database record and GitHub path following the convention `skills/global/${name}`, `agents/global/${name}`, and `rules/global/${name}` respectively. Rework the API endpoint and service layer in `packages/api/src/services/skill.service.ts` to accept a batch payload containing multiple skills, agents, and rules, validate each item against its type-specific schema, commit all files to GitHub atomically in a single commit, and insert all database records in one transaction. If the uploaded folder is a simple skill folder with no `skills/`/`agents/`/`rules/` subfolders and just a `SKILL.md` at root, the system should continue supporting the current single-skill upload behavior as a fallback path. Browsing and download functionality for agents and rules are out of scope for this change, which focuses exclusively on the upload flow, frontmatter parsing, database storage, and GitHub commit logic.

## Analysis Summary

- Feature request refined with project context
- Discovered 39 files across 4 packages (10 critical, 8 high, 9 medium, 12 low priority)
- Generated 14-step implementation plan

## File Discovery Results

### Critical (Must Modify) - 10 files
1. `packages/shared/src/schemas.ts` - Frontmatter parsers and Zod schemas
2. `packages/shared/src/types.ts` - Inferred TypeScript types
3. `packages/api/src/db/schema.ts` - Drizzle table definitions
4. `packages/api/src/services/skill.service.ts` - Service layer (reference for new upload service)
5. `packages/web/src/components/forms/skill-form.tsx` - Upload form component
6. `packages/api/src/routes/skills.ts` - API routes (reference for new upload route)
7. `packages/api/src/queries/skill.queries.ts` - DB queries (reference for new query modules)
8. `packages/web/src/lib/query/use-create-skill.ts` - React Query mutation hook (reference)
9. `packages/web/src/lib/api.ts` - Hono RPC client
10. `packages/shared/src/index.ts` - Barrel exports

### High (Likely Modify) - 8 files
11. `packages/api/src/index.ts` - Main Hono app with DI setup
12. `packages/api/src/types/env.ts` - AppEnv type definitions
13. `packages/api/src/db/validation.ts` - Drizzle-Zod validation schemas
14. `packages/api/src/queries/index.ts` - Query barrel exports
15. `packages/api/src/services/index.ts` - Service barrel exports
16. `packages/api/src/lib/github.ts` - GitHub client (already supports atomic commits)
17. `packages/web/src/lib/utils/zip.ts` - Zip extraction utilities
18. `packages/api/src/db/seed.ts` - Seed data

### Medium (May Need Changes) - 9 files
19. `packages/web/src/app/skills/new/page.tsx` - Upload page
20. `packages/web/src/lib/query/keys.ts` - Query key factory
21. `packages/shared/src/constants.ts` - Constants
22-27. Various UI components and config files

## Implementation Plan

### Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

### Quick Summary

Rework the skill upload system to support uploading an entire `.claude` folder structure containing multiple skills, agents, and rules in a single upload operation. The system will detect `skills/`, `agents/`, and `rules/` subfolders, parse type-specific frontmatter from each item, display a categorized preview UI, and persist all items atomically via a single GitHub commit and a single database transaction. The existing single-skill upload path is preserved as a fallback when no subfolders are detected.

### Prerequisites

- [ ] Confirm agent frontmatter shape: `name` (string), `description` (string), `color` (string), `tools` (string array), `model` (string) -- all required or some optional
- [ ] Confirm rule frontmatter shape: `paths` (string array) -- confirm this is the only required field, and whether a `description` or `name` field is also expected (rules need a display name for the preview UI and a database record)
- [ ] Decide whether the upload page route should change from `/skills/new` to something more generic like `/upload`, or remain at `/skills/new` with updated heading text
- [ ] Ensure database access is available for running `pnpm db:generate` and `pnpm db:migrate`

### Step 1: Add Agent and Rule Frontmatter Schemas and Parsers to Shared Package

**What**: Create Zod schemas and parser functions for agent `.md` files and rule `.md` files, alongside the existing `parseSkillMd()` in `packages/shared/src/schemas.ts`.
**Why**: The shared package is the canonical location for validation schemas. Type-specific parsers are needed to extract and validate frontmatter from each item type before upload.
**Confidence**: High

**Files to Modify:**
- `packages/shared/src/schemas.ts` - Add `agentMdFrontmatterSchema`, `ruleMdFrontmatterSchema`, `parseAgentMd()`, `parseRuleMd()`, `ParsedAgentMd` interface, `ParsedRuleMd` interface

**Changes:**
- Add `agentMdFrontmatterSchema` Zod object with fields: `name` (string, required), `description` (string, required), `color` (string, optional), `tools` (array of strings, optional), `model` (string, optional)
- Add `ruleMdFrontmatterSchema` Zod object with fields: `name` (string, required), `description` (string, required), `paths` (array of strings, optional)
- Add `ParsedAgentMd` interface mirroring `ParsedSkillMd` structure (body + typed frontmatter)
- Add `ParsedRuleMd` interface mirroring `ParsedSkillMd` structure (body + typed frontmatter)
- Add `parseAgentMd(content: string): ParsedAgentMd` function using `gray-matter` and `agentMdFrontmatterSchema.safeParse()`, following the same error pattern as `parseSkillMd`
- Add `parseRuleMd(content: string): ParsedRuleMd` function using `gray-matter` and `ruleMdFrontmatterSchema.safeParse()`, following the same error pattern as `parseSkillMd`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `parseAgentMd()` correctly extracts and validates frontmatter from a well-formed agent `.md` string
- [ ] `parseRuleMd()` correctly extracts and validates frontmatter from a well-formed rule `.md` string
- [ ] Both parsers throw descriptive errors for missing/invalid frontmatter
- [ ] All validation commands pass

---

### Step 2: Add Batch Upload Schema and Item Type Constants to Shared Package

**What**: Create the `createBatchUploadSchema` Zod schema that accepts arrays of skills, agents, and rules, and add item type constants.
**Why**: The API endpoint needs a schema to validate the batch payload. Constants provide a single source of truth for the three item types.
**Confidence**: High

**Files to Modify:**
- `packages/shared/src/schemas.ts` - Add `createBatchUploadSchema` with per-type sub-arrays
- `packages/shared/src/constants.ts` - Add `ITEM_TYPES` constant array and `ItemType` type

**Changes:**
- In `schemas.ts`, add `agentFileSchema` and `ruleFileSchema` (structurally identical to `skillFileSchema`: content + path)
- Add `createAgentSchema` Zod object: `name` (lowercase alphanumeric with hyphens), `description` (string), `files` (array of file objects with refinement that at least one `.md` file with valid agent frontmatter exists)
- Add `createRuleSchema` Zod object: `name` (lowercase alphanumeric with hyphens), `description` (string), `files` (array of file objects with refinement for valid rule frontmatter)
- Add `createBatchUploadSchema` Zod object containing three optional arrays: `skills` (array of `createSkillSchema`), `agents` (array of `createAgentSchema`), `rules` (array of `createRuleSchema`) -- with a top-level refinement that at least one item exists across all three arrays
- In `constants.ts`, add `ITEM_TYPES` and `ItemType`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `createBatchUploadSchema` validates a payload containing a mix of skills, agents, and rules
- [ ] Schema rejects payloads where all three arrays are empty
- [ ] Schema rejects items with invalid frontmatter within their files
- [ ] All validation commands pass

---

### Step 3: Add Inferred Types for Agent, Rule, and Batch Upload to Shared Package

**What**: Export inferred TypeScript types from the new schemas and re-export new parsers/schemas from the barrel.
**Why**: Downstream packages (API, web) need typed interfaces for agents, rules, and batch upload payloads.
**Confidence**: High

**Files to Modify:**
- `packages/shared/src/types.ts` - Add `Agent`, `Rule`, `CreateAgent`, `CreateRule`, `CreateBatchUpload` types
- `packages/shared/src/index.ts` - Verify all new exports are re-exported

**Changes:**
- Add `CreateAgent` type inferred from `createAgentSchema`
- Add `CreateRule` type inferred from `createRuleSchema`
- Add `CreateBatchUpload` type inferred from `createBatchUploadSchema`
- Add `Agent` type inferred from a new `agentSchema` (read-model with `id`, `githubPath`, `downloadCount`, `uploadedAt`, type-specific columns)
- Add `Rule` type inferred from a new `ruleSchema` (read-model with `id`, `githubPath`, `downloadCount`, `uploadedAt`)
- Verify barrel export in `index.ts` picks up all new exports

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All new types are importable from `@emergent/shared`
- [ ] Types correctly reflect the Zod schema shapes
- [ ] All validation commands pass

---

### Step 4: Add Agents and Rules Database Tables

**What**: Define `agents` and `rules` Drizzle tables in the database schema, generate and run the migration.
**Why**: Each uploaded agent and rule needs its own database record for metadata persistence.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/db/schema.ts` - Add `agents` table, `agentsRelations`, `rules` table, `rulesRelations`

**Changes:**
- Add `agents` pgTable with columns: `id` (uuid, PK, defaultRandom), `name` (varchar 100, notNull), `description` (varchar 500, notNull), `githubPath` (varchar 500, notNull), `color` (varchar 50, nullable), `tools` (text array, nullable), `model` (varchar 100, nullable), `downloadCount` (integer, default 0, notNull), `uploadedAt` (timestamp with tz, defaultNow, notNull)
- Add `agentsRelations` (empty initially for consistency)
- Add `rules` pgTable with columns: `id` (uuid, PK, defaultRandom), `name` (varchar 100, notNull), `description` (varchar 500, notNull), `githubPath` (varchar 500, notNull), `paths` (text array, nullable), `downloadCount` (integer, default 0, notNull), `uploadedAt` (timestamp with tz, defaultNow, notNull)
- Add `rulesRelations` (empty initially)
- Run `pnpm db:generate` then `pnpm db:migrate`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
pnpm db:generate
pnpm db:migrate
```

**Success Criteria:**
- [ ] `agents` and `rules` tables exist in the generated migration SQL
- [ ] Migration applies cleanly against the database
- [ ] All validation commands pass

---

### Step 5: Add Drizzle-Zod Validation Schemas for Agents and Rules

**What**: Create insert/select validation schemas for the new tables using `drizzle-zod`.
**Why**: Follows the established pattern in `validation.ts` where every table has corresponding drizzle-zod schemas.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/db/validation.ts` - Add `insertAgentSchema`, `selectAgentSchema`, `insertRuleSchema`, `selectRuleSchema`

**Changes:**
- Add `insertAgentSchema` using `createInsertSchema(agents)` with appropriate field refinements, omitting auto-generated fields
- Add `selectAgentSchema` using `createSelectSchema(agents)`
- Add `insertRuleSchema` using `createInsertSchema(rules)` with appropriate field refinements, omitting auto-generated fields
- Add `selectRuleSchema` using `createSelectSchema(rules)`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All four schemas are defined and exported
- [ ] All validation commands pass

---

### Step 6: Add Agent and Rule Database Queries

**What**: Create `agent.queries.ts` and `rule.queries.ts` following the pattern of `skill.queries.ts`.
**Why**: The service layer needs query functions to insert agent and rule records into the database.
**Confidence**: High

**Files to Create:**
- `packages/api/src/queries/agent.queries.ts` - Agent insert query
- `packages/api/src/queries/rule.queries.ts` - Rule insert query

**Files to Modify:**
- `packages/api/src/queries/index.ts` - Re-export new query modules

**Changes:**
- In `agent.queries.ts`: create `createAgentQueries(db: Database)` factory returning `insertAgent(values)` that inserts into the `agents` table and returns the inserted row
- In `rule.queries.ts`: create `createRuleQueries(db: Database)` factory returning `insertRule(values)` that inserts into the `rules` table and returns the inserted row
- In `index.ts`: add barrel exports for `createAgentQueries`/`AgentQueries` and `createRuleQueries`/`RuleQueries`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `insertAgent()` and `insertRule()` functions are defined and exported
- [ ] Query factories follow the same DI pattern as `createSkillQueries`
- [ ] All validation commands pass

---

### Step 7: Create Batch Upload Service

**What**: Create `upload.service.ts` containing `createUploadService()` with a `batchUpload()` method that validates all items, commits files to GitHub atomically, and inserts database records in a transaction.
**Why**: This is the core business logic for the batch upload feature. A dedicated service keeps concerns separated from the existing skill service.
**Confidence**: Medium (transaction support with neon-http driver needs verification)

**Files to Create:**
- `packages/api/src/services/upload.service.ts` - Batch upload service

**Files to Modify:**
- `packages/api/src/services/index.ts` - Re-export new service

**Changes:**
- Create `createUploadService(skillQueries, agentQueries, ruleQueries, github)` factory
- Implement `batchUpload(data: CreateBatchUpload)` method that:
  1. Iterates over `data.skills`, `data.agents`, `data.rules` arrays
  2. For each skill: validates SKILL.md frontmatter via `parseSkillMd()`, derives GitHub path as `skills/global/${name}`
  3. For each agent: validates the agent `.md` frontmatter via `parseAgentMd()`, derives GitHub path as `agents/global/${name}`
  4. For each rule: validates the rule `.md` frontmatter via `parseRuleMd()`, derives GitHub path as `rules/global/${name}`
  5. Collects all files with their full GitHub paths into a single array
  6. Calls `github.commitFiles(allFiles, commitMessage)` for a single atomic commit
  7. Inserts all skill, agent, and rule records via their respective query functions (investigate `db.transaction()` availability)
  8. Returns a summary object: `{ skills: Skill[], agents: Agent[], rules: Rule[] }`
- Export `UploadService` type from the factory's return type
- Re-export from `services/index.ts`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `batchUpload()` validates all items before any side effects
- [ ] GitHub commit contains all files from all item types in a single commit
- [ ] Database inserts cover all items
- [ ] Errors from any single item validation bubble up with descriptive messages
- [ ] All validation commands pass

---

### Step 8: Register Upload Service in DI Middleware and Update AppEnv Type

**What**: Wire the new upload service into the Hono DI middleware and add it to the `AppEnv` Variables type.
**Why**: Route handlers access services via `c.get('uploadService')`, which requires registration in the middleware and type declaration.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/types/env.ts` - Add `uploadService: UploadService` to Variables
- `packages/api/src/index.ts` - Import and instantiate upload service in DI middleware

**Changes:**
- In `env.ts`: import `UploadService` type, add `uploadService: UploadService` to the Variables interface
- In `index.ts`: import and instantiate `createUploadService`, `createAgentQueries`, `createRuleQueries`, register via `c.set('uploadService', ...)`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `c.get('uploadService')` returns a properly typed `UploadService` instance
- [ ] No type errors in middleware or route files
- [ ] All validation commands pass

---

### Step 9: Add Batch Upload API Endpoint

**What**: Add a `POST /api/upload/batch` route that accepts the batch payload and delegates to the upload service.
**Why**: The frontend needs an API endpoint to submit the parsed folder contents for persistence.
**Confidence**: High

**Files to Create:**
- `packages/api/src/routes/upload.ts` - New Hono router for batch uploads

**Files to Modify:**
- `packages/api/src/index.ts` - Mount the new router at `/api/upload`

**Changes:**
- Create `uploadRouter` with a single `POST /batch` route
- Use `zValidator('json', createBatchUploadSchema)` for payload validation
- Handler calls `c.get('uploadService').batchUpload(data)` and returns `c.json({ data: result }, 201)`
- Mount router in `index.ts` and ensure existing `POST /api/skills` route remains functional

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `POST /api/upload/batch` accepts a batch payload and returns 201 with created items
- [ ] Existing `POST /api/skills` still works for single skill uploads
- [ ] Hono RPC type includes the new route
- [ ] All validation commands pass

---

### Step 10: Add Frontend API Client Function and React Query Hook for Batch Upload

**What**: Add `createBatchUpload()` function to the API client and a `useBatchUpload` React Query mutation hook.
**Why**: The form component needs a typed function to call the new API endpoint and a hook to manage mutation state.
**Confidence**: High

**Files to Create:**
- `packages/web/src/lib/query/use-batch-upload.ts` - React Query mutation hook

**Files to Modify:**
- `packages/web/src/lib/api.ts` - Add `createBatchUpload()` function

**Changes:**
- In `api.ts`: add `createBatchUpload(data: CreateBatchUpload)` that calls `client.api.upload.batch.$post({ json: data })`
- In `use-batch-upload.ts`: create `useBatchUpload` hook following the `useCreateSkill` pattern

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `createBatchUpload()` is type-safe against the Hono RPC client
- [ ] `useBatchUpload` hook handles loading, error, and success states
- [ ] All validation commands pass

---

### Step 11: Add Folder Structure Detection Utility

**What**: Create a utility function that analyzes uploaded file paths to detect whether the upload contains a `.claude` folder structure with `skills/`, `agents/`, and/or `rules/` subfolders, and categorizes each item.
**Why**: The form needs to determine whether to use the batch upload flow or the legacy single-skill flow, and must group items by type for the preview UI.
**Confidence**: High

**Files to Create:**
- `packages/web/src/lib/utils/folder-detection.ts` - Folder structure detection and item categorization

**Changes:**
- Create `detectFolderStructure(files: UploadedFile[])` function that returns `{ type: 'batch', skills: GroupedItem[], agents: GroupedItem[], rules: GroupedItem[] } | { type: 'single-skill', files: UploadedFile[] }`
- A `GroupedItem` contains: `name` (derived from subfolder or filename), `files` (array of UploadedFile with paths relative to the item), and parsed frontmatter result (name, description, validation status)
- Detection logic: if files contain paths starting with `skills/`, `agents/`, or `rules/` (after root-folder stripping), it is a batch upload; otherwise fall back to single-skill mode
- For skills: each subfolder under `skills/` is a separate skill item, its `SKILL.md` is parsed for frontmatter
- For agents: each `.md` file directly under `agents/` is a separate agent item, parsed for agent frontmatter
- For rules: each `.md` file directly under `rules/` is a separate rule item, parsed for rule frontmatter

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Correctly detects batch mode when `skills/`, `agents/`, or `rules/` subfolders exist
- [ ] Correctly falls back to single-skill mode for flat folder with `SKILL.md`
- [ ] Each item includes parsed frontmatter name, description, and validation status
- [ ] All validation commands pass

---

### Step 12: Rework the Upload Form for Batch Upload with Categorized Preview

**What**: Major rework of `skill-form.tsx` to remove the manual name/description fields, add folder structure detection on file selection, display a categorized preview UI showing items grouped by type, and submit via the batch upload mutation when in batch mode.
**Why**: The form currently assumes a single skill per upload. It must now support the new multi-item upload flow while preserving the single-skill fallback.
**Confidence**: Medium (largest and most complex step)

**Files to Modify:**
- `packages/web/src/components/forms/skill-form.tsx` - Major rework of form component

**Changes:**
- Remove the `form.Field` blocks for `name` and `description` (now derived from frontmatter)
- Add state for the detected folder structure result (batch vs single-skill mode)
- On file selection (folder or zip), call `detectFolderStructure()` to categorize uploaded items
- **Batch mode preview UI**: render a summary header showing counts per type (e.g., "3 Skills, 2 Agents, 1 Rule detected"), followed by expandable/collapsible sections for each type, where each section lists items with their parsed name, description, and a validation status indicator
- **Single-skill fallback**: when in single-skill mode, display the existing file list but auto-fill name and description from SKILL.md frontmatter and use the existing `createSkill` mutation
- Update the submit handler: in batch mode, construct the `CreateBatchUpload` payload and call `useBatchUpload.mutate()`; in single-skill mode, construct the `CreateSkill` payload and call `useCreateSkill.mutate()`
- Disable the submit button if any item has invalid frontmatter
- Update the format guide to cover all three item types

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Uploading a `.claude` folder with `skills/`, `agents/`, `rules/` subfolders triggers batch mode with categorized preview
- [ ] Uploading a simple skill folder (just `SKILL.md` at root) triggers single-skill fallback mode
- [ ] Each detected item shows its name, description, and validation status in the preview
- [ ] Submit is disabled when any item has validation errors
- [ ] Batch submit calls the batch upload endpoint
- [ ] Single-skill submit calls the existing skill creation endpoint
- [ ] All validation commands pass

---

### Step 13: Update Upload Page Heading and Navigation

**What**: Update the upload page heading to reflect the broader upload capability.
**Why**: The page title currently says "Upload New Skill" but the form now supports uploading skills, agents, and rules.
**Confidence**: High

**Files to Modify:**
- `packages/web/src/app/skills/new/page.tsx` - Update heading text

**Changes:**
- Change heading from "Upload New Skill" to "Upload Skills & Agents" (or similar)
- Optionally update the `BackLink` label

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Page heading accurately describes the upload capability
- [ ] All validation commands pass

---

### Step 14: Add Seed Data for Agents and Rules

**What**: Add sample agent and rule records to the seed script for development/testing.
**Why**: Developers need sample data to verify the new tables and UI work correctly.
**Confidence**: High

**Files to Modify:**
- `packages/api/src/db/seed.ts` - Add agent and rule seed data

**Changes:**
- Add `db.delete(schema.agents)` and `db.delete(schema.rules)` to the cleanup section
- Add sample agent data (2-3 agents) and insert via `db.insert(schema.agents).values(agentData)`
- Add sample rule data (1-2 rules) and insert via `db.insert(schema.rules).values(ruleData)`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Seed script runs without errors
- [ ] Agent and rule records appear in the database after seeding
- [ ] All validation commands pass

---

### Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` across all packages
- [ ] All files pass `pnpm run lint:fix` across all packages
- [ ] Database migration generates and applies cleanly (`pnpm db:generate && pnpm db:migrate`)
- [ ] Seed script runs successfully with new agent and rule data
- [ ] Manual test: upload a `.claude` folder with `skills/`, `agents/`, and `rules/` subfolders and verify the categorized preview shows correct counts and item details
- [ ] Manual test: upload a simple skill folder (just SKILL.md at root) and verify the single-skill fallback works identically to the current behavior
- [ ] Manual test: submit a batch upload and verify a single GitHub commit contains all files and all database records are created
- [ ] Manual test: verify submit button is disabled when any item has invalid frontmatter
- [ ] Existing `POST /api/skills` endpoint remains functional and unchanged

### Notes

- **Transaction support**: The current database driver is `@neondatabase/serverless` with `drizzle-orm/neon-http`. The neon-http driver may not support interactive transactions (`db.transaction()`). Investigate during Step 7 implementation. If unavailable, insert records sequentially and document the limitation.

- **GitHub commit ordering**: The `github.commitFiles()` method already supports atomic multi-file commits via the Git tree API. No changes needed. The batch upload service collects all files and makes a single call.

- **Agent "name" derivation**: Agent `.md` files are individual files (not folders), so the `name` for GitHub path and database record comes from the frontmatter `name` field, sanitized to lowercase-alphanumeric-with-hyphens. Same applies to rules.

- **Backward compatibility**: The existing `POST /api/skills` route, `createSkillSchema`, `useCreateSkill` hook, and `createSkill` API function remain untouched. The single-skill fallback in the form reuses these existing code paths.

- **Out of scope**: Browsing and download pages for agents and rules are explicitly out of scope. The agents and rules tables are created but only the insert path is implemented.

- **Form complexity**: Step 12 is the most complex step and may benefit from extracting sub-components (e.g., `BatchPreview`, `ItemTypeSection`, `ItemValidationRow`) to keep the form component manageable.

- **File path prefixing**: When building the batch upload payload on the frontend, each item's files must have paths relative to that item (e.g., `SKILL.md`, not `skills/my-skill/SKILL.md`). The `detectFolderStructure()` utility in Step 11 handles stripping the type prefix.
