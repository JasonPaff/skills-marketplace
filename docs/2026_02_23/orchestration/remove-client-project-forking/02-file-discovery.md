# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-23
**Duration**: ~185s

## Discovery Statistics

- Packages explored: 4 (api, shared, web, cli)
- Files examined: 60+
- Critical files (DELETE): 8
- High priority files (MODIFY): 14
- Medium priority files (CLI cleanup): 5
- Low priority files (docs): 3

## Critical Priority - Files to DELETE

| File | Reason |
|------|--------|
| `packages/api/src/routes/clients.ts` | Entire client router |
| `packages/api/src/routes/projects.ts` | Entire project router |
| `packages/api/src/queries/client.queries.ts` | Client query factory |
| `packages/api/src/queries/project.queries.ts` | Project query factory |
| `packages/api/src/services/client.service.ts` | Client service factory |
| `packages/api/src/services/project.service.ts` | Project service factory |
| `packages/web/src/lib/query/use-clients.ts` | React Query hook for clients |
| `packages/web/src/lib/query/use-projects.ts` | React Query hook for projects |

## High Priority - Files to MODIFY

| File | Changes |
|------|---------|
| `packages/api/src/db/schema.ts` | Remove clients, projects, projectSkills tables + relations; remove parentSkillId from skills |
| `packages/api/src/db/validation.ts` | Remove client/project/projectSkills insert/select schemas |
| `packages/api/src/queries/skill.queries.ts` | Remove selectProjectById(), insertProjectSkill() |
| `packages/api/src/queries/index.ts` | Remove client/project query exports |
| `packages/api/src/services/skill.service.ts` | Remove forkSkill(), simplify deriveGithubPath() |
| `packages/api/src/services/upload.service.ts` | Simplify path derivation (remove /global/) |
| `packages/api/src/services/index.ts` | Remove client/project service exports |
| `packages/api/src/routes/skills.ts` | Remove POST /api/skills/:id/fork endpoint |
| `packages/api/src/types/env.ts` | Remove clientService/projectService from Variables |
| `packages/api/src/index.ts` | Remove client/project DI, route mounting |
| `packages/shared/src/schemas.ts` | Remove client/project/fork schemas |
| `packages/shared/src/types.ts` | Remove client/project/fork type exports |
| `packages/shared/src/constants.ts` | Remove SKILL_SCOPES |
| `packages/web/src/lib/api.ts` | Remove client/project/fork API functions |
| `packages/web/src/lib/query/keys.ts` | Remove client/project query keys |
| `packages/web/src/components/skills/skill-stats.tsx` | Remove parentSkillId reference |

## Medium Priority - CLI Impact (out of explicit scope but will break)

| File | Issue |
|------|-------|
| `packages/cli/src/commands/install.ts` | References SKILL_SCOPES, SkillScope |
| `packages/cli/src/lib/api.ts` | Contains fetchProjects(), fetchProjectSkills() |
| `packages/cli/src/lib/providers/index.ts` | ProviderAdapter uses SkillScope |
| `packages/cli/src/lib/providers/claude.ts` | Global vs project branching |
| `packages/cli/src/lib/providers/copilot.ts` | Global vs project branching |

## Key Architecture Insights

1. Layered deletion is clean: remove file at each layer, then barrel exports, then DI
2. Hono RPC AppType auto-shrinks when routes removed - breaks web and CLI clients
3. Removing parentSkillId from schema cascades through shared types to all consumers
4. GitHub path prefix `skills/global/` should become `skills/` (breaking for existing data, but DB reset planned)
5. SKILL_SCOPES removal will break CLI package (not in explicit scope)
