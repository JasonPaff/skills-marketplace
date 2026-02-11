# Step 2: File Discovery

## Metadata
- **Timestamp**: 2026-02-11
- **Status**: Complete
- **Duration**: ~189s
- **Agent**: file-discovery-agent
- **Tool Uses**: 70 file system operations

## Discovery Statistics
- **Total files examined**: 48
- **Highly relevant**: 18
- **Supporting/indirect**: 14
- **Packages scanned**: 4 (api, shared, web, cli)

## Discovered Files by Priority

### Critical Priority (Schema/Validation - Must Change First)
1. `packages/api/src/db/schema.ts` - Skills table with skillCategoryEnum, category, isGlobal, uploadedBy columns
2. `packages/shared/src/schemas.ts` - createSkillSchema, skillSchema, skillsQuerySchema with removed fields
3. `packages/shared/src/constants.ts` - SKILL_CATEGORIES, SkillCategory, SKILL_SCOPES, SkillScope exports
4. `packages/shared/src/types.ts` - Type definitions inferred from schemas (auto-cascades)

### High Priority (API Layer)
5. `packages/api/src/services/skill.service.ts` - createSkill(), deriveGithubPath(), forkSkill()
6. `packages/api/src/queries/skill.queries.ts` - insertSkill type, selectSkills filters
7. `packages/api/src/routes/skills.ts` - Route validation schemas
8. `packages/api/src/db/validation.ts` - Drizzle-Zod validation schemas

### High Priority (Frontend Form)
9. `packages/web/src/components/forms/skill-form.tsx` - Main form (327 lines), TanStack Form integration
10. `packages/web/src/components/forms/form-field.tsx` - Field wrapper, needs accessibility
11. `packages/web/src/components/ui/input.tsx` - Needs error boolean prop
12. `packages/web/src/components/ui/textarea.tsx` - Needs error boolean prop

### High Priority (Display Components)
13. `packages/web/src/components/skills/skill-card.tsx` - Category badge, Global/Project badge
14. `packages/web/src/components/skills/skill-header.tsx` - Category badge, scope badge
15. `packages/web/src/components/skills/skill-metadata.tsx` - "Uploaded by" display
16. `packages/web/src/components/skills/skill-filters.tsx` - Category Select dropdown

### Medium Priority (Data Fetching)
17. `packages/web/src/lib/api.ts` - fetchSkills() category/isGlobal/projectId params
18. `packages/web/src/lib/query/use-skills.ts` - SkillCategory import, category filter
19. `packages/web/src/lib/search-params.ts` - category search param parser
20. `packages/web/src/lib/query/keys.ts` - Query key factory with category filter type
21. `packages/web/src/app/route-type.ts` - Home page route type with category search param

### Medium Priority (Supporting)
22. `packages/web/src/lib/utils/category-colors.ts` - ENTIRE FILE can be deleted
23. `packages/api/src/db/seed.ts` - Seed data with category, isGlobal, uploadedBy
24. `packages/api/src/queries/project.queries.ts` - selectGlobalSkills() filters by isGlobal
25. `packages/api/src/services/project.service.ts` - getProjectSkills() merges global/project skills
26. `packages/web/src/components/skills/skills-list.tsx` - Destructures category from search params

### Medium Priority (Database Migration)
27. `packages/api/drizzle.config.ts` - Drizzle config (no changes, used for migration)
28. `packages/api/drizzle/0000_secret_puppet_master.sql` - Initial migration with columns to drop

### Low Priority (CLI - Uses SkillScope)
29. `packages/cli/src/commands/install.ts` - Uses SkillScope, SKILL_SCOPES
30. `packages/cli/src/lib/providers/index.ts` - Interface uses SkillScope type
31. `packages/cli/src/lib/providers/claude.ts` - Uses SkillScope for path resolution
32. `packages/cli/src/lib/providers/copilot.ts` - Uses SkillScope for path resolution

### Low Priority (Indirectly Affected)
33. `packages/shared/src/index.ts` - Barrel exports
34. `packages/web/src/components/skills/skill-detail-content.tsx` - Renders SkillHeader/SkillMetadata
35. `packages/web/src/app/skills/new/page.tsx` - Renders SkillForm
36. `packages/web/src/lib/query/use-create-skill.ts` - Uses CreateSkill type (auto-cascades)

## Architecture Insights
1. **Schema-first**: Shared Zod schemas are source of truth; type changes cascade via z.infer
2. **Drizzle pgEnum coupling**: skillCategoryEnum requires both code AND migration changes
3. **TanStack Form already in use**: v1.28.0 with useForm/form.Field — needs Zod validators added
4. **CLI depends on SkillScope**: Must keep SKILL_SCOPES/SkillScope or inline in CLI
5. **Category permeates deeply**: Affects schema, queries, search params, URL, display, filters
6. **GitHub path depends on isGlobal**: deriveGithubPath() must be simplified
