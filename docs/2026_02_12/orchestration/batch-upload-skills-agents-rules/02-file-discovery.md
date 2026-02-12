# Step 2: File Discovery

**Status**: Completed
**Timestamp Start**: 2026-02-12T00:00:30Z
**Duration**: ~187s

## Discovered Files (39 total)

### Critical Priority (Must Modify) - 10 files

1. **`packages/shared/src/schemas.ts`** - Contains `parseSkillMd()`, Zod schemas. Add `parseAgentMd()`, `parseRuleMd()`, new schemas.
2. **`packages/shared/src/types.ts`** - Inferred TS types. Add `Agent`, `Rule`, `CreateBatchUpload` types.
3. **`packages/api/src/db/schema.ts`** - Drizzle tables. Add `agents` and `rules` tables.
4. **`packages/api/src/services/skill.service.ts`** - Service layer. Rework for batch payloads.
5. **`packages/web/src/components/forms/skill-form.tsx`** - Upload form. Major rework for folder detection and categorized preview.
6. **`packages/api/src/routes/skills.ts`** - Hono routes. Add batch upload endpoint.
7. **`packages/api/src/queries/skill.queries.ts`** - DB queries. Add agent/rule insert methods.
8. **`packages/web/src/lib/query/use-create-skill.ts`** - React Query mutation. Create batch upload hook.
9. **`packages/web/src/lib/api.ts`** - Hono RPC client. Add batch upload function.
10. **`packages/shared/src/index.ts`** - Barrel exports. Verify new exports.

### High Priority (Likely Need Modification) - 8 files

11. **`packages/api/src/index.ts`** - Main Hono app. Register new services in DI.
12. **`packages/api/src/types/env.ts`** - AppEnv type. Add new service types.
13. **`packages/api/src/db/validation.ts`** - Drizzle-Zod schemas. Add agent/rule schemas.
14. **`packages/api/src/queries/index.ts`** - Barrel export. Add new query exports.
15. **`packages/api/src/services/index.ts`** - Barrel export. Add new service exports.
16. **`packages/api/src/lib/github.ts`** - GitHub client. Already supports atomic multi-file commits.
17. **`packages/web/src/lib/utils/zip.ts`** - Zip extraction. May need .claude folder detection.
18. **`packages/api/src/db/seed.ts`** - Seed data. Add agent/rule seed data.

### Medium Priority (May Need Changes) - 9 files

19. **`packages/web/src/app/skills/new/page.tsx`** - Upload page. Update heading.
20. **`packages/web/src/lib/query/keys.ts`** - Query keys. Add agents/rules keys.
21. **`packages/web/src/components/forms/form-field.tsx`** - Reusable form field. Used as-is.
22. **`packages/web/src/components/ui/badge.tsx`** - Badge component. Used for type labels.
23. **`packages/web/src/components/ui/card.tsx`** - Card component. Used for preview cards.
24. **`packages/web/src/components/ui/checkbox.tsx`** - Checkbox. May be used for item selection.
25. **`packages/api/drizzle.config.ts`** - Drizzle config. No code changes, run migrations.
26. **`packages/api/src/db/index.ts`** - DB connection. Auto-picks up new tables.
27. **`packages/shared/src/constants.ts`** - Constants. May add item type constants.

### Low Priority (Reference Only) - 12 files

28-39. Various UI components, existing service/query patterns, CLI provider adapter.

## Architecture Insights

- **Service-Query-Route layering** pattern established
- **DI via Hono context** for all services
- **GitHub `commitFiles()`** already supports atomic multi-file commits
- **Base64 file encoding** pattern for uploads
- **gray-matter** used for frontmatter parsing
- **Hono RPC type export** provides end-to-end type safety

## Potential Challenges

- DB transaction atomicity (GitHub commit first, then DB inserts)
- Form state complexity (categorized files with per-category validation)
- Schema backward compatibility (consider new endpoint vs modifying existing)
