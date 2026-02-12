# Step 2: File Discovery

**Status**: Completed
**Timestamp**: 2026-02-12
**Duration**: ~133s

## Discovery Summary

- Explored 8 directories
- Examined 18 candidate files
- Found 4 Critical priority files (3 modify + 1 create)
- Found 3 High priority files (verify only)
- Found 4 Medium priority files (reference only)
- Found 5 Low priority files (context only)

## Critical Priority (Must Be Modified/Created)

| File | Action | Reason |
|------|--------|--------|
| `packages/cli/src/lib/providers/index.ts` | Modify | Add `configDirName` and `skillPathSegments` to ProviderAdapter interface |
| `packages/cli/src/lib/providers/claude.ts` | Modify | Remove duplicate interface, fix paths, use resolveProjectRoot |
| `packages/cli/src/lib/providers/copilot.ts` | Modify | Remove duplicate interface, use resolveProjectRoot |
| `packages/cli/src/lib/project-root.ts` | Create | New resolveProjectRoot utility |

## High Priority (Verify Only)

| File | Action | Reason |
|------|--------|--------|
| `packages/cli/src/commands/install.ts` | Verify | Calls adapter.getTargetDirectory/getDisplayPath |
| `packages/cli/src/lib/conflicts.ts` | Verify | Uses absolute paths from targetPath |
| `packages/cli/src/lib/download.ts` | Verify | Independent of installation paths |

## Medium Priority (Reference Only)

| File | Reason |
|------|--------|
| `packages/shared/src/constants.ts` | Defines SkillScope and InstallTarget types |
| `packages/shared/src/types.ts` | Defines Skill, SkillFile types |
| `packages/cli/package.json` | Check if new dependencies needed (likely none) |
| `packages/cli/tsconfig.json` | Confirms new file within include glob |

## Architecture Insights

### Circular Dependency Risk
The feature request says resolveProjectRoot should consume provider metadata from getAllProviders(). This creates a circular import: `project-root.ts` -> `providers/index.ts` -> `claude.ts`/`copilot.ts` -> `project-root.ts`.

**Solutions identified:**
1. Parameter injection: `resolveProjectRoot(cwd, configDirs)` - adapters pass config dirs at call time
2. Lazy import: resolveProjectRoot lazily imports getAllProviders at runtime
3. Separate config list: Define config dir names as constants separate from the registry

### Key Patterns
- ESM with `.js` import extensions
- Monorepo with pnpm workspaces + Turborepo
- tsup bundles into single dist/index.js
- No test infrastructure currently exists
- Provider adapter pattern with registry Map

### Existing Bugs Confirmed
1. Triple duplicate ProviderAdapter interface (index.ts, claude.ts, copilot.ts)
2. Claude adapter missing `skills/` path segment
3. Both adapters use raw `process.cwd()` for project scope

## File Validation

All discovered existing files verified to exist and be accessible. New file `project-root.ts` confirmed not yet created.
