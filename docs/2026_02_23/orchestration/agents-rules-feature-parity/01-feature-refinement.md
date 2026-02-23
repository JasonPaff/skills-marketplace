# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp**: 2026-02-23
**Duration**: ~4s

## Original Request

Extend the API package (packages/api/) to bring agents and rules to full feature parity with skills. The database schema already has agents and rules tables. Expand queries, create services, create routes, refactor upload service, and update DI wiring. API package only.

## Refined Request

Extend the API package to bring agents and rules to feature parity with skills by implementing a complete query, service, and routing layer for each entity. First, expand agent.queries.ts and rule.queries.ts to add selectAgentById, selectAgents with optional text search, and incrementDownloadCount methods (plus equivalents for rules), mirroring the three-method pattern in skill.queries.ts. Second, create agent.service.ts and rule.service.ts using the factory pattern from skill.service.ts, implementing createAgent/createRule methods that validate SKILL.md/.md frontmatter via existing Zod schemas and commit files to GitHub under agents/{name}/ and rules/{name}/ paths, plus getAgentById, getAgents, downloadAgent methods (and equivalents for rules) with proper 404 handling and download count incrementing. Third, refactor upload.service.ts so batchUpload delegates per-type validation and database insertion to skillService, agentService, and ruleService rather than containing inline logic, keeping the upload service as a thin orchestrator that handles only the cross-type GitHub atomic commit. Fourth, create agents.ts and rules.ts route files mirroring skills.ts with endpoints for GET /api/agents (list with search), GET /api/agents/:id (detail), POST /api/agents (individual create), and GET /api/agents/:id/download (download with count increment)—implementing the same pattern for /api/rules. Finally, update the dependency injection layer by adding agentService and ruleService to the Variables type in packages/api/src/types/env.ts, instantiating both services in the middleware in packages/api/src/index.ts, and registering the new route files on the Hono app. Keep skills, agents, and rules as independent entities with no cross-type associations, and scope changes to the API package only without modifying CLI or web packages.

## Validation

- **Length**: Refined request is ~250 words vs original ~300 words — appropriately concise since original was already detailed
- **Format**: Single paragraph, no headers or bullets
- **Intent Preservation**: Core intent fully preserved
- **Scope Control**: No feature creep introduced
