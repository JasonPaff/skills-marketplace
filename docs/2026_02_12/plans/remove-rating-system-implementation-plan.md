# Remove Rating System Implementation Plan

**Generated**: 2026-02-12
**Original Request**: Remove the rating system entirely from the skills-marketplace application
**Refined Request**: Remove the rating system entirely from the skills-marketplace application, a pre-production pnpm monorepo with no existing users, meaning no backwards compatibility, data migration, or deprecation strategy is required. Changes span database schema, migrations, seed data, API routes/services/queries, shared schemas/types/constants, web components/hooks/utilities, and test artifacts.

## Analysis Summary

- Feature request refined with project context
- Discovered 23 files across 3 packages + test artifacts
- Generated 19-step implementation plan
- 5 files to delete, 16 files to modify, 1 final verification step

## File Discovery Results

### Critical Priority (7 files - Modify)

| # | File | Action |
|---|------|--------|
| 1 | `packages/api/src/db/schema.ts` | Modify - remove rating columns and `real` import |
| 2 | `packages/shared/src/schemas.ts` | Modify - remove rateSkillSchema and rating fields |
| 3 | `packages/shared/src/types.ts` | Modify - remove RateSkill type |
| 4 | `packages/shared/src/constants.ts` | Modify - remove RATING_MIN/MAX |
| 5 | `packages/api/src/routes/skills.ts` | Modify - remove POST /:id/rate route |
| 6 | `packages/api/src/services/skill.service.ts` | Modify - remove rateSkill method |
| 7 | `packages/api/src/queries/skill.queries.ts` | Modify - remove updateSkillRating |

### High Priority (11 files - 4 Delete, 7 Modify)

| # | File | Action |
|---|------|--------|
| 8 | `packages/web/src/components/skills/star-rating.tsx` | **Delete** |
| 9 | `packages/web/src/components/forms/interactive-star-rating.tsx` | **Delete** |
| 10 | `packages/web/src/components/forms/rating-form.tsx` | **Delete** |
| 11 | `packages/web/src/lib/query/use-rate-skill.ts` | **Delete** |
| 12 | `packages/web/src/lib/api.ts` | Modify - remove rateSkill function |
| 13 | `packages/web/src/components/skills/skills-table.tsx` | Modify - remove rating column/filter |
| 14 | `packages/web/src/components/skills/skill-stats.tsx` | Modify - remove rating stat, 3->2 cols |
| 15 | `packages/web/src/components/skills/skill-detail-content.tsx` | Modify - remove RatingForm |
| 16 | `packages/web/src/lib/utils/format.ts` | Modify - remove formatRating |
| 17 | `packages/web/src/lib/search-params.ts` | Modify - remove rating param |
| 18 | `packages/web/src/app/route-type.ts` | Modify - remove rating field |

### Medium Priority (3 files - Modify)

| # | File | Action |
|---|------|--------|
| 19 | `packages/api/src/queries/project.queries.ts` | Modify - remove rating selects |
| 20 | `packages/api/src/db/seed.ts` | Modify - remove rating seed values |
| 21 | `packages/api/drizzle/0000_secret_puppet_master.sql` | Modify in-place |

### Low Priority (1 file - Delete)

| # | File | Action |
|---|------|--------|
| 22 | `Skills Marketplace/Skills/Rate Skill.bru` | **Delete** |

## Implementation Plan

## Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Remove the entire rating system from a pre-production skills-marketplace monorepo. This involves deleting 5 files (4 web components/hooks, 1 Bruno request), modifying 16 source files across the shared, API, and web packages to strip rating-related columns, schemas, types, constants, routes, services, queries, and UI components. No migration strategy is needed since this is a pre-production application with zero users.

## Prerequisites

- [ ] Ensure `pnpm install` has been run and all dependencies are current
- [ ] Confirm no uncommitted changes exist on the working branch

## Implementation Steps

### Step 1: Remove Rating Constants from Shared Package

**What**: Delete `RATING_MIN` and `RATING_MAX` constants from the shared constants file.
**Why**: These constants are consumed by `rateSkillSchema` in `schemas.ts` and must be removed first to establish a clean dependency chain.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/constants.ts` - Remove `RATING_MIN` and `RATING_MAX` constant declarations

**Changes:**

- Remove the two lines declaring `RATING_MIN = 1` and `RATING_MAX = 5`
- Retain `SKILL_SCOPES`, `SkillScope`, `INSTALL_TARGETS`, `InstallTarget`, and `API_VERSION` unchanged

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `RATING_MIN` and `RATING_MAX` no longer exist in `constants.ts`
- [ ] File still exports `SKILL_SCOPES`, `INSTALL_TARGETS`, and `API_VERSION`
- [ ] All validation commands pass

---

### Step 2: Remove Rating Schema and Fields from Shared Schemas

**What**: Remove `rateSkillSchema`, strip rating fields from `skillSchema`, and remove the `RATING_MIN`/`RATING_MAX` import.
**Why**: The shared schemas define the data contract between API and web. Removing rating fields here cascades type changes throughout both packages.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/schemas.ts` - Remove rating-related schema definitions and import

**Changes:**

- Remove the import line: `import { RATING_MAX, RATING_MIN } from './constants.js';`
- Remove the entire `rateSkillSchema` export (the `z.object` with `rating` and `userEmail` fields)
- Remove three fields from `skillSchema.extend()`: `averageRating`, `ratingCount`, `totalRating`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rateSkillSchema` no longer exported from `schemas.ts`
- [ ] `skillSchema` no longer contains `averageRating`, `ratingCount`, or `totalRating`
- [ ] No imports of `RATING_MIN` or `RATING_MAX` remain in this file

---

### Step 3: Remove RateSkill Type from Shared Types

**What**: Remove the `RateSkill` type export and its `rateSkillSchema` import from the shared types file.
**Why**: The `RateSkill` type is consumed by the web API client and route handler; it must be removed from the shared contract.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/types.ts` - Remove `RateSkill` type and `rateSkillSchema` import

**Changes:**

- Remove `rateSkillSchema` from the import block
- Remove the `RateSkill` type export line

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `RateSkill` type no longer exported from `types.ts`
- [ ] `rateSkillSchema` no longer imported in `types.ts`

---

### Step 4: Remove Rating Columns from Database Schema

**What**: Remove `averageRating`, `ratingCount`, and `totalRating` column definitions from the `skills` table in the Drizzle schema, and remove the now-unused `real` import.
**Why**: The database schema is the source of truth for the data model. Removing these columns eliminates rating data at the persistence layer.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/schema.ts` - Remove three column definitions and unused `real` import

**Changes:**

- Remove `real` from the drizzle-orm import statement (only used by `averageRating`)
- Remove `averageRating: real('average_rating').default(0).notNull()`
- Remove `ratingCount: integer('rating_count').default(0).notNull()`
- Remove `totalRating: integer('total_rating').default(0).notNull()`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `real` no longer imported
- [ ] `skills` table definition contains no rating-related columns

---

### Step 5: Edit Initial Migration SQL In-Place

**What**: Remove the three rating column definitions from the `CREATE TABLE "skills"` statement in the initial migration file.
**Why**: Pre-production with no users; editing in-place avoids creating an unnecessary new migration.
**Confidence**: High

**Files to Modify:**

- `packages/api/drizzle/0000_secret_puppet_master.sql` - Remove rating columns from CREATE TABLE

**Changes:**

- Remove `"total_rating" integer DEFAULT 0 NOT NULL,`
- Remove `"rating_count" integer DEFAULT 0 NOT NULL,`
- Remove `"average_rating" numeric(3, 2) DEFAULT '0' NOT NULL,`

**Validation Commands:** N/A (SQL file)

**Success Criteria:**

- [ ] CREATE TABLE no longer contains rating columns
- [ ] SQL remains syntactically valid

---

### Step 6: Remove Rating Data from Seed File

**What**: Remove all rating-related field values from every seed record in the seed file.
**Why**: Seed file references columns that no longer exist in the schema.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/seed.ts` - Remove all `averageRating`, `ratingCount`, `totalRating` values

**Changes:**

- Remove rating fields from the `globalSkillData` type annotation
- Remove all rating property assignments from all seed records

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] No references to `averageRating`, `ratingCount`, or `totalRating` remain in `seed.ts`

---

### Step 7: Remove Rating Query from Skill Queries

**What**: Remove the `updateSkillRating()` method from the skill queries module.
**Why**: This query updates columns that no longer exist.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/skill.queries.ts` - Remove `updateSkillRating` method

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `updateSkillRating` no longer exists in `skill.queries.ts`

---

### Step 8: Remove Rating Fields from Project Queries

**What**: Remove `averageRating`, `ratingCount`, and `totalRating` from the select clause in `selectProjectSkillsByProjectId()`.
**Why**: Query selects columns that no longer exist on the `skills` table.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/project.queries.ts` - Remove three rating fields from select

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `selectProjectSkillsByProjectId` contains no rating-related fields

---

### Step 9: Remove Rate Skill Service Method

**What**: Remove the `rateSkill()` method from the skill service.
**Why**: Service method orchestrates rating logic that no longer exists.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/skill.service.ts` - Remove `rateSkill` method

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rateSkill` method no longer exists in the service

---

### Step 10: Remove Rate Route from Skills Router

**What**: Remove the `POST /:id/rate` route handler and the `rateSkillSchema` import.
**Why**: Route exposes a removed endpoint. Also affects Hono RPC type inference chain.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/routes/skills.ts` - Remove rate route handler and `rateSkillSchema` import

**Changes:**

- Remove `rateSkillSchema` from imports
- Remove entire `.post('/:id/rate', ...)` route handler
- Ensure remaining route chain is syntactically correct

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] No `/:id/rate` route exists
- [ ] `rateSkillSchema` is no longer imported
- [ ] Remaining routes chain correctly

---

### Step 11: Delete Web Rating Component Files

**What**: Delete the four web-layer files dedicated entirely to the rating feature.
**Why**: Single-purpose rating files with no other functionality.
**Confidence**: High

**Files to Delete:**

- `packages/web/src/components/skills/star-rating.tsx`
- `packages/web/src/components/forms/interactive-star-rating.tsx`
- `packages/web/src/components/forms/rating-form.tsx`
- `packages/web/src/lib/query/use-rate-skill.ts`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All four files no longer exist on disk

---

### Step 12: Remove rateSkill Function from Web API Client

**What**: Remove the `rateSkill()` function and the `RateSkill` type import from the web API client.
**Why**: Function calls the removed `POST /:id/rate` endpoint. Hono RPC types will error.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/api.ts` - Remove `rateSkill` function and `RateSkill` import

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rateSkill` function and `RateSkill` import no longer exist in `api.ts`

---

### Step 13: Remove formatRating from Format Utilities

**What**: Remove the `formatRating()` utility function.
**Why**: Only used by rating-related components being removed.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/utils/format.ts` - Remove `formatRating` function

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `formatRating` no longer exists; `formatDate` and `formatDownloads` remain

---

### Step 14: Remove Rating from Search Params and Route Type

**What**: Remove the `rating` search parameter from both the `nuqs` config and Zod route type schema.
**Why**: URL state management references a `rating` parameter with no purpose.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/search-params.ts` - Remove `rating: parseAsInteger`
- `packages/web/src/app/route-type.ts` - Remove `rating` field from searchParams schema

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `rating` no longer present in either file

---

### Step 15: Update Skills Table Component

**What**: Remove rating column definition, `StarRating` import/usage, and "Min Rating" dropdown filter.
**Why**: Table displays rating column and filter that reference removed data and deleted components.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skills-table.tsx` - Remove all rating references

**Changes:**

- Remove `StarRating` import
- Remove `averageRating` column definition from columns array
- Remove `rating` from destructured search params
- Remove `rating` filter condition from `filteredSkills` memo
- Remove `rating` from `useMemo` dependency array
- Remove "Min Rating" `<Select>` block
- Remove "Rating" detail item from `SkillDetailPanel`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] No references to `StarRating`, `averageRating`, or rating filter remain
- [ ] Table still displays: name, description, version, download count
- [ ] Filter bar still has search input and downloads dropdown

---

### Step 16: Update Skill Stats Component

**What**: Remove rating stat display and change grid from 3 to 2 columns.
**Why**: Component displays rating stat that no longer exists.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-stats.tsx` - Remove rating stat, update grid

**Changes:**

- Remove `formatRating` import
- Change `grid-cols-3` to `grid-cols-2`
- Remove rating stat `<div>` element
- Retain Downloads and Source stats

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Grid uses `grid-cols-2`
- [ ] Downloads and Source stats render correctly
- [ ] No rating references remain

---

### Step 17: Update Skill Detail Content Component

**What**: Remove the `RatingForm` import and rendered usage.
**Why**: `RatingForm` component file is being deleted.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-detail-content.tsx` - Remove `RatingForm` import and usage

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] No reference to `RatingForm` remains

---

### Step 18: Delete Bruno Request File

**What**: Delete the Bruno API request file for the rate skill endpoint.
**Why**: API endpoint no longer exists.
**Confidence**: High

**Files to Delete:**

- `Skills Marketplace/Skills/Rate Skill.bru`

**Success Criteria:**

- [ ] `Rate Skill.bru` no longer exists on disk

---

### Step 19: Final Build Verification and Residual Reference Scan

**What**: Run full build, typecheck, and lint, then codebase-wide search for any residual rating references.
**Why**: Final quality gate to ensure no broken references or orphaned code.
**Confidence**: High

**Validation Commands:**

```bash
pnpm run build && pnpm run typecheck && pnpm run lint:fix
```

Then codebase-wide search for residual references across `packages/` and `Skills Marketplace/`.

**Success Criteria:**

- [ ] `pnpm run build` completes with zero errors
- [ ] `pnpm run typecheck` completes with zero errors
- [ ] `pnpm run lint:fix` completes with zero errors
- [ ] Residual reference search returns zero matches in source files

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] `pnpm run build` succeeds across all packages
- [ ] Codebase-wide search confirms zero residual rating references in source files
- [ ] Skills table displays and filters without rating columns or controls
- [ ] Skill detail page renders without the rating form

## Notes

- **Hono RPC cascade**: Removing the `POST /:id/rate` route changes inferred `AppType`. The `hc<AppType>` client will surface type errors if `rateSkill` is not also removed from `api.ts`. Steps 10 and 12 address both sides.
- **Search params trio**: `route-type.ts`, `search-params.ts`, and `skills-table.tsx` are tightly coupled. Step 14 handles the first two, Step 15 the component. All must be updated before build passes.
- **`real` import removal**: Only used by `averageRating`. Becomes unused after column removal and will cause lint error if not removed.
- **No migration needed**: Initial migration SQL edited in-place since this is pre-production with no deployed databases.
- **Execution order**: Steps 1-3 (shared) -> Steps 4-10 (API) -> Steps 11-17 (web) -> Step 18 (test artifact) -> Step 19 (verification).
