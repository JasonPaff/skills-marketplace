# Setup and Routing Table

## Step Routing Table

| Step | Title | Specialist | Key Files |
|------|-------|-----------|-----------|
| 1 | Add Bundle Zod Schemas and Types to Shared Package | general-purpose | `packages/shared/src/schemas.ts`, `types.ts`, `constants.ts` |
| 2 | Add Bundles Table and Join Tables to Database Schema | general-purpose | `packages/api/src/db/schema.ts`, `validation.ts` |
| 3 | Generate and Apply Database Migration | Bash | Migration files |
| 4 | Create Bundle Queries | general-purpose | `packages/api/src/queries/bundle.queries.ts`, `index.ts` |
| 5 | Create Bundle Service | general-purpose | `packages/api/src/services/bundle.service.ts`, `index.ts` |
| 6 | Create Bundle Routes | general-purpose | `packages/api/src/routes/bundles.ts` |
| 7 | Wire Bundle DI and Routes into API Index | general-purpose | `packages/api/src/types/env.ts`, `index.ts` |
| 8 | Modify Upload Service to Auto-Create Bundles | general-purpose | `packages/api/src/services/upload.service.ts`, `index.ts` |
| 9 | Extend Web API Client | general-purpose | `packages/web/src/lib/api.ts` |
| 10 | Create React Query Key Factory and Hooks | general-purpose | `packages/web/src/lib/query/*.ts` |
| 11 | Build the Marketplace Home Page | general-purpose | `packages/web/src/app/page.tsx`, `marketplace-table.tsx` |
| 12 | Create Detail Pages for All Entity Types | general-purpose | `packages/web/src/app/{skills,agents,rules,bundles}/[id]/page.tsx` |
| 13 | Create the Upload Page | general-purpose | `packages/web/src/app/upload/page.tsx`, `upload-form.tsx` |
| 14 | Add Navigation to Layout | general-purpose | `packages/web/src/app/layout.tsx` |
| 15 | End-to-End Verification and Cleanup | Bash | All packages |
