# Step 3: Implementation Planning

**Status**: Completed
**Timestamp**: 2026-02-12
**Duration**: ~122s

## Input Summary

- Refined feature request from Step 1
- 16 discovered files from Step 2 (4 Critical, 3 High, 4 Medium, 5 Low)

## Plan Summary

- **Steps**: 6 implementation steps
- **Estimated Duration**: 2-3 hours
- **Complexity**: Medium
- **Risk Level**: Medium

## Steps Overview

| Step | Description | Files | Action |
|------|-------------|-------|--------|
| 1 | Create resolveProjectRoot utility | project-root.ts | Create |
| 2 | Extend ProviderAdapter interface | index.ts | Modify |
| 3 | Refactor Claude adapter | claude.ts | Modify |
| 4 | Refactor Copilot adapter | copilot.ts | Modify |
| 5 | Verify integration | install.ts, conflicts.ts, download.ts | Verify |
| 6 | Full build verification | - | Build |

## Key Design Decisions

1. **Circular dependency avoidance**: `resolveProjectRoot` accepts `configDirNames` as parameter + exports `KNOWN_CONFIG_DIRS` constant, rather than importing from provider registry
2. **Windows compatibility**: Uses `path.parse(dir).root` for filesystem root detection
3. **Synchronous filesystem operations**: Uses `fs.existsSync`/`fs.statSync` since this runs once at install time

## Flagged Issues

- **Breaking change**: Claude adapter path change from `.claude/{skillName}` to `.claude/skills/{skillName}` affects existing installations
- **No test infrastructure**: resolveProjectRoot is high-priority candidate for future unit tests

## Format Validation

- Markdown format: PASS
- Required sections present: PASS
- Validation commands included: PASS
- No code examples: PASS
- Template compliance: PASS

## Plan Output

Full implementation plan saved to: `docs/2026_02_12/plans/fix-project-scope-skill-installation-implementation-plan.md`
