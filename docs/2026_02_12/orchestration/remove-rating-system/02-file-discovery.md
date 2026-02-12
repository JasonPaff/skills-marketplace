# Step 2: File Discovery

**Start**: 2026-02-12T00:00:22Z
**End**: 2026-02-12T00:01:30Z
**Duration**: ~68s
**Status**: Completed

## Discovery Summary

- Explored 8 directories across 3 packages (api, shared, web) plus Bruno test collection
- Examined 35+ candidate files
- Found 23 relevant source files (5 to delete, 16 to modify, 2 reference-only)
- Identified 20+ documentation files with rating references (optional cleanup)

## Discovered Files

### Critical Priority (7 files - Modify)

| # | File | Action |
|---|------|--------|
| 1 | `packages/api/src/db/schema.ts` | Modify - remove rating columns |
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
| 18 | `packages/web/src/app/route-type.ts` | Modify - remove rating field (NEW FIND) |

### Medium Priority (4 files - Modify/Reference)

| # | File | Action |
|---|------|--------|
| 19 | `packages/api/src/queries/project.queries.ts` | Modify - remove rating selects |
| 20 | `packages/api/src/db/seed.ts` | Modify - remove rating seed values |
| 21 | `packages/api/drizzle/0000_secret_puppet_master.sql` | Modify in-place per user request |
| 22 | `packages/api/drizzle/meta/0000_snapshot.json` | Reference only |

### Low Priority (1 file - Delete)

| # | File | Action |
|---|------|--------|
| 23 | `Skills Marketplace/Skills/Rate Skill.bru` | **Delete** |

## Additional Discovery (Not in Original Request)

- `packages/web/src/app/route-type.ts` - Contains `rating: z.coerce.number().int().optional()` field that must be removed

## Architecture Insights

1. Hono RPC type inference chain: removing the POST route auto-removes it from AppType, causing cascading TS errors if web client not updated
2. Search params cleanup requires coordinated changes across route-type.ts, search-params.ts, and skills-table.tsx
3. The `real` import in schema.ts may become unused after removing averageRating
