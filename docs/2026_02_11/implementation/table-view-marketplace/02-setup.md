# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Create Tooltip UI Component | general-purpose | `packages/web/src/components/ui/tooltip.tsx` (new) |
| 2 | Add formatDownloads utility | general-purpose | `packages/web/src/lib/utils/format.ts` |
| 3 | Update search-params and route-type | general-purpose | `packages/web/src/lib/search-params.ts`, `packages/web/src/app/route-type.ts` |
| 4 | Simplify useSkills hook | general-purpose | `packages/web/src/lib/query/use-skills.ts`, `packages/web/src/lib/query/keys.ts` |
| 5 | Extend DataTable | general-purpose | `packages/web/src/components/ui/data-table.tsx` |
| 6 | Create SkillsTable component | general-purpose | `packages/web/src/components/skills/skills-table.tsx` (new) |
| 7 | Update homepage | general-purpose | `packages/web/src/app/page.tsx` |
| 8 | Delete unused files | general-purpose | Delete `skill-card.tsx`, `skill-filters.tsx`, `skills-list.tsx` |
| 9 | Full build verification | general-purpose | N/A (build command) |

## Dependencies
- Steps 1-5: Independent (can run in parallel)
- Step 6: Blocked by 1, 2, 3, 4, 5
- Step 7: Blocked by 6
- Step 8: Blocked by 7
- Step 9: Blocked by 8
