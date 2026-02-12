# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Update Shared Constants | general-purpose | packages/shared/src/constants.ts |
| 2 | Update Shared Zod Schemas | general-purpose | packages/shared/src/schemas.ts |
| 3 | Update Database Schema & Generate Migration | general-purpose | packages/api/src/db/schema.ts |
| 4 | Update Drizzle-Zod Validation Schemas | general-purpose | packages/api/src/db/validation.ts |
| 5 | Update Skill Queries | general-purpose | packages/api/src/queries/skill.queries.ts |
| 6 | Update Project Queries | general-purpose | packages/api/src/queries/project.queries.ts |
| 7 | Update Skill Service | general-purpose | packages/api/src/services/skill.service.ts |
| 8 | Update Project Service | general-purpose | packages/api/src/services/project.service.ts |
| 9 | Update Seed Data | general-purpose | packages/api/src/db/seed.ts |
| 10 | Add Error Variant to Input | general-purpose | packages/web/src/components/ui/input.tsx |
| 11 | Add Error Variant to Textarea | general-purpose | packages/web/src/components/ui/textarea.tsx |
| 12 | Enhance FormField Accessibility | general-purpose | packages/web/src/components/forms/form-field.tsx |
| 13 | Rewrite Skill Form (TanStack Form + Zod) | general-purpose | packages/web/src/components/forms/skill-form.tsx |
| 14 | Update Skill Card Component | general-purpose | packages/web/src/components/skills/skill-card.tsx |
| 15 | Update Skill Header Component | general-purpose | packages/web/src/components/skills/skill-header.tsx |
| 16 | Update Skill Metadata Component | general-purpose | packages/web/src/components/skills/skill-metadata.tsx |
| 17 | Update Skill Filters Component | general-purpose | packages/web/src/components/skills/skill-filters.tsx |
| 18 | Update Skills List Component | general-purpose | packages/web/src/components/skills/skills-list.tsx |
| 19 | Update Data Fetching Layer | general-purpose | packages/web/src/lib/api.ts, use-skills.ts, search-params.ts, keys.ts, route-type.ts |
| 20 | Delete Category Colors Utility | general-purpose | packages/web/src/lib/utils/category-colors.ts |
| 21 | Full Monorepo Build & Validation | general-purpose | (full build) |

## Step Dependencies

Steps 1-9: Backend changes (sequential - each builds on prior removals)
Steps 10-12: UI component enhancements (can run in parallel)
Step 13: Form rewrite (depends on steps 10-12)
Steps 14-18: Display component updates (can run in parallel)
Step 19: Data fetching layer (depends on shared schema changes)
Step 20: Delete utility file (after display components updated)
Step 21: Final validation (after all steps)
