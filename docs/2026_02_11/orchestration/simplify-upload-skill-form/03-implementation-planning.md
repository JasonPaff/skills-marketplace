# Step 3: Implementation Planning

## Metadata
- **Timestamp**: 2026-02-11
- **Status**: Complete
- **Duration**: ~251s
- **Agent**: implementation-planner
- **Tool Uses**: 45 file system operations

## Input
- Refined feature request from Step 1
- 44 discovered files from Step 2
- TanStack Form v1 research from Context7

## Output
- 21-step implementation plan in markdown format
- Estimated duration: 2-3 days
- Complexity: High
- Risk level: Medium

## Plan Structure
1. Update shared constants (remove SKILL_CATEGORIES/SkillCategory)
2. Update shared Zod schemas (strip fields from createSkillSchema, skillSchema, skillsQuerySchema)
3. Update database schema + generate Drizzle migration
4. Verify Drizzle-Zod validation schemas
5. Update skill queries (insertSkill, selectSkills)
6. Update project queries (selectGlobalSkills, selectProjectSkillsByProjectId)
7. Update skill service (createSkill, deriveGithubPath, forkSkill)
8. Update project service (getProjectSkills)
9. Update seed data
10. Add error variant to Input component (CVA)
11. Add error variant to Textarea component (CVA)
12. Enhance FormField with ARIA accessibility
13. Rewrite skill form with TanStack Form + Zod validation
14. Update skill-card.tsx
15. Update skill-header.tsx
16. Update skill-metadata.tsx
17. Update skill-filters.tsx
18. Update skills-list.tsx
19. Update data fetching layer (api.ts, use-skills.ts, search-params.ts, keys.ts, route-type.ts)
20. Delete category-colors.ts
21. Full monorepo build and validation

## Key Decisions
- Keep SKILL_SCOPES/SkillScope for CLI compatibility
- Use TanStack Form v1 native Zod support (no adapter needed)
- Use render-prop pattern for FormField accessibility
- All uploaded skills route to skills/global/{name}
- forkSkillSchema retains projectId (independent operation)

## Validation
- Format: Markdown with all required sections
- Template compliance: Overview, Quick Summary, Prerequisites, 21 Implementation Steps, Quality Gates, Notes
- Every step includes lint:fix + typecheck validation commands
- No code examples included (instructions only)
