# Implementation Plan: Replace Card-Based Homepage with TanStack Table View

**Generated**: 2026-02-11
**Original Request**: Replace the card-based marketplace homepage with a TanStack Table-powered table view
**Refined Request**: Replace the card-based marketplace homepage with a TanStack Table-powered table view with sortable columns (Name, Description with Tooltip, Version, Rating, Downloads), omni-search, filter dropdowns, expandable inline detail rows, and clipboard CLI install button. Remove unused card components and category filtering.

## Analysis Summary

- Feature request refined with project context (TanStack Query v5, nuqs, Base UI, CVA, Tailwind v4)
- Discovered 26+ files across 4 priority levels
- Generated 9-step implementation plan

## File Discovery Results

### Critical (Must Modify)
- `packages/web/src/app/page.tsx` — Homepage, replace SkillsList with SkillsTable
- `packages/web/src/components/skills/skills-list.tsx` — Replace entirely with SkillsTable
- `packages/web/src/components/ui/data-table.tsx` — Extend with row expansion, global filter
- `packages/web/src/lib/search-params.ts` — Remove category, add rating/downloads params
- `packages/web/src/app/route-type.ts` — Update Zod schema to match
- `packages/web/src/lib/query/use-skills.ts` — Remove category filtering

### New Files
- `packages/web/src/components/skills/skills-table.tsx` — New SkillsTable component
- `packages/web/src/components/ui/tooltip.tsx` — New Tooltip component

### Files to Delete
- `packages/web/src/components/skills/skill-card.tsx`
- `packages/web/src/components/skills/skill-filters.tsx`
- `packages/web/src/components/skills/skills-list.tsx`

---

## Overview

**Estimated Duration**: 6-8 hours
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

Replace the card-grid marketplace homepage with a sortable, filterable, paginated TanStack Table. The existing `DataTable` wrapper will be extended with row expansion and global filter support. A new `SkillsTable` client component will define typed columns (Name, Description with Tooltip, Version, Rating, Downloads), omni-search, filter dropdowns for min rating and min downloads, and expandable detail rows with download and clipboard-copy-install actions. Unused card-based components and the category filter system will be removed.

## Prerequisites

- [ ] Confirm that `@base-ui/react` v1.1.0+ ships a `Tooltip` primitive (verified: `tooltip` directory exists in the installed package)
- [ ] Confirm that `nuqs` exports `parseAsInteger` for the new numeric search params (nuqs v2.x supports `parseAsInteger`)
- [ ] No new npm packages are needed; all dependencies are already installed

## Implementation Steps

### Step 1: Create the Tooltip UI Component

**What**: Create a reusable Tooltip component at `packages/web/src/components/ui/tooltip.tsx` following the project's Base UI + CVA + cn() pattern.
**Why**: The Description column in the table needs to show truncated text with a tooltip for the full description. No tooltip component exists yet.
**Confidence**: High

**Files to Create:**

- `packages/web/src/components/ui/tooltip.tsx` — Tooltip component wrapping `@base-ui/react/tooltip` primitives (Tooltip.Provider, Tooltip.Root, Tooltip.Trigger, Tooltip.Positioner, Tooltip.Popup, Tooltip.Arrow)

**Changes:**

- Import `Tooltip` primitives from `@base-ui/react/tooltip`
- Define CVA variants for the tooltip popup styling (e.g., dark background, white text, rounded corners, shadow, text sizes)
- Export a `Tooltip` compound component or a simple wrapper that accepts `content` (the tooltip text) and `children` (the trigger element)
- Follow the exact same component authoring pattern as `button.tsx`: Base UI primitive import, CVA definition, cn() merging, typed props via ComponentProps intersection with VariantProps
- Use the `sideOffset` / `alignOffset` positioner props for spacing

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `packages/web/src/components/ui/tooltip.tsx` exists and exports a Tooltip component
- [ ] Component follows existing CVA + cn() + Base UI pattern consistent with button.tsx and other UI components
- [ ] All validation commands pass

---

### Step 2: Add formatDownloads Utility to format.ts

**What**: Add a `formatDownloads` function to the existing `packages/web/src/lib/utils/format.ts` file that formats download counts with locale-aware number separators (e.g., 1,234).
**Why**: The Downloads column needs human-readable number formatting. Centralizing this in the existing format utility maintains consistency.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/utils/format.ts` — Add `formatDownloads` function

**Changes:**

- Add a `formatDownloads` function that takes a `number` and returns a locale-formatted string using `Intl.NumberFormat` or `toLocaleString()`
- Export the new function alongside the existing `formatDate` and `formatRating`

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `formatDownloads` is exported from `packages/web/src/lib/utils/format.ts`
- [ ] All validation commands pass

---

### Step 3: Update search-params.ts — Remove Category, Add Rating and Downloads Params

**What**: Modify the nuqs search params parsers to remove `category` and add `rating` (integer) and `downloads` (integer) params.
**Why**: The new table view filters by min rating and min downloads instead of category. The nuqs parsers and the route-type.ts Zod schema must stay in lockstep.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/search-params.ts` — Replace `category` parser with `rating` and `downloads` parsers
- `packages/web/src/app/route-type.ts` — Update Zod schema to match: remove `category`, add `rating` (optional number) and `downloads` (optional number)

**Changes:**

In `search-params.ts`:
- Remove the `category: parseAsString.withDefault('')` parser
- Add `rating: parseAsInteger` parser (from nuqs, no default — null when absent)
- Add `downloads: parseAsInteger` parser (from nuqs, no default — null when absent)
- Keep `search: parseAsString.withDefault('')`
- Import `parseAsInteger` from `nuqs` alongside existing imports

In `route-type.ts`:
- Remove `category: z.string().optional()`
- Add `rating: z.coerce.number().int().optional()`
- Add `downloads: z.coerce.number().int().optional()`
- Keep `search: z.string().optional()`

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `search-params.ts` exports parsers for `search`, `rating`, and `downloads` (no `category`)
- [ ] `route-type.ts` Zod schema matches with `search`, `rating`, and `downloads` (no `category`)
- [ ] All validation commands pass

---

### Step 4: Simplify the useSkills Hook — Remove Category Filtering

**What**: Simplify `packages/web/src/lib/query/use-skills.ts` to remove all category-related logic since the new table does not filter by category server-side.
**Why**: Category filtering is being removed from the homepage. The hook should just fetch all skills with an optional search string.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/lib/query/use-skills.ts` — Remove category-related imports, the `validCategories` Set, the `isSkillCategory` function, and the `category` parameter from the filters type and `fetchSkills` call
- `packages/web/src/lib/query/keys.ts` — Update the `list` context query type from `{ category?: string; search?: string }` to `{ search?: string }`

**Changes:**

- Remove imports of `SkillCategory` and `SKILL_CATEGORIES` from `@emergent/shared`
- Remove the `validCategories` Set and `isSkillCategory` function
- Change the `filters` parameter type to `{ search?: string }` (remove `category`)
- In the `queryFn`, call `fetchSkills` with only `{ search }` (no `category`)
- Update query key context call in `keys.ts` to match new filter shape

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `use-skills.ts` has no references to `category`, `SkillCategory`, `SKILL_CATEGORIES`, `isSkillCategory`, or `validCategories`
- [ ] `keys.ts` list filter type no longer includes `category`
- [ ] All validation commands pass

---

### Step 5: Extend DataTable with Row Expansion and Global Filter Support

**What**: Add row expansion (ExpandedState, getExpandedRowModel) and global filter state to the existing `DataTable` component at `packages/web/src/components/ui/data-table.tsx`.
**Why**: The skills table needs expandable rows for inline detail panels and a global search filter that spans multiple columns. The current DataTable has neither capability.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/components/ui/data-table.tsx` — Add expansion and global filter features

**Changes:**

- Import `ExpandedState`, `getExpandedRowModel`, and `type Row` from `@tanstack/react-table`
- Add new optional props to `DataTableProps`:
  - `globalFilter?: string` — external global filter state
  - `onGlobalFilterChange?: (value: string) => void` — callback for global filter updates
  - `globalFilterFn?: FilterFn<TData>` — custom global filter function
  - `renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode` — render function for expanded row content
  - `getRowCanExpand?: (row: Row<TData>) => boolean` — predicate for which rows can expand
- Add `expanded` state via `useState<ExpandedState>({})` alongside the existing `sorting` state
- Pass the new expansion config to `useReactTable`: `state.expanded`, `onExpandedChange`, `getExpandedRowModel()`, `getRowCanExpand`
- Pass global filter config to `useReactTable`: `state.globalFilter` (from prop), `onGlobalFilterChange` (from prop), `globalFilterFn` (from prop)
- In the `<tbody>` rendering, after each row's `<tr>`, conditionally render an additional `<tr>` when `row.getIsExpanded()` is true with a single `<td>` with `colSpan={row.getVisibleCells().length}` that renders `renderSubComponent({ row })`
- Apply a CSS transition wrapper around the expanded content (use `grid-template-rows` transition from `0fr` to `1fr`, or `max-height` transition)
- Ensure backward compatibility: when `renderSubComponent` is not provided, the table behaves exactly as before

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] DataTable accepts optional `globalFilter`, `onGlobalFilterChange`, `globalFilterFn`, `renderSubComponent`, and `getRowCanExpand` props
- [ ] Expanded rows render a sub-component row with full-width colspan
- [ ] Smooth CSS transition on expand/collapse
- [ ] When no expansion props are passed, the table renders identically to its current behavior
- [ ] All validation commands pass

---

### Step 6: Create the SkillsTable Component

**What**: Create the new `packages/web/src/components/skills/skills-table.tsx` client component that defines columns, search/filter controls, and the expandable detail panel.
**Why**: This is the core replacement for the card grid, bringing all the pieces together into the new table-based marketplace view.
**Confidence**: Medium (largest step, most integration points)

**Files to Create:**

- `packages/web/src/components/skills/skills-table.tsx` — The main SkillsTable client component

**Changes:**

This component must be a `'use client'` component and should contain:

**Column Definitions:**
- Define a `columns` array of type `ColumnDef<Skill, unknown>[]` with these columns:
  1. **Expand toggle column** — Non-sortable column with a ChevronRight icon (lucide-react) that rotates 90 degrees when expanded. Use `row.getToggleExpandedHandler()`. Apply CSS `rotate` transition.
  2. **Name** — Accessor column on `name`. Sortable. Bold text.
  3. **Description** — Accessor column on `description`. Sortable. Render with `line-clamp-1` or `truncate`. Wrap in Tooltip showing full description on hover.
  4. **Version** — Accessor column on `version`. Sortable. Prefix with "v".
  5. **Rating** — Accessor column on `averageRating`. Sortable. Render using existing `StarRating` component.
  6. **Downloads** — Accessor column on `downloadCount`. Sortable. Render using `formatDownloads`.

**Search and Filter Controls:**
- Use `useSkillsSearchParams()` to read/write `search`, `rating`, and `downloads` URL params
- Render omni-search `Input` bound to `search` param driving `globalFilter` on DataTable
- Implement custom `globalFilterFn` matching name or description case-insensitively
- Render "Min Rating" `Select` dropdown with options 1-5, bound to `rating` URL param
- Render "Min Downloads" `Select` dropdown with threshold options (0, 10, 50, 100, 500, 1000), bound to `downloads` URL param
- Apply rating and downloads filters by pre-filtering data before passing to DataTable

**Expandable Detail Panel (renderSubComponent):**
- Full description text (not truncated)
- Uploader name (`skill.uploadedBy`)
- Upload date using `formatDate(skill.uploadedAt)`
- Version string
- GitHub path
- Star rating using `StarRating`
- "Download" `Button` calling `downloadSkill(skill.id)`
- "CLI Install" `Button` copying `npx @detergent/skills install <skill-name>` to clipboard via `navigator.clipboard.writeText()`. Show `Copy` icon, swap to `Check` icon for ~2 seconds on success using local state and `setTimeout`
- Subtle background color and consistent padding

**Data Flow:**
- Use `useSkills({ search })` to fetch skills
- Apply client-side pre-filtering for min rating and min downloads
- Set `getRowCanExpand` to always return `true`
- Handle loading and error states with `ErrorAlert`

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `skills-table.tsx` is a `'use client'` component that exports `SkillsTable`
- [ ] All six columns defined with proper accessors and sorting
- [ ] Omni-search filters across name and description client-side
- [ ] Min rating and min downloads Select filters work via URL params
- [ ] Expandable rows show full detail panel with all required fields
- [ ] Download button calls `downloadSkill`
- [ ] CLI Install button copies to clipboard with Copy/Check icon animation
- [ ] Loading and error states handled
- [ ] All validation commands pass

---

### Step 7: Update the Homepage to Use SkillsTable

**What**: Replace the `SkillsList` import and usage in `packages/web/src/app/page.tsx` with the new `SkillsTable` component.
**Why**: The homepage must render the new table view instead of the old card grid.
**Confidence**: High

**Files to Modify:**

- `packages/web/src/app/page.tsx` — Swap `SkillsList` for `SkillsTable`

**Changes:**

- Replace the import of `SkillsList` with `SkillsTable` from `@/components/skills/skills-table`
- Replace `<SkillsList />` in the JSX with `<SkillsTable />`
- Keep the existing `PageHeader` with the Upload Skill action exactly as-is
- Keep the `Suspense` boundary wrapping the table component

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `page.tsx` imports and renders `SkillsTable` instead of `SkillsList`
- [ ] `PageHeader` remains unchanged
- [ ] `Suspense` boundary still wraps the new component
- [ ] All validation commands pass

---

### Step 8: Delete Unused Files

**What**: Remove `skill-card.tsx`, `skill-filters.tsx`, and `skills-list.tsx` since they are no longer referenced.
**Why**: These components are fully replaced by the new table implementation.
**Confidence**: Medium (need to verify skill-header.tsx impact)

**Files to Delete:**

- `packages/web/src/components/skills/skill-card.tsx` — Replaced by table columns
- `packages/web/src/components/skills/skill-filters.tsx` — Replaced by SkillsTable inline controls
- `packages/web/src/components/skills/skills-list.tsx` — Replaced by SkillsTable

**Important Note:**

- Do NOT delete `category-colors.ts` — it is still imported by `skill-header.tsx` which is used on the skill detail page (`/skills/[id]`)

**Validation Commands:**

```bash
cd packages/web && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `skill-card.tsx` is deleted
- [ ] `skill-filters.tsx` is deleted
- [ ] `skills-list.tsx` is deleted
- [ ] `category-colors.ts` is retained (still used by `skill-header.tsx`)
- [ ] No import errors — nothing references the deleted files
- [ ] All validation commands pass

---

### Step 9: Full Build Verification

**What**: Run a complete build to verify everything compiles and links correctly end-to-end.
**Why**: Individual lint and typecheck may pass but a full Next.js build can surface route-type generation issues, tree-shaking problems, or other integration issues.
**Confidence**: High

**Validation Commands:**

```bash
cd packages/web && pnpm run build
```

**Success Criteria:**

- [ ] `pnpm run build` completes with zero errors
- [ ] No warnings related to missing imports or unused exports
- [ ] Homepage route (`/`) compiles successfully

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` in `packages/web`
- [ ] All files pass `pnpm run lint:fix` in `packages/web`
- [ ] `pnpm run build` succeeds with zero errors in `packages/web`
- [ ] Manual verification: homepage loads with table view, search works across name and description, rating filter works, downloads filter works, all columns sort correctly, row expansion shows full detail panel with smooth transition, Download button triggers download, CLI Install button copies command to clipboard with icon animation, pagination works when enough data exists
- [ ] Manual verification: skill detail page (`/skills/[id]`) still works correctly (skill-header.tsx still has access to `category-colors.ts`)
- [ ] No console errors in browser DevTools

## Notes

- **category-colors.ts is NOT deleted**: `skill-header.tsx` (used on the skill detail page `/skills/[id]`) imports `getCategoryColor` from it. Deleting it would break the detail page.
- **No formatNumber utility existed**: A new `formatDownloads` function is added to the existing `format.ts` utility file rather than creating a separate file.
- **Clipboard API**: Uses `navigator.clipboard.writeText()` directly. Requires secure context (HTTPS or localhost).
- **CSS transition for row expansion**: Uses CSS `grid-template-rows` transitioning from `0fr` to `1fr` (or `max-height` with `overflow: hidden`). Avoids JavaScript animation libraries.
- **Global filter function**: A custom `globalFilterFn` searches across `name` and `description` fields with case-insensitive matching, ignoring other columns.
- **Pre-filtering for rating/downloads**: Applied as pre-filters on the data array before passing to DataTable, not as column-level filters. Simpler and avoids interfering with global filter.
- **nuqs parseAsInteger**: Returns `null` when param is absent from URL. Component treats `null` as "no filter applied".
- **Route-type regeneration**: After modifying `route-type.ts`, `pnpm run build` will regenerate types via `next-typesafe-url`.
