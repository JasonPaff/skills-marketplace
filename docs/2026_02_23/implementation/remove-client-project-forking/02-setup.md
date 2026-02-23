# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Clean Up Shared Package - Constants | general-purpose | `packages/shared/src/constants.ts` |
| 2 | Clean Up Shared Package - Schemas | general-purpose | `packages/shared/src/schemas.ts` |
| 3 | Clean Up Shared Package - Types | general-purpose | `packages/shared/src/types.ts` |
| 4 | Clean Up API Package - Database Schema | general-purpose | `packages/api/src/db/schema.ts` |
| 5 | Clean Up API Package - Database Validation Schemas | general-purpose | `packages/api/src/db/validation.ts` |
| 6 | Clean Up API Package - Skill Queries | general-purpose | `packages/api/src/queries/skill.queries.ts` |
| 7 | Delete Client and Project Query and Service Files | Bash | 4 files to delete |
| 8 | Update Query and Service Index Barrels | general-purpose | `packages/api/src/queries/index.ts`, `packages/api/src/services/index.ts` |
| 9 | Clean Up Skill Service - Remove Fork Logic | general-purpose | `packages/api/src/services/skill.service.ts` |
| 10 | Clean Up Upload Service - Simplify Paths | general-purpose | `packages/api/src/services/upload.service.ts` |
| 11 | Clean Up Skills Router - Remove Fork Endpoint | general-purpose | `packages/api/src/routes/skills.ts` |
| 12 | Delete Client and Project Route Files | Bash | 2 files to delete |
| 13 | Update API Entry Point and Environment Types | general-purpose | `packages/api/src/types/env.ts`, `packages/api/src/index.ts` |
| 14 | Clean Up Web Package - API Client | general-purpose | `packages/web/src/lib/api.ts` |
| 15 | Clean Up Web Package - Query Keys and Delete Hook Files | general-purpose | 3 files |
| 16 | Clean Up Web Package - Skill Stats Component | general-purpose | `packages/web/src/components/skills/skill-stats.tsx` |
| 17 | Full Workspace Validation | Bash | N/A |

## Execution Order

Steps 1-3 (shared) → Steps 4-13 (API) → Steps 14-16 (web) → Step 17 (validation)

Note: Steps 7+8 and 12+13 should be executed together to minimize broken state.
