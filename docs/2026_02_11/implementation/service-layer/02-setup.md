# Setup and Routing Table

**Feature**: Service Layer Implementation
**Branch**: feat/service-layer

## Routing Table

| Step | Title | Specialist | Target Files |
|------|-------|-----------|-------------|
| 1 | Analyze Codebase Structure | Explore | (read-only analysis) |
| 2 | Create Consolidated AppEnv Type | general-purpose | packages/api/src/types/env.ts |
| 3 | Create ClientService Module | general-purpose | packages/api/src/services/client.service.ts |
| 4 | Create ProjectService Module | general-purpose | packages/api/src/services/project.service.ts |
| 5 | Create SkillService Module | general-purpose | packages/api/src/services/skill.service.ts |
| 6 | Create Services Barrel Export | general-purpose | packages/api/src/services/index.ts |
| 7 | Update AppEnv with Service Types | general-purpose | packages/api/src/types/env.ts |
| 8 | Inject Services in Middleware | general-purpose | packages/api/src/index.ts |
| 9 | Refactor Clients Route Handlers | general-purpose | packages/api/src/routes/clients.ts |
| 10 | Refactor Projects Route Handlers | general-purpose | packages/api/src/routes/projects.ts |
| 11 | Refactor Skills Route Handlers | general-purpose | packages/api/src/routes/skills.ts |
| 12 | Verify Integration and Error Handling | general-purpose | (validation only) |
| QG | Quality Gates | Bash | (lint, typecheck, test) |

## Execution Order
- Steps 1 → sequential (analysis first)
- Steps 2-6 → sequential (build up from types to services)
- Step 7 → depends on steps 2, 6
- Step 8 → depends on step 7
- Steps 9-11 → sequential after step 8 (refactor routes)
- Step 12 → after all steps complete
- QG → final validation
