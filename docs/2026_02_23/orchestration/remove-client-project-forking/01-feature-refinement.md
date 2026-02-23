# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp**: 2026-02-23
**Duration**: ~4s

## Original Request

Remove all client, project, and skill-forking concepts from the Skills Marketplace across packages/api, packages/shared, and packages/web. [Full detailed request with specific files and changes listed.]

## Clarification Context

None (Step 0a skipped - 5/5 clarity score)

## Refined Feature Request

Remove all client, project, and skill-forking concepts from the Skills Marketplace to simplify the MVP. Delete these files entirely: packages/api/src/routes/clients.ts, packages/api/src/routes/projects.ts, packages/api/src/queries/client.queries.ts, packages/api/src/queries/project.queries.ts, packages/api/src/services/client.service.ts, packages/api/src/services/project.service.ts, packages/web/src/lib/query/use-clients.ts, and packages/web/src/lib/query/use-projects.ts. In packages/api/src/db/schema.ts, drop the clients, projects, and projectSkills table definitions along with their relations, keeping only the skills, agents, and rules tables unchanged, and remove the parentSkillId field from the skills table since forking is eliminated. In packages/api/src/db/validation.ts, remove all client, project, and projectSkills insert and select schemas. Update packages/api/src/queries/skill.queries.ts by removing selectProjectById() and insertProjectSkill() functions. In packages/api/src/services/skill.service.ts, delete the entire forkSkill() method and simplify deriveGithubPath() to change skills paths from skills/global/{name} to skills/{name}; apply the same path pattern change in packages/api/src/services/upload.service.ts for agents and rules, changing agents/global/{name} to agents/{name} and rules/global/{name} to rules/{name}. Remove the POST /api/skills/:id/fork endpoint from packages/api/src/routes/skills.ts. In packages/api/src/types/env.ts, remove clientService and projectService from AppEnv.Variables. In packages/api/src/index.ts, remove all client and project query factory instantiations, service instantiations, context setters via c.set(), route imports, and app.route() compositions for clients and projects. In packages/shared/src/schemas.ts, delete createClientSchema, clientSchema, createProjectSchema, projectSchema, projectWithClientSchema, forkSkillSchema, and projectsQuerySchema. In packages/shared/src/types.ts, remove Client, CreateClient, Project, CreateProject, ProjectWithClient, ProjectSkill, and ForkSkill type exports. In packages/shared/src/constants.ts, remove SKILL_SCOPES or simplify it since the global/project distinction no longer applies. In packages/web/src/lib/api.ts, remove createClient, fetchClients, createProject, fetchProjects, fetchProjectSkills, and forkSkill functions along with their type imports. In packages/web/src/lib/query/keys.ts, remove clients and projects query key definitions. After completing all removals, verify that no orphaned imports or dead references remain across the three packages (api, web, and shared) to ensure a clean, consistent codebase.

## Length Analysis

- Original request: ~450 words
- Refined request: ~350 words (faithful consolidation, no bloat)
- Scope preserved: Yes - no feature creep

## Validation Results

- Format: Single paragraph - PASS
- Intent preservation: PASS
- Scope control: PASS
