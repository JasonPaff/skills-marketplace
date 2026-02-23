# Step 2: File Discovery

## Metadata
- **Status**: Completed
- **Files Discovered**: 53 total
- **Existing Files to Modify**: 13
- **New Files to Create**: 15
- **Reference Files**: 25

## Critical - Existing Files to Modify

| # | File | Why |
|---|------|-----|
| 1 | `packages/api/src/db/schema.ts` | Add bundles table + 3 join tables |
| 2 | `packages/shared/src/schemas.ts` | Add bundle Zod schemas |
| 3 | `packages/shared/src/types.ts` | Add Bundle types |
| 4 | `packages/shared/src/constants.ts` | Add 'bundle' to ITEM_TYPES |
| 5 | `packages/api/src/queries/index.ts` | Export bundle queries |
| 6 | `packages/api/src/services/index.ts` | Export bundle service |
| 7 | `packages/api/src/services/upload.service.ts` | Auto-create bundle on batch upload |
| 8 | `packages/api/src/types/env.ts` | Add bundleService to Variables |
| 9 | `packages/api/src/index.ts` | Wire bundle DI + mount routes |
| 10 | `packages/api/src/db/validation.ts` | Add bundle insert/select schemas |
| 11 | `packages/web/src/lib/api.ts` | Add agent/rule/bundle API functions |
| 12 | `packages/web/src/app/page.tsx` | Replace placeholder with marketplace |
| 13 | `packages/web/src/app/layout.tsx` | Add navigation links |

## Critical - New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/api/src/queries/bundle.queries.ts` | Bundle DB queries |
| 2 | `packages/api/src/services/bundle.service.ts` | Bundle business logic |
| 3 | `packages/api/src/routes/bundles.ts` | Bundle REST endpoints |
| 4 | `packages/web/src/lib/query/keys.ts` | Query key factory |
| 5 | `packages/web/src/lib/query/use-skills.ts` | Skills list hook |
| 6 | `packages/web/src/lib/query/use-skill.ts` | Single skill hook |
| 7 | `packages/web/src/lib/query/use-agents.ts` | Agents list hook |
| 8 | `packages/web/src/lib/query/use-rules.ts` | Rules list hook |
| 9 | `packages/web/src/lib/query/use-bundles.ts` | Bundles list hook |
| 10 | `packages/web/src/lib/query/use-batch-upload.ts` | Batch upload mutation hook |
| 11 | `packages/web/src/app/skills/[id]/page.tsx` | Skill detail page |
| 12 | `packages/web/src/app/agents/[id]/page.tsx` | Agent detail page |
| 13 | `packages/web/src/app/rules/[id]/page.tsx` | Rule detail page |
| 14 | `packages/web/src/app/bundles/[id]/page.tsx` | Bundle detail page |
| 15 | `packages/web/src/app/upload/page.tsx` | Upload page |

## Architecture Insights

- All API layers follow factory pattern: `createXxxQueries(db)` -> `createXxxService(queries, github)` -> router uses `c.get('xxxService')`
- The `routes` chain in `index.ts` determines `AppType` for RPC - bundle router must be in this chain
- No React Query hooks exist yet - `packages/web/src/lib/query/` needs to be created
- `@lukemorales/query-key-factory` is already in package.json
- Home page is blank "Coming Soon!" placeholder
- Bundles are metadata-only aggregations (no own GitHub files, aggregate from constituent items)
- Join tables need composite primary keys `(bundleId, itemId)`
