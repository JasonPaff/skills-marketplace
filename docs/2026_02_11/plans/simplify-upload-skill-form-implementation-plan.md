# Simplify Upload Skill Form - Implementation Plan

**Generated**: 2026-02-11
**Original Request**: Simplify the "Upload New Skill" form and its full stack to MVP requirements
**Refined Request**: Simplify the "Upload New Skill" form and its entire full-stack implementation down to MVP requirements by removing the category, scope/isGlobal, projectId, and uploadedBy fields from every layer of the monorepo, leaving only skill name, description, and skill files. Integrate TanStack Form v1.28.0 with Zod field-level validation, add error styling and accessibility attributes, and propagate removals to all affected files.

## Analysis Summary

- Feature request refined with project context
- Discovered 44 files across 4 packages
- Generated 21-step implementation plan

## File Discovery Results

- **Critical**: 4 files (schema, shared schemas, constants, types)
- **High**: 12 files (API layer, form, UI components, display components)
- **Medium**: 10 files (data fetching, supporting files, migration)
- **Low**: 8 files (CLI dependencies, indirectly affected)

---

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Strip the skills table and all dependent code of four non-MVP fields -- `category`, `isGlobal`, `projectId`, and `uploadedBy` -- across the full monorepo stack (database schema, shared Zod schemas, API service/query layers, frontend form, display components, data-fetching hooks, and search filters). Simultaneously upgrade the skill upload form to use TanStack Form v1.28.0 with Zod field-level validation wired to `onBlur`/`onSubmit` timing, add `error` variant props to `Input` and `Textarea` via CVA, and enhance `FormField` with proper ARIA accessibility attributes. The CLI package's dependency on `SKILL_SCOPES`/`SkillScope` is preserved.

## Prerequisites

- [ ] Confirm the Neon Postgres `DATABASE_URL` environment variable is set in `packages/api/.env`
- [ ] Run `pnpm install` at the repo root to ensure all workspace dependencies are current
- [ ] Run `pnpm run build` from the root to verify a clean baseline build before changes begin
- [ ] Back up or snapshot the Neon database (the migration drops columns and an enum irreversibly)

## Implementation Steps

### Step 1: Update Shared Constants

**What**: Remove `SKILL_CATEGORIES` and `SkillCategory` from `packages/shared/src/constants.ts` while keeping `SKILL_SCOPES`/`SkillScope` intact for the CLI.
**Why**: `SKILL_CATEGORIES` is imported by the schema, DB layer, and frontend. Removing it at the source forces all downstream consumers to surface as type errors, making it easy to find and fix every reference in subsequent steps.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/constants.ts` -- Remove the `SKILL_CATEGORIES` array constant and the `SkillCategory` type alias. Leave `SKILL_SCOPES`, `SkillScope`, `INSTALL_TARGETS`, `InstallTarget`, `RATING_MIN`, `RATING_MAX`, and `API_VERSION` untouched.

**Changes:**

- Delete the `SKILL_CATEGORIES` `as const` array
- Delete the `SkillCategory` type alias

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `SKILL_CATEGORIES` and `SkillCategory` no longer exported from `@emergent/shared`
- [ ] `SKILL_SCOPES` and `SkillScope` remain exported and unchanged
- [ ] Shared package compiles cleanly

---

### Step 2: Update Shared Zod Schemas

**What**: Remove `category`, `isGlobal`, `projectId`, and `uploadedBy` fields from `createSkillSchema`, `skillSchema`, and `skillsQuerySchema` in `packages/shared/src/schemas.ts`.
**Why**: These schemas are the single source of truth for validation across the API routes, service layer, and frontend form. Removing the fields here causes `CreateSkill`, `Skill`, and query types in `types.ts` to auto-cascade via `z.infer`.
**Confidence**: High

**Files to Modify:**

- `packages/shared/src/schemas.ts` -- Modify three schemas and remove the `SKILL_CATEGORIES` import.

**Changes:**

- Remove the `SKILL_CATEGORIES` import from the `'./constants.js'` import statement
- In `createSkillSchema`: Remove `category`, `isGlobal`, `projectId`, and `uploadedBy` fields, leaving only `description`, `files`, and `name`
- In `skillSchema`: Verify `.omit()` call no longer references removed fields
- In `skillsQuerySchema`: Remove `category`, `isGlobal`, and `projectId` fields, leaving only `search`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `createSkillSchema` only has `name`, `description`, and `files` fields
- [ ] `skillsQuerySchema` only has `search`
- [ ] Shared package builds with `pnpm --filter @emergent/shared build`

---

### Step 3: Update Database Schema and Generate Migration

**What**: Remove `skillCategoryEnum`, `category` column, `isGlobal` column, and `uploadedBy` column from the skills table in `packages/api/src/db/schema.ts`, then generate and apply a Drizzle migration.
**Why**: The database must reflect the simplified model.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/schema.ts` -- Remove `skillCategoryEnum`, three columns, and related imports.

**Changes:**

- Remove `import { SKILL_CATEGORIES } from '@emergent/shared'`
- Remove `pgEnum` from the `drizzle-orm/pg-core` import list
- Remove `export const skillCategoryEnum = pgEnum(...)` line
- Remove `category: skillCategoryEnum('category').notNull()` from skills table
- Remove `isGlobal: boolean('is_global').default(true).notNull()` from skills table
- Remove `uploadedBy: varchar('uploaded_by', { length: 100 }).notNull()` from skills table
- Keep `boolean` import (used by other tables)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
cd packages/api && pnpm run db:generate && pnpm run db:migrate
```

**Success Criteria:**

- [ ] New migration SQL with `ALTER TABLE ... DROP COLUMN` statements
- [ ] Migration applies successfully against Neon Postgres
- [ ] All validation commands pass

---

### Step 4: Update Drizzle-Zod Validation Schemas

**What**: Verify `packages/api/src/db/validation.ts` works with the modified schema.
**Why**: `insertSkillSchema` equals `createSkillSchema` (already updated). `selectSkillSchema` derives from the updated `skills` table.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/validation.ts` -- Verification step, no manual edits expected.

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `validation.ts` compiles without errors
- [ ] `selectSkillSchema` no longer includes removed fields

---

### Step 5: Update Skill Queries

**What**: Remove `category`, `isGlobal`, and `uploadedBy` from `insertSkill` and `selectSkills` in `packages/api/src/queries/skill.queries.ts`.
**Why**: The query layer directly references the removed columns.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/skill.queries.ts` -- Simplify `insertSkill` and `selectSkills`.

**Changes:**

- Remove `import type { SkillCategory } from '@emergent/shared'`
- Reduce `insertSkill` values type to: `{ description, githubPath, name, parentSkillId?, version? }`
- Change `selectSkills` filters type to: `{ search?: string }`. Remove `category` and `isGlobal` condition blocks.

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `insertSkill` no longer requires `category`, `isGlobal`, or `uploadedBy`
- [ ] `selectSkills` only filters by `search`

---

### Step 6: Update Project Queries

**What**: Simplify `selectGlobalSkills` and `selectProjectSkillsByProjectId` in `packages/api/src/queries/project.queries.ts`.
**Why**: `selectGlobalSkills()` filters by `skills.isGlobal` which no longer exists.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/queries/project.queries.ts` -- Update two query methods.

**Changes:**

- `selectGlobalSkills()`: Return all skills without filtering by `isGlobal`
- `selectProjectSkillsByProjectId()`: Remove `category`, `isGlobal`, `uploadedBy` from select columns

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `selectGlobalSkills()` returns all skills without `isGlobal` filter
- [ ] `selectProjectSkillsByProjectId()` no longer selects removed columns

---

### Step 7: Update Skill Service

**What**: Simplify `createSkill()`, `deriveGithubPath()`, and `forkSkill()` in `packages/api/src/services/skill.service.ts`.
**Why**: The service layer destructures and passes removed fields.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/services/skill.service.ts` -- Major simplification of three functions.

**Changes:**

- `deriveGithubPath()`: Accept only `name: string`, return `skills/global/${name}` unconditionally
- `createSkill()`: Destructure only `{ description, files, name }`. Call `deriveGithubPath(name)`. Pass `{ description, githubPath, name }` to `insertSkill()`. Remove project_skills linking block.
- `forkSkill()`: Remove `category`, `uploadedBy`, `isGlobal` from `insertSkill()` call

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `deriveGithubPath()` is a pure function of `name` only
- [ ] `createSkill()` no longer references removed fields
- [ ] `forkSkill()` no longer passes removed fields

---

### Step 8: Update Project Service

**What**: Simplify `getProjectSkills()` in `packages/api/src/services/project.service.ts`.
**Why**: The merge logic references `isGlobal`.
**Confidence**: Medium

**Files to Modify:**

- `packages/api/src/services/project.service.ts` -- Update `getProjectSkills()`.

**Changes:**

- Remove `isGlobal` reference from the merge logic. Keep the basic structure.

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `getProjectSkills()` compiles without references to removed fields

---

### Step 9: Update Seed Data

**What**: Remove `category`, `isGlobal`, and `uploadedBy` from seed records in `packages/api/src/db/seed.ts`.
**Why**: The insert will fail if these columns are passed but no longer exist.
**Confidence**: High

**Files to Modify:**

- `packages/api/src/db/seed.ts` -- Remove fields from seed data arrays.

**Changes:**

- Remove `import type { SkillCategory } from '@emergent/shared'`
- Remove `category`, `isGlobal`, `uploadedBy` from type annotations and all seed data objects

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Seed data compiles without referencing removed columns

---

### Step 10: Add Error Variant to Input Component

**What**: Add `error` boolean prop to `Input` in `packages/web/src/components/ui/input.tsx` via CVA.
**Why**: The form needs visual error indication on inputs.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/ui/input.tsx` -- Add CVA-based error variant.

**Changes:**

- Import `cva` and `VariantProps` from CVA
- Define `inputVariants` with `variants.error` (`true`: `border-red-500 focus:border-red-500 focus:ring-red-500`)
- Update `InputProps` to include `VariantProps<typeof inputVariants>`
- Destructure `error` from props, pass to `inputVariants({ error })` in `cn()` call
- Ensure `error` is not spread to DOM element

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `<Input error />` renders with red border/focus ring
- [ ] `<Input />` renders with original styling

---

### Step 11: Add Error Variant to Textarea Component

**What**: Add `error` boolean prop to `Textarea` in `packages/web/src/components/ui/textarea.tsx` via CVA.
**Why**: Description field needs the same error styling.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/ui/textarea.tsx` -- Same CVA pattern as Input.

**Changes:**

- Same approach as Step 10 but for `textareaVariants`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `<Textarea error />` renders with red border/focus ring

---

### Step 12: Enhance FormField with Accessibility Attributes

**What**: Add ARIA attributes to `packages/web/src/components/forms/form-field.tsx`.
**Why**: Screen readers need ARIA linkage between inputs and error/hint messages.
**Confidence**: Medium

**Files to Modify:**

- `packages/web/src/components/forms/form-field.tsx` -- Add accessibility support.

**Changes:**

- Use render-prop pattern: `children` accepts a function `(props: { ariaDescribedBy?, ariaInvalid?, ariaRequired? }) => ReactNode`
- Compute stable IDs from `htmlFor` prop (`${htmlFor}-error`, `${htmlFor}-hint`)
- Render error `<p>` with `id={errorId}` and `role="alert"`
- Render hint `<p>` with `id={hintId}`
- Compute `aria-describedby` as space-separated IDs
- Pass `aria-invalid={!!error}`, `aria-required`, `aria-describedby` via render prop

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Error messages have `id` and `role="alert"`
- [ ] Child inputs receive `aria-describedby`, `aria-invalid`, `aria-required`

---

### Step 13: Rewrite Skill Form with TanStack Form + Zod Validation

**What**: Rewrite `packages/web/src/components/forms/skill-form.tsx` to remove all deleted fields and wire up TanStack Form v1.28.0 with Zod field-level validation.
**Why**: Primary user-facing change. Form must be simplified to three fields with inline validation.
**Confidence**: Medium

**Files to Modify:**

- `packages/web/src/components/forms/skill-form.tsx` -- Major rewrite.

**Changes:**

- Remove imports: `SKILL_CATEGORIES`, `SkillCategory`, `RadioGroup`, `Select`, `useProjects`
- Update `defaultValues` to only `name: ''` and `description: ''`
- Use field-level validators: extract `createSkillSchema.shape.name` and `.shape.description` for `onBlur`/`onChange` validation
- Remove `<form.Field name="category">`, `<form.Field name="isGlobal">`, `<form.Subscribe>` (projectId), `<form.Field name="uploadedBy">`
- Pass `field.state.meta.errors` to `FormField` error prop
- Pass error boolean to `Input`/`Textarea`
- Wire `handleBlur` to each input's `onBlur`
- Use FormField render-prop for ARIA attributes

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Form has exactly three sections: Skill Name, Description, Skill Files
- [ ] Blurring with invalid value shows inline error with red border
- [ ] No references to removed fields remain

---

### Step 14: Update Skill Card Component

**What**: Remove category badge and scope badge from `packages/web/src/components/skills/skill-card.tsx`.
**Why**: `Skill` type no longer has `category` or `isGlobal`.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-card.tsx`

**Changes:**

- Remove `getCategoryColor` import, category span, isGlobal badge

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 15: Update Skill Header Component

**What**: Remove category badge and scope badge from `packages/web/src/components/skills/skill-header.tsx`.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-header.tsx`

**Changes:**

- Remove `getCategoryColor` import, category span, isGlobal badge

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 16: Update Skill Metadata Component

**What**: Remove "Uploaded by" from `packages/web/src/components/skills/skill-metadata.tsx`.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-metadata.tsx`

**Changes:**

- Remove `skill.uploadedBy` display line

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 17: Update Skill Filters Component

**What**: Remove category dropdown from `packages/web/src/components/skills/skill-filters.tsx`.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skill-filters.tsx`

**Changes:**

- Remove `SKILL_CATEGORIES` import, `Select` import, `category` from search params, category `<Select>` element

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 18: Update Skills List Component

**What**: Remove `category` from `packages/web/src/components/skills/skills-list.tsx`.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/skills/skills-list.tsx`

**Changes:**

- Remove `category` from `useSkillsSearchParams()` destructure and `useSkills()` call

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 19: Update Data Fetching Layer

**What**: Remove `category`, `isGlobal`, `projectId` from API client, hooks, search params, query keys, and route type.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/api.ts` -- Simplify `fetchSkills()` to `{ search?: string }`
- `packages/web/src/lib/query/use-skills.ts` -- Remove `SkillCategory`/`SKILL_CATEGORIES`, simplify filters
- `packages/web/src/lib/search-params.ts` -- Remove `category` parser
- `packages/web/src/lib/query/keys.ts` -- Remove `category` from query key type
- `packages/web/src/app/route-type.ts` -- Remove `category` from route search params

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 20: Delete Category Colors Utility File

**What**: Delete `packages/web/src/lib/utils/category-colors.ts` entirely.
**Why**: No consumers remain after category removal.
**Confidence**: High

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

---

### Step 21: Full Monorepo Build and Final Validation

**What**: Run complete monorepo build to verify all changes integrate correctly.
**Why**: Cross-package type resolution may surface issues only visible during full build.

**Validation Commands:**

```bash
pnpm run build
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `pnpm run build` completes without errors
- [ ] `pnpm run typecheck` passes across all packages
- [ ] No remaining references to `SKILL_CATEGORIES`, `SkillCategory`, `getCategoryColor`, `skill.category`, `skill.isGlobal`, `skill.uploadedBy`, or `skillCategoryEnum`
- [ ] `SKILL_SCOPES` and `SkillScope` preserved for CLI

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` across all workspace packages
- [ ] All files pass `pnpm run lint:fix` across all workspace packages
- [ ] `pnpm run build` succeeds for all packages
- [ ] Database migration generated and applied without errors
- [ ] Workspace-wide grep confirms zero matches for removed identifiers
- [ ] `SKILL_SCOPES`/`SkillScope` preserved and CLI still compiles

## Notes

- **SKILL_SCOPES/SkillScope preserved**: CLI install command depends on them. Only `SKILL_CATEGORIES`/`SkillCategory` are deleted.
- **deriveGithubPath simplification**: All uploaded skills route to `skills/global/{name}`. Fork flow still generates project-specific paths.
- **TanStack Form v1 validators**: v1.28.0 supports Zod natively in `validators` prop -- no adapter package needed. Use `createSkillSchema.shape` for field-level extraction.
- **FormField accessibility**: Use render-prop pattern (aligns with TanStack Form's render-function children pattern).
- **Migration irreversibility**: `DROP COLUMN` and `DROP TYPE` are irreversible. Backup database before Step 3.
- **forkSkillSchema retains projectId**: Forking is independent and targets a specific project.
- **ProjectSkill type auto-cascades**: Extends `Skill`, so removed fields disappear automatically. `isCustomized` is preserved.
