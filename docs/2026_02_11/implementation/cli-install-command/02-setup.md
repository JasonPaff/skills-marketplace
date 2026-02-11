# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Add @clack/prompts dependency | general-purpose | `packages/cli/package.json` |
| 2 | Create provider adapter interface and registry | general-purpose | `packages/cli/src/lib/providers/index.ts` (create) |
| 3 | Create Claude Code provider adapter | general-purpose | `packages/cli/src/lib/providers/claude.ts` (create) |
| 4 | Create GitHub Copilot provider adapter | general-purpose | `packages/cli/src/lib/providers/copilot.ts` (create) |
| 5 | Create file downloader module | general-purpose | `packages/cli/src/lib/download.ts` (create) |
| 6 | Create conflict detection/resolution module | general-purpose | `packages/cli/src/lib/conflicts.ts` (create) |
| 7 | Create the install command | general-purpose | `packages/cli/src/commands/install.ts` (create) |
| 8 | Rewrite CLI entry point | general-purpose | `packages/cli/src/index.ts` (modify) |
| 9 | Build and end-to-end smoke test | general-purpose | Build verification |
| QG | Quality gates | general-purpose | Lint + typecheck + build |

## Status: PHASE 2 COMPLETE
