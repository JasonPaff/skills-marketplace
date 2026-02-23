# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-23
**Duration**: ~116s

## Discovery Summary

- Explored 5 directories within packages/api/src/ and packages/shared/src/
- Examined 19 candidate files across both packages
- Found 10 highly relevant files (Critical + High priority)
- Identified 6 supporting/reference files (Medium + Low priority)
- **4 new files** to create, **8 existing files** to modify

## Gap Analysis

| Layer | Skills | Agents | Rules |
|-------|--------|--------|-------|
| Query: insert | Yes | Yes | Yes |
| Query: selectById | Yes | **Missing** | **Missing** |
| Query: selectAll (with search) | Yes | **Missing** | **Missing** |
| Query: incrementDownloadCount | Yes | **Missing** | **Missing** |
| Service: create | Yes | **Missing** | **Missing** |
| Service: getById | Yes | **Missing** | **Missing** |
| Service: getAll | Yes | **Missing** | **Missing** |
| Service: download | Yes | **Missing** | **Missing** |
| Route: GET / | Yes | **Missing** | **Missing** |
| Route: GET /:id | Yes | **Missing** | **Missing** |
| Route: POST / | Yes | **Missing** | **Missing** |
| Route: GET /:id/download | Yes | **Missing** | **Missing** |

## Critical Priority (Create or Significantly Modify)

1. `packages/api/src/queries/agent.queries.ts` — Add selectAgentById, selectAgents, incrementDownloadCount
2. `packages/api/src/queries/rule.queries.ts` — Add selectRuleById, selectRules, incrementDownloadCount
3. `packages/api/src/services/upload.service.ts` — Refactor to delegate to type services
4. `packages/api/src/services/agent.service.ts` (NEW) — Full agent service
5. `packages/api/src/services/rule.service.ts` (NEW) — Full rule service
6. `packages/api/src/routes/agents.ts` (NEW) — Agent route endpoints
7. `packages/api/src/routes/rules.ts` (NEW) — Rule route endpoints
8. `packages/shared/src/schemas.ts` — Add agentsQuerySchema, rulesQuerySchema

## High Priority (Minor Modifications)

9. `packages/api/src/types/env.ts` — Add agentService, ruleService to Variables
10. `packages/api/src/index.ts` — DI wiring, imports, route registration
11. `packages/api/src/services/index.ts` — Barrel exports for new services
12. `packages/shared/src/types.ts` — Add AgentDownloadResponse, RuleDownloadResponse

## Medium Priority (Reference Files)

13. `packages/api/src/queries/skill.queries.ts` — Query pattern reference
14. `packages/api/src/services/skill.service.ts` — Service pattern reference
15. `packages/api/src/routes/skills.ts` — Route pattern reference

## Low Priority (Context Only)

16. `packages/api/src/db/schema.ts` — Schema already complete
17. `packages/api/src/db/validation.ts` — Drizzle-Zod schemas already complete
18. `packages/api/src/db/index.ts` — DB connection, no changes
19. `packages/api/src/lib/github.ts` — GitHub client, no changes
20. `packages/api/src/queries/index.ts` — Already exports agent/rule queries
21. `packages/shared/src/constants.ts` — Already includes agents/rules
