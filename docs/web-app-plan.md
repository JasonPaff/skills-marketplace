# Web App Architecture & Patterns Refactor

## Context

The web app is functional but built with "god components" - 3 page files with all logic inline, no reusable abstractions, and many installed-but-unused libraries. This refactor establishes the foundational patterns and component library the app will build on going forward: extracting utilities, creating a UI component library, setting up proper data hooks, integrating form management, and decomposing the god components into focused, reusable pieces.

## Phase 1: Foundation Utilities

No dependencies, everything else builds on this.

### 1.1 `cn()` utility
- **File:** `src/lib/utils/cn.ts`
- Combines `clsx` + `tailwind-merge` for safe className composition
- Used by every UI component

### 1.2 Category colors utility
- **File:** `src/lib/utils/category-colors.ts`
- Extract the duplicated `categoryColors` object from `page.tsx` and `[id]/page.tsx`
- Map categories to Badge variant names, type-safe with `SkillCategory`

### 1.3 Date/number formatters
- **File:** `src/lib/utils/format.ts`
- Extract `new Date(skill.uploadedAt).toLocaleDateString()` and `Number(skill.averageRating).toFixed(1)` patterns

---

## Phase 2: UI Component Library (`src/components/ui/`)

All components use CVA for variants, `cn()` for class merging, and wrap Base UI primitives where they add value. Each component follows the pattern: CVA variants + extends native HTML props.
- No forwardRef because its not needed in React 19.

### 2.1 Button (`button.tsx`)
- Wraps `@base-ui/react` Button
- CVA variants: `variant` (primary, secondary, ghost, destructive), `size` (sm, md, lg), `fullWidth`
- Props: `loading`, `disabled`, standard button props

### 2.2 Input (`input.tsx`)
- Wraps `@base-ui/react` Input
- Consistent focus ring, border, disabled styling
- Extends native input props

### 2.3 Textarea (`textarea.tsx`)
- Same pattern as Input for textarea elements

### 2.4 Select (`select.tsx`)
- Wraps `@base-ui/react` Select
- Same styling pattern as Input

### 2.5 Checkbox (`checkbox.tsx`)
- Wraps `@base-ui/react` Checkbox
- Label integration

### 2.6 RadioGroup (`radio-group.tsx`)
- Wraps `@base-ui/react` RadioGroup
- Takes `options` array with `{ value, label }`

### 2.7 Badge (`badge.tsx`)
- Pure CVA component
- Variants: `variant` (neutral, primary, success, warning, danger, purple, sky, cyan, orange), `size` (sm, md)
- Used for category badges and scope badges

### 2.8 Card (`card.tsx`)
- Pure CVA component
- Variants: `interactive` (hover effects for clickable cards), `padding` (sm, md, lg)

---

## Phase 3: Layout Components (`src/components/layout/`)

Shared structural components extracted from the pages.

### 3.1 PageHeader (`page-header.tsx`) - Server Component
- Props: `title`, `description?`, `action?: { label, href }`
- Replaces the inline header in home page

### 3.2 BackLink (`back-link.tsx`) - Server Component
- Props: `href`, `label`
- Uses lucide-react `ArrowLeft` icon instead of `&larr;` HTML entity
- Replaces inline back links in skill detail and create skill pages

### 3.3 ErrorAlert (`error-alert.tsx`) - Server Component
- Props: `message`, `error?: Error`
- Consistent error display (red border, red background)

---

## Phase 4: Data Layer

### 4.1 Query Key Factory (`src/lib/query/keys.ts`)
- Uses `@lukemorales/query-key-factory`
- Defines key structure:
    - `skills` - `all`, `list(filters)`, `detail(id)`
    - `projects` - `all`, `list(clientId?)`, `detail(id)`
    - `clients` - `all`

### 4.2 Query Hooks (`src/lib/query/`)
- **`use-skills.ts`** - `useSkills(filters?)` wraps `fetchSkills`
- **`use-skill.ts`** - `useSkill(id)` wraps `fetchSkill`
- **`use-projects.ts`** - `useProjects(clientId?)` wraps `fetchProjects`
- **`use-clients.ts`** - `useClients()` wraps `fetchClients`

### 4.3 Mutation Hooks (`src/lib/query/`)
- **`use-create-skill.ts`** - `useCreateSkill()` wraps `createSkill`, invalidates skills list
- **`use-rate-skill.ts`** - `useRateSkill(skillId)` wraps `rateSkill`, invalidates skill detail + list
- Each accepts `onSuccess`/`onError` callbacks

### 4.4 URL State with nuqs (`src/lib/search-params.ts`)
- Add `NuqsAdapter` to `providers.tsx`
- Define parsers: `parseAsString` for `search` and `category`
- `useSkillsSearchParams()` hook using `useQueryStates`

### 4.5 Route Params with next-typesafe-url (`src/lib/routes.ts`)
- Define Zod schema for `[id]` route: `{ id: z.string().uuid() }`
- Use `$path` and/or validation patterns (verify exact API during implementation via context7)

---

## Phase 5: Form Components (`src/components/forms/`)

### 5.1 FormField wrapper (`form-field.tsx`)
- Props: `label`, `required?`, `error?`, `hint?`, `children`
- Renders label, wraps children, shows hint or error text
- Used by all form integrations
- Follows a11y best practices for form fieldssssssssssss

### 5.2 InteractiveStarRating (`interactive-star-rating.tsx`)
- Props: `value`, `onChange`
- Hover state with `useState`
- Uses lucide-react `Star` icon (filled/unfilled)

---

## Phase 6: Feature Components (`src/components/skills/`)

### 6.1 StarRating (`star-rating.tsx`) - Server Component
- Props: `rating: number`, `showLabel?: boolean`
- Read-only display, uses lucide-react `Star` icon
- Replaces inline `StarRating` from home page

### 6.2 SkillCard (`skill-card.tsx`) - Client Component
- Props: `skill: Skill`
- Composes: `Card`, `Badge`, `StarRating`, `Link`
- Replaces the inline card JSX in home page grid

### 6.3 SkillFilters (`skill-filters.tsx`) - Client Component
- Uses `useSkillsSearchParams()` hook (nuqs)
- Renders `Input` for search + `Select` for category
- URL-driven instead of useState

### 6.4 SkillsList (`skills-list.tsx`) - Client Component
- Orchestrates: `useSkillsSearchParams` + `useSkills` hook
- Renders `SkillFilters`, loading state, error state, empty state, or card grid
- Replaces bulk of home page logic

### 6.5 SkillHeader (`skill-header.tsx`) - Server Component
- Props: `skill: Skill`
- Title, category badge, scope badge, version

### 6.6 SkillStats (`skill-stats.tsx`) - Server Component
- Props: `skill: Skill`
- 3-column stats grid (downloads, rating, source)

### 6.7 SkillMetadata (`skill-metadata.tsx`) - Server Component
- Props: `skill: Skill`
- Uploaded by, GitHub path, upload date

### 6.8 SkillDetailContent (`skill-detail-content.tsx`) - Client Component
- Props: `id: string`
- Orchestrates: `useSkill(id)` hook
- Composes: `SkillHeader`, `SkillStats`, `SkillMetadata`, `RatingForm`
- Wrapped in `ErrorBoundary`

### 6.9 SkillForm (`skill-form.tsx`) - Client Component
- Uses TanStack Form with `createSkillSchema` from `@emergent/shared` for validation
- Uses `useCreateSkill()` mutation hook
- Uses `useProjects()` for project dropdown
- Composes: `FormField`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Button`, `Card`
- Replaces all 7 useState hooks + manual validation in current form

### 6.10 RatingForm (`rating-form.tsx`) - Client Component
- Uses TanStack Form with `rateSkillSchema` for validation
- Uses `useRateSkill(skillId)` mutation hook
- Composes: `FormField`, `InteractiveStarRating`, `Input`, `Button`

---

## Phase 7: Page Refactoring

### 7.1 Providers (`providers.tsx`)
- Add `NuqsAdapter` wrapper
- Add `ReactQueryDevtools` (dev only)

### 7.2 Home Page (`app/page.tsx`)
- **Before:** 216-line god component with useState, useQuery, inline JSX
- **After:** ~15-line server component that renders `PageHeader` + `Suspense` > `SkillsList`
- Filters become URL-driven via nuqs

### 7.3 Create Skill Page (`app/skills/new/page.tsx`)
- **Before:** 242-line god component with 7 useState, manual validation, inline form
- **After:** ~10-line server component that renders `BackLink` + heading + `SkillForm`

### 7.4 Skill Detail Page (`app/skills/[id]/page.tsx`)
- **Before:** 229-line god component with inline query, mutation, rating form
- **After:** ~15-line server component with param validation, renders `BackLink` + `SkillDetailContent`

### 7.5 Error/Loading files
- Add `app/error.tsx` - App-level error boundary using `react-error-boundary`
- Add `app/loading.tsx` - App-level loading fallback

---

## Phase 8: TanStack Table Setup

The user mentioned "the big table" as an upcoming feature. This phase sets up the TanStack Table infrastructure so it's ready when needed.

### 8.1 DataTable component (`src/components/ui/data-table.tsx`)
- Generic, reusable table component wrapping `@tanstack/react-table`
- Props: `columns`, `data`, sorting/filtering/pagination support
- Styled with Tailwind to match the app's design

---

## Final Directory Structure

```
src/
├── app/
│   ├── error.tsx                    (new)
│   ├── globals.css                  (existing)
│   ├── layout.tsx                   (existing, minimal changes)
│   ├── loading.tsx                  (new)
│   ├── page.tsx                     (refactored → server component)
│   ├── providers.tsx                (enhanced with NuqsAdapter)
│   └── skills/
│       ├── [id]/
│       │   └── page.tsx             (refactored → server component)
│       └── new/
│           └── page.tsx             (refactored → server component)
├── components/
│   ├── forms/
│   │   ├── form-field.tsx           (new)
│   │   ├── interactive-star-rating.tsx (new)
│   │   ├── rating-form.tsx          (new)
│   │   └── skill-form.tsx           (new)
│   ├── layout/
│   │   ├── back-link.tsx            (new)
│   │   ├── error-alert.tsx          (new)
│   │   └── page-header.tsx          (new)
│   ├── skills/
│   │   ├── skill-card.tsx           (new)
│   │   ├── skill-detail-content.tsx (new)
│   │   ├── skill-filters.tsx        (new)
│   │   ├── skill-header.tsx         (new)
│   │   ├── skill-metadata.tsx       (new)
│   │   ├── skill-stats.tsx          (new)
│   │   ├── skills-list.tsx          (new)
│   │   └── star-rating.tsx          (new)
│   └── ui/
│       ├── badge.tsx                (new)
│       ├── button.tsx               (new)
│       ├── card.tsx                 (new)
│       ├── checkbox.tsx             (new)
│       ├── data-table.tsx           (new)
│       ├── input.tsx                (new)
│       ├── radio-group.tsx          (new)
│       ├── select.tsx               (new)
│       └── textarea.tsx             (new)
└── lib/
    ├── api.ts                       (existing, unchanged)
    ├── query/
    │   ├── keys.ts                  (new)
    │   ├── use-clients.ts           (new)
    │   ├── use-create-skill.ts      (new)
    │   ├── use-projects.ts          (new)
    │   ├── use-rate-skill.ts        (new)
    │   ├── use-skill.ts             (new)
    │   └── use-skills.ts            (new)
    ├── routes.ts                    (new)
    ├── search-params.ts             (new)
    └── utils/
        ├── category-colors.ts       (new)
        ├── cn.ts                    (new)
        └── format.ts                (new)
```

## Key Patterns

**UI Components:** CVA variants + `cn()` + extend native HTML props
**Query Hooks:** Query key factory keys + API function + `useQuery`/`useMutation`
**Forms:** TanStack Form + Zod schemas from `@emergent/shared` + `FormField` wrapper + UI components
**URL State:** nuqs `parseAsString` parsers + `useQueryStates` hook
**Server/Client Boundary:** Pages are server components; interactive orchestrators and form components are client components

## Verification

1. `pnpm --filter @emergent/web dev` - app starts without errors
2. Home page: search/category filters update URL, back/forward navigation works
3. Create skill: form validates using Zod schema, submits successfully, redirects to detail page
4. Skill detail: loads by ID, rating form submits and updates display
5. `pnpm --filter @emergent/web typecheck` - no TypeScript errors
6. `pnpm --filter @emergent/web lint` - no lint errors
7. `pnpm --filter @emergent/web build` - production build succeeds

## Other
- You must delegate a subagent and telll it to use context7 for any API interactions to ensure the new query hooks and route validation are properly utilized during implementation.