# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Agent and Rule Frontmatter Schemas/Parsers | general-purpose | `packages/shared/src/schemas.ts` |
| 2 | Batch Upload Schema and Item Type Constants | general-purpose | `packages/shared/src/schemas.ts`, `packages/shared/src/constants.ts` |
| 3 | Inferred Types for Agent, Rule, Batch Upload | general-purpose | `packages/shared/src/types.ts`, `packages/shared/src/index.ts` |
| 4 | Agents and Rules Database Tables | general-purpose | `packages/api/src/db/schema.ts` |
| 5 | Drizzle-Zod Validation Schemas | general-purpose | `packages/api/src/db/validation.ts` |
| 6 | Agent and Rule Database Queries | general-purpose | `packages/api/src/queries/agent.queries.ts`, `packages/api/src/queries/rule.queries.ts`, `packages/api/src/queries/index.ts` |
| 7 | Batch Upload Service | general-purpose | `packages/api/src/services/upload.service.ts`, `packages/api/src/services/index.ts` |
| 8 | Register Upload Service in DI | general-purpose | `packages/api/src/types/env.ts`, `packages/api/src/index.ts` |
| 9 | Batch Upload API Endpoint | general-purpose | `packages/api/src/routes/upload.ts`, `packages/api/src/index.ts` |
| 10 | Frontend API Client and React Query Hook | general-purpose | `packages/web/src/lib/api.ts`, `packages/web/src/lib/query/use-batch-upload.ts` |
| 11 | Folder Structure Detection Utility | general-purpose | `packages/web/src/lib/utils/folder-detection.ts` |
| 12 | Rework Upload Form | general-purpose | `packages/web/src/components/forms/skill-form.tsx` |
| 13 | Update Upload Page Heading | general-purpose | `packages/web/src/app/skills/new/page.tsx` |
| 14 | Seed Data for Agents and Rules | general-purpose | `packages/api/src/db/seed.ts` |

## Execution Strategy

Steps 1-3 (shared package) are sequential - each builds on the previous.
Steps 4-5 (database) are sequential - schema before validation.
Step 6 (queries) depends on step 4.
Steps 7-9 (API) are sequential - service, DI, then route.
Steps 10-11 (frontend utilities) can run after step 9.
Step 12 (form) depends on steps 10-11.
Step 13 (page heading) can run alongside step 12.
Step 14 (seed data) depends on step 4.
