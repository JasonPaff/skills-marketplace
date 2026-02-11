# Service Layer Implementation Plan

Generated: 2026-02-11
Original Request: Introduce a service layer to the API package (Issue 1 from api-architecture-review)
Priority: Critical

## Analysis Summary

- Feature request refined with project context
- Discovered 17 files across 6 directories
- Generated 12-step implementation plan

## File Discovery Results

### Critical (Create)
- `packages/api/src/services/skill.service.ts` - SkillService factory
- `packages/api/src/services/project.service.ts` - ProjectService factory
- `packages/api/src/services/client.service.ts` - ClientService factory
- `packages/api/src/services/index.ts` - Barrel exports
- `packages/api/src/types/env.ts` - Consolidated AppEnv type

### Critical (Modify)
- `packages/api/src/routes/skills.ts` - Refactor to thin handlers
- `packages/api/src/routes/projects.ts` - Refactor to thin handlers
- `packages/api/src/routes/clients.ts` - Refactor to thin handlers
- `packages/api/src/index.ts` - Inject services in middleware

### High (Dependencies)
- `packages/api/src/db/schema.ts` - Drizzle tables used by services
- `packages/api/src/db/index.ts` - Database type for service injection
- `packages/api/src/lib/github.ts` - GitHubClient for SkillService
- `packages/shared/src/schemas.ts` - Zod schemas
- `packages/shared/src/types.ts` - TypeScript types

---

## Implementation Plan

### Overview

**Estimated Duration**: 1-2 days
**Complexity**: Medium
**Risk Level**: Medium

### Quick Summary

Extract business logic from route handlers in packages/api into dedicated service modules (SkillService, ProjectService, ClientService) following a factory function pattern. Route handlers will become thin orchestrators that validate input, call services via Hono context injection, and return responses. Services will be injected using c.set()/c.get() with typed Env Variables pattern.

### Prerequisites

- [ ] Ensure all current tests pass: `pnpm test`
- [ ] Verify TypeScript compilation: `pnpm run typecheck`
- [ ] Review existing route handlers to understand current business logic flow
- [ ] Confirm database connection pattern and GitHub client initialization

### Step 1: Analyze Codebase Structure

**What**: Read all critical files to understand current architecture and business logic patterns
**Why**: Ensure accurate extraction of business logic without missing dependencies or breaking existing behavior
**Confidence**: High

**Files to Read:**
- `packages/api/src/routes/skills.ts` - Understand GitHub path derivation, skill creation, rating calculation, fork orchestration, download logic
- `packages/api/src/routes/projects.ts` - Understand project skills merging with deduplication
- `packages/api/src/routes/clients.ts` - Understand CRUD patterns
- `packages/api/src/index.ts` - Understand current middleware and DI patterns
- `packages/api/src/db/schema.ts` - Understand database table structure
- `packages/api/src/db/index.ts` - Understand Database type and factory pattern
- `packages/api/src/lib/github.ts` - Understand GitHubClient interface
- `packages/shared/src/types.ts` - Understand data types and contracts

**Success Criteria:**
- [ ] All business logic patterns documented for extraction
- [ ] Dependencies and error handling patterns identified
- [ ] Current Env type pattern understood across route files

---

### Step 2: Create Consolidated AppEnv Type

**What**: Define a single shared AppEnv type with Bindings and Variables for dependency injection
**Why**: Eliminate Env type duplication across route files and establish typed service injection pattern
**Confidence**: High

**Files to Create:**
- `packages/api/src/types/env.ts` - AppEnv type with Bindings (DATABASE_URL, GITHUB_TOKEN, NODE_ENV) and Variables (db, github, skillService, projectService, clientService)

**Changes:**
- Define AppEnv interface with Bindings object for environment variables
- Define Variables object with db (Database), github (GitHubClient), and service types
- Export AppEnv type for use across all route files and middleware

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] AppEnv type includes all required Bindings
- [ ] Variables type includes db, github, and service placeholders
- [ ] TypeScript compilation passes

---

### Step 3: Create ClientService Module

**What**: Extract client business logic into ClientService with factory function pattern
**Why**: Start with simplest service to establish the pattern for ProjectService and SkillService
**Confidence**: High

**Files to Create:**
- `packages/api/src/services/client.service.ts` - createClientService factory returning createClient and getClients methods

**Changes:**
- Implement createClientService factory accepting Database parameter
- Extract createClient logic from clients route handler
- Extract getClients logic from clients route handler
- Use HTTPException for error handling
- Return plain data objects (not Hono responses)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] createClientService factory function exports ClientService type
- [ ] createClient method handles database insertion
- [ ] getClients method handles database queries
- [ ] HTTPException used for known errors
- [ ] TypeScript compilation passes with proper Database typing

---

### Step 4: Create ProjectService Module

**What**: Extract project business logic including merge/deduplication into ProjectService
**Why**: Handle moderate complexity service with skills merging logic before tackling SkillService
**Confidence**: High

**Files to Create:**
- `packages/api/src/services/project.service.ts` - createProjectService factory returning createProject, getProjects, getProjectById, getProjectSkills methods

**Changes:**
- Implement createProjectService factory accepting Database parameter
- Extract createProject logic from projects route handler
- Extract getProjects logic from projects route handler
- Extract getProjectById logic from projects route handler
- Extract getProjectSkills merge/deduplication logic (lines 73-111 from projects.ts)
- Implement skills merging with deduplication by skill ID
- Use HTTPException for 404 errors

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] createProjectService factory function exports ProjectService type
- [ ] All four methods properly typed and implemented
- [ ] Skills merge/dedup logic preserved exactly
- [ ] HTTPException thrown for missing projects

---

### Step 5: Create SkillService Module

**What**: Extract complex skill business logic including GitHub integration into SkillService
**Why**: Handle most complex service with GitHub path derivation, fork orchestration, rating calculation, and download logic
**Confidence**: High

**Files to Create:**
- `packages/api/src/services/skill.service.ts` - createSkillService factory returning createSkill, forkSkill, rateSkill, downloadSkill, getSkills, getSkillById, deriveGithubPath methods

**Changes:**
- Implement createSkillService factory accepting Database and GitHubClient parameters
- Extract deriveGithubPath logic (lines 72-85 from skills.ts)
- Extract createSkill logic with conditional project_skills linkage (lines 90-109)
- Extract getSkills query logic with filtering
- Extract getSkillById logic with 404 handling
- Extract rateSkill calculation logic (lines 160-172)
- Extract forkSkill orchestration (lines 179-231) including GitHub operations and database updates
- Extract downloadSkill with file listing (lines 115-142)
- Use HTTPException for 404 and validation errors

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] createSkillService factory function exports SkillService type
- [ ] All seven methods properly typed and implemented
- [ ] GitHub operations use injected GitHubClient
- [ ] Fork orchestration preserves exact behavior
- [ ] Rating calculation logic matches existing implementation
- [ ] Download file listing matches existing implementation

---

### Step 6: Create Services Barrel Export

**What**: Create index.ts barrel export for all service modules and types
**Why**: Provide clean import path for services across the application
**Confidence**: High

**Files to Create:**
- `packages/api/src/services/index.ts` - Export all service factories and types

**Changes:**
- Export createClientService and ClientService type
- Export createProjectService and ProjectService type
- Export createSkillService and SkillService type

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All service factories exported
- [ ] All service types exported

---

### Step 7: Update AppEnv with Service Types

**What**: Update AppEnv Variables to include proper service types from service modules
**Why**: Enable type-safe service access via c.get() in route handlers
**Confidence**: High

**Files to Modify:**
- `packages/api/src/types/env.ts` - Import and add ClientService, ProjectService, SkillService to Variables

**Changes:**
- Import ClientService type from services
- Import ProjectService type from services
- Import SkillService type from services
- Update Variables to include skillService, projectService, clientService with proper types

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Variables type includes all three services
- [ ] Service types properly imported

---

### Step 8: Inject Services in Middleware

**What**: Update index.ts middleware to instantiate and inject services via c.set() using AppEnv type
**Why**: Make services available to all route handlers through Hono context
**Confidence**: High

**Files to Modify:**
- `packages/api/src/index.ts` - Update middleware (lines 48-59) to create and inject services, replace inline Env type with AppEnv import

**Changes:**
- Import AppEnv from types/env
- Import service factories from services
- Replace inline Env type with AppEnv
- After db and github initialization, call createClientService(db)
- Call createProjectService(db)
- Call createSkillService(db, github)
- Use c.set('clientService', clientService)
- Use c.set('projectService', projectService)
- Use c.set('skillService', skillService)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] AppEnv type imported and used instead of inline Env
- [ ] All three services instantiated in middleware
- [ ] Services injected via c.set() with correct keys
- [ ] Middleware properly awaits next()

---

### Step 9: Refactor Clients Route Handlers

**What**: Convert clients route handlers to thin orchestrators using injected ClientService
**Why**: Establish refactoring pattern for remaining routes, validate service layer works correctly
**Confidence**: High

**Files to Modify:**
- `packages/api/src/routes/clients.ts` - Replace inline Env with AppEnv import, refactor handlers to use c.get('clientService')

**Changes:**
- Import AppEnv from types/env
- Replace inline Env type with AppEnv in Hono constructor
- In POST handler: get service via c.get('clientService'), call service.createClient(), return c.json({ data })
- In GET handler: get service via c.get('clientService'), call service.getClients(), return c.json({ data })
- Remove all business logic from handlers
- Keep zValidator middleware unchanged

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Route handlers reduced to validate-call-return pattern
- [ ] All business logic removed from handlers
- [ ] Service accessed via c.get() with proper typing
- [ ] Response format unchanged (data envelope preserved)

---

### Step 10: Refactor Projects Route Handlers

**What**: Convert projects route handlers to thin orchestrators using injected ProjectService
**Why**: Move project-specific business logic including merge/dedup to service layer
**Confidence**: High

**Files to Modify:**
- `packages/api/src/routes/projects.ts` - Replace inline Env with AppEnv import, refactor handlers to use c.get('projectService')

**Changes:**
- Import AppEnv from types/env
- Replace inline Env type with AppEnv in Hono constructor
- In POST handler: get service via c.get('projectService'), call service.createProject(), return c.json({ data })
- In GET /projects handler: get service, call service.getProjects(), return c.json({ data })
- In GET /projects/:id handler: get service, call service.getProjectById(), return c.json({ data })
- In GET /projects/:id/skills handler: get service, call service.getProjectSkills(), return c.json({ data })
- Remove all business logic including merge/dedup from handlers

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All route handlers reduced to validate-call-return pattern
- [ ] Merge/dedup logic moved to service
- [ ] Service accessed via c.get() with proper typing
- [ ] Response format unchanged

---

### Step 11: Refactor Skills Route Handlers

**What**: Convert skills route handlers to thin orchestrators using injected SkillService
**Why**: Complete service layer extraction by moving most complex business logic
**Confidence**: High

**Files to Modify:**
- `packages/api/src/routes/skills.ts` - Replace inline Env with AppEnv import, refactor all 6 handlers to use c.get('skillService')

**Changes:**
- Import AppEnv from types/env
- Replace inline Env type with AppEnv in Hono constructor
- In POST /skills handler: get service via c.get('skillService'), call service.createSkill(), return c.json({ data })
- In GET /skills handler: get service, call service.getSkills(), return c.json({ data })
- In GET /skills/:id handler: get service, call service.getSkillById(), return c.json({ data })
- In POST /skills/:id/rate handler: get service, call service.rateSkill(), return c.json({ data })
- In POST /skills/:id/fork handler: get service, call service.forkSkill(), return c.json({ data })
- In GET /skills/:id/download handler: get service, call service.downloadSkill(), return c.json({ data })
- Remove all business logic including GitHub operations from handlers

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All 6 route handlers reduced to validate-call-return pattern
- [ ] GitHub integration moved to service
- [ ] Fork orchestration preserved in service
- [ ] Rating calculation preserved in service
- [ ] Download file listing preserved in service
- [ ] Response format unchanged

---

### Step 12: Verify Integration and Error Handling

**What**: Test complete service layer integration and verify error handling behavior
**Why**: Ensure refactoring preserves all existing behavior and error responses
**Confidence**: High

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
pnpm test
```

**Success Criteria:**
- [ ] All TypeScript compilation passes
- [ ] All linting passes
- [ ] All existing tests pass without modification
- [ ] HTTPException errors propagate correctly from services to handlers
- [ ] Response format unchanged across all endpoints
- [ ] No regressions in functionality

---

### Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] All existing tests pass without modification
- [ ] Route handlers are thin orchestrators (validate-call-return pattern only)
- [ ] Services use factory function pattern consistently
- [ ] Services throw HTTPException for known errors
- [ ] Response envelope format ({ data: T }) preserved across all endpoints
- [ ] No business logic remains in route handlers
- [ ] AppEnv type used consistently across all route files
- [ ] Services properly typed in Hono context Variables

### Notes

**Assumptions Requiring Confirmation:**
- Current test suite covers existing functionality adequately (Medium confidence)
- Database connection pooling via Map pattern will work with service layer (High confidence)
- GitHub client can be safely shared across service instances (High confidence)

**Risk Mitigation:**
- Start with ClientService to validate pattern before tackling complex logic
- Preserve exact business logic behavior during extraction (pure refactor)
- Each step includes independent validation to catch issues early
- Services return plain data, keeping response formatting in handlers initially

**Important Constraints:**
- Do NOT modify validation schemas or request/response contracts
- Do NOT modify database schema or queries beyond extraction
- Do NOT introduce new features or change existing behavior
- Services should be stateless and side-effect explicit
- GitHub operations must remain transactional where currently implemented

**Architectural Decisions:**
- Factory functions over classes for simplicity and testing (High confidence)
- Service injection via Hono Variables for type safety (High confidence)
- HTTPException for known errors maintains existing error handling pattern (High confidence)
- Single AppEnv type eliminates duplication and improves maintainability (High confidence)
