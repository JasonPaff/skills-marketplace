# Step 2: File Discovery

**Status:** Completed
**Start:** 2026-02-11T00:02:00Z
**Duration:** ~96s
**Agent:** file-discovery-agent (sonnet)

---

## Input

Refined feature request from Step 1 (service layer extraction for packages/api).

## Discovery Results

### Critical Priority (Core Implementation - Will be Created/Modified)

| File | Action | Reason |
|------|--------|--------|
| `packages/api/src/routes/skills.ts` | Modify | Contains complex business logic: GitHub path derivation, skill creation with conditional linkage, rating calculation, fork orchestration, download count |
| `packages/api/src/routes/projects.ts` | Modify | Contains project skills merging with deduplication |
| `packages/api/src/routes/clients.ts` | Modify | Simple CRUD to become even simpler |
| `packages/api/src/index.ts` | Modify | Service injection point in middleware |
| `packages/api/src/services/skill.service.ts` | Create | SkillService: createSkill, forkSkill, rateSkill, downloadSkill, getSkills, getSkillById |
| `packages/api/src/services/project.service.ts` | Create | ProjectService: createProject, getProjects, getProjectById, getProjectSkills |
| `packages/api/src/services/client.service.ts` | Create | ClientService: createClient, getClients |
| `packages/api/src/services/index.ts` | Create | Barrel file for service exports |

### High Priority (Dependencies and Types)

| File | Role |
|------|------|
| `packages/api/src/db/schema.ts` | Drizzle table definitions used by services |
| `packages/api/src/db/index.ts` | Database factory, provides Database type |
| `packages/api/src/db/validation.ts` | Insert/select schemas |
| `packages/api/src/lib/github.ts` | GitHubClient used by SkillService |
| `packages/shared/src/schemas.ts` | Zod schemas for input validation |
| `packages/shared/src/types.ts` | TypeScript types for service signatures |
| `packages/shared/src/constants.ts` | Constants referenced by services |

### Medium Priority (Configuration)

| File | Role |
|------|------|
| `packages/api/tsconfig.json` | TypeScript configuration |
| `packages/api/package.json` | Dependencies |

## Business Logic Identified for Extraction

1. **GitHub path derivation** (skills.ts:72-85) -> SkillService.deriveGithubPath()
2. **Skill creation + project_skills linkage** (skills.ts:90-109) -> SkillService.createSkill()
3. **Rating calculation** (skills.ts:160-172) -> SkillService.rateSkill()
4. **Fork orchestration** (skills.ts:179-231) -> SkillService.forkSkill()
5. **Project skills merge/dedup** (projects.ts:73-111) -> ProjectService.getProjectSkills()

## Statistics

- Total files discovered: 17 (9 existing + 4 to create + 4 config/reference)
- Directories affected: 4 (routes/, services/ (new), db/, lib/)
- Recommended implementation order: ClientService -> ProjectService -> SkillService -> index.ts -> route handlers
