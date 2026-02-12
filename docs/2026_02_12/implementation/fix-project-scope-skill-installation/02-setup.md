# Setup and Routing Table

**Date**: 2026-02-12

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Create resolveProjectRoot Utility | general-purpose | `packages/cli/src/lib/project-root.ts` (CREATE) |
| 2 | Extend ProviderAdapter Interface | general-purpose | `packages/cli/src/lib/providers/index.ts` (MODIFY) |
| 3 | Refactor Claude Adapter | general-purpose | `packages/cli/src/lib/providers/claude.ts` (MODIFY) |
| 4 | Refactor Copilot Adapter | general-purpose | `packages/cli/src/lib/providers/copilot.ts` (MODIFY) |
| 5 | Verify Integration | general-purpose | `packages/cli/src/commands/install.ts`, `packages/cli/src/lib/conflicts.ts`, `packages/cli/src/lib/download.ts` (VERIFY) |
| 6 | Run Full Build Verification | general-purpose | None (BUILD ONLY) |

## Dependencies
- Steps 3 and 4 depend on Steps 1 and 2
- Step 5 depends on Steps 3 and 4
- Step 6 depends on Step 5
