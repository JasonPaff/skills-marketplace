# Step 2: File Discovery

**Status**: Completed
**Start Time**: 2026-02-11T00:00:00Z
**Duration**: ~67s
**Files Discovered**: 20 files across 6 directories

## Discovered Files

### Critical Priority (7 files)

| # | File | Relevance |
|---|------|-----------|
| 1 | `packages/api/src/services/skill.service.ts` | 13 Drizzle queries to extract (SELECT, INSERT, UPDATE across skills, projects, projectSkills) |
| 2 | `packages/api/src/services/project.service.ts` | 7 Drizzle queries including complex multi-table joins |
| 3 | `packages/api/src/services/client.service.ts` | 2 Drizzle queries (simplest extraction target) |
| 4 | `packages/api/src/services/index.ts` | Barrel export -- may need updates for query layer re-exports |
| 5 | `packages/api/src/db/index.ts` | Defines `Database` type used by both services and new query layer |
| 6 | `packages/api/src/db/schema.ts` | All 4 table definitions (clients, projects, skills, projectSkills) |
| 7 | `packages/api/src/index.ts` | DI middleware (lines 35-55) needs updating for query layer injection |

### High Priority (3 files)

| # | File | Relevance |
|---|------|-----------|
| 8 | `packages/api/src/types/env.ts` | `AppEnv` type with `Variables` -- may need updates if service signatures change |
| 9 | `packages/api/src/db/validation.ts` | Zod insert/select schemas used for type inference in query parameters |
| 10 | `packages/api/src/lib/github.ts` | `GitHubClient` stays in service layer, not query layer -- boundary reference |

### Medium Priority (5 files)

| # | File | Relevance |
|---|------|-----------|
| 11 | `packages/api/src/routes/skills.ts` | Service consumer -- validates service interface stability |
| 12 | `packages/api/src/routes/projects.ts` | Service consumer -- validates service interface stability |
| 13 | `packages/api/src/routes/clients.ts` | Service consumer -- validates service interface stability |
| 14 | `packages/shared/src/schemas.ts` | Shared Zod schemas used for service method parameter types |
| 15 | `packages/shared/src/types.ts` | TypeScript types for query return values |

### Low Priority (5 files)

| # | File | Relevance |
|---|------|-----------|
| 16 | `packages/api/drizzle.config.ts` | Confirms schema location and DB dialect |
| 17 | `packages/api/package.json` | drizzle-orm v0.45, drizzle-zod v0.8.3, @neondatabase/serverless v1.0 |
| 18 | `packages/api/tsconfig.json` | rootDir/outDir for file placement |
| 19 | `packages/api/src/db/seed.ts` | Contains direct Drizzle calls (low priority refactor candidate) |
| 20 | `docs/api-architecture-review.md` | Architecture context and patterns |

## Drizzle Operations Inventory (22 total)

| Table | SELECT | INSERT | UPDATE | Total |
|-------|--------|--------|--------|-------|
| `skills` | 7 | 2 | 2 | 11 |
| `projects` | 4 | 1 | 0 | 5 |
| `clients` | 2 | 1 | 0 | 3 |
| `projectSkills` | 1 | 2 | 0 | 3 |
| **Total** | **14** | **6** | **2** | **22** |

## Suggested New File Structure

```
packages/api/src/
  queries/
    index.ts                   # Barrel exports
    client.queries.ts          # createClientQueries(db) -- 2 query functions
    project.queries.ts         # createProjectQueries(db) -- 7 query functions
    skill.queries.ts           # createSkillQueries(db) -- 13 query functions
```

## Architecture Insights

- **Factory function pattern**: Follow `createXxxQueries(db)` convention
- **Database type**: Import `Database` from `db/index.ts`
- **HTTPException**: Stays in services, queries return null/empty arrays
- **Drizzle imports**: Only query layer imports Drizzle operators; services become Drizzle-free
