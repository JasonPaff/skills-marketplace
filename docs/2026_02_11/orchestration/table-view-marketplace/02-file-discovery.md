# Step 2: AI-Powered File Discovery

**Status**: Complete
**Timestamp**: 2026-02-11
**Duration**: ~149s

## Input

Refined feature request from Step 1 (table view marketplace replacement).

## Discovery Summary

- **Directories explored**: 8
- **Candidate files examined**: 45+
- **Critical priority files**: 6 (must modify)
- **High priority files**: 5 (new files to create + files to delete)
- **Medium priority files**: 12 (reference/integration)
- **Low priority files**: 9 (contextual awareness)

## Discovered Files by Priority

### Critical (Must Modify)

| File | Action | Reason |
|------|--------|--------|
| `packages/web/src/app/page.tsx` | Modify | Homepage — replace SkillsList with SkillsTable |
| `packages/web/src/components/skills/skills-list.tsx` | Replace | Current card-grid orchestrator — replaced by SkillsTable |
| `packages/web/src/components/ui/data-table.tsx` | Extend | Add row expansion, global filter, getExpandedRowModel |
| `packages/web/src/lib/search-params.ts` | Modify | Remove category param, add rating/downloads params |
| `packages/web/src/app/route-type.ts` | Modify | Update Zod schema for route search params |
| `packages/web/src/lib/query/use-skills.ts` | Modify | Remove category filtering, simplify hook |

### High (New Files / Deletions)

| File | Action | Reason |
|------|--------|--------|
| `packages/web/src/components/skills/skills-table.tsx` | **Create** | New SkillsTable component with columns, search, filters, expandable rows |
| `packages/web/src/components/ui/tooltip.tsx` | **Create** | New Tooltip using Base UI + CVA + cn() pattern |
| `packages/web/src/components/skills/skill-card.tsx` | **Delete** | No longer used (only consumer was skills-list.tsx) |
| `packages/web/src/components/skills/skill-filters.tsx` | **Delete** | No longer used (only consumer was skills-list.tsx) |
| `packages/web/src/lib/utils/category-colors.ts` | **Delete** | No longer used (note: skill-header.tsx still imports it) |

### Medium (Reference/Integration)

| File | Role |
|------|------|
| `packages/web/src/components/skills/star-rating.tsx` | Reuse in Rating column and expanded row |
| `packages/web/src/lib/api.ts` | downloadSkill() for Download button |
| `packages/web/src/lib/utils/format.ts` | formatDate() for expanded row |
| `packages/web/src/lib/utils/cn.ts` | cn() utility for styling |
| `packages/web/src/components/ui/input.tsx` | Reuse for omni-search |
| `packages/web/src/components/ui/select.tsx` | Reuse for filter dropdowns |
| `packages/web/src/components/ui/button.tsx` | Reuse for Download/Install buttons, pattern reference for Tooltip |
| `packages/web/src/components/layout/page-header.tsx` | Keep as-is on homepage |
| `packages/web/src/components/layout/error-alert.tsx` | Reuse for error states |
| `packages/web/src/lib/query/keys.ts` | May need filter type update |
| `packages/shared/src/types.ts` | Skill type definition |
| `packages/shared/src/schemas.ts` | skillSchema reference |

### Low (Contextual)

| File | Role |
|------|------|
| `packages/web/src/app/providers.tsx` | Provider hierarchy (QueryClient, NuqsAdapter) |
| `packages/web/src/app/layout.tsx` | Root layout |
| `packages/web/package.json` | Dependency confirmation |
| `packages/web/src/components/ui/badge.tsx` | Potential reuse in expanded rows |
| `packages/web/src/components/skills/skill-header.tsx` | Still uses category-colors.ts |
| `packages/web/src/components/skills/skill-metadata.tsx` | Reference for expanded row data |
| `packages/shared/src/constants.ts` | RATING_MIN, RATING_MAX for filter options |
| `packages/web/src/app/globals.css` | May need custom animations |
| `packages/web/src/components/ui/card.tsx` | Currently used by SkillCard |

## Architecture Insights

- **UI Pattern**: All UI components wrap Base UI primitives with CVA + cn()
- **No Existing Tooltip**: Must create net-new UI primitive
- **No Clipboard Utility**: Will use navigator.clipboard.writeText() directly
- **category-colors.ts Risk**: skill-header.tsx still imports getCategoryColor — needs resolution
- **DataTable Extension**: Needs ExpandedState, getExpandedRowModel, globalFilter, renderSubComponent
- **Search Param Sync**: search-params.ts and route-type.ts must be updated in lockstep
- **Query Key Impact**: keys.ts filter types should match new filter shape

## Validation

- All discovered file paths verified to exist ✓
- Minimum 5 files discovered (26+ total) ✓
- Files categorized by priority ✓
- AI reasoning provided for each file ✓
