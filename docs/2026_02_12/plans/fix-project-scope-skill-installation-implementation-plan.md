# Fix Project-Scope Skill Installation - Implementation Plan

**Generated**: 2026-02-12
**Original Request**: Fix project-scope skill installation in the CLI package by adding project root resolution and extending the ProviderAdapter interface.

## Analysis Summary

- Feature request refined with project context
- Discovered 16 files across 8 directories (4 Critical, 3 High, 4 Medium, 5 Low)
- Generated 6-step implementation plan

## File Discovery Results

### Critical (Must Modify/Create)
| File | Action |
|------|--------|
| `packages/cli/src/lib/providers/index.ts` | Modify - extend ProviderAdapter interface |
| `packages/cli/src/lib/providers/claude.ts` | Modify - remove duplicate interface, fix paths, use resolveProjectRoot |
| `packages/cli/src/lib/providers/copilot.ts` | Modify - remove duplicate interface, use resolveProjectRoot |
| `packages/cli/src/lib/project-root.ts` | Create - new resolveProjectRoot utility |

### High (Verify Only)
| File | Reason |
|------|--------|
| `packages/cli/src/commands/install.ts` | Calls adapter methods - verify integration |
| `packages/cli/src/lib/conflicts.ts` | Uses absolute paths - verify unchanged |
| `packages/cli/src/lib/download.ts` | Independent of paths - verify unchanged |

---

## Implementation Plan

### Overview

**Estimated Duration**: 2-3 hours
**Complexity**: Medium
**Risk Level**: Medium

### Quick Summary

The CLI currently produces incorrect installation paths when invoked from subdirectories or provider configuration directories (e.g., `.claude/`, `.copilot/`). Both adapter files contain duplicate `ProviderAdapter` interface definitions, and the Claude adapter is missing the required `skills/` path segment. This plan introduces a project root resolution utility, consolidates the interface, fixes path construction in both adapters, and ensures display paths are computed relative to the resolved project root.

### Prerequisites

- [ ] Confirm `pnpm run lint:fix && pnpm run typecheck` passes cleanly in `packages/cli/` before starting
- [ ] No new dependencies are required; only `node:path` and `node:fs` (both built-in) will be used in the new utility

### Step 1: Create the resolveProjectRoot Utility

**What**: Create a new file `packages/cli/src/lib/project-root.ts` containing a `resolveProjectRoot(cwd: string, configDirNames: readonly string[]): string` function that walks upward from the given directory to find the true project root.
**Why**: Both adapters currently use `process.cwd()` directly, which produces incorrect paths when the CLI is invoked from a subdirectory or from inside a provider config directory.
**Confidence**: High

**Files to Create:**
- `packages/cli/src/lib/project-root.ts`

**Changes:**
- Define and export `resolveProjectRoot` that accepts the current working directory and an array of known provider config directory names (e.g., `['.claude', '.copilot']`)
- Implement detection priority:
  1. Check if `cwd` itself is inside a known provider config directory by inspecting path segments. Walk upward through ancestors; if any ancestor's basename matches a config dir name, return that ancestor's parent.
  2. Walk upward from `cwd` looking for directories that contain a known config directory
  3. Walk upward from `cwd` looking for project markers: `.git` directory, `package.json` file
  4. Fall back to the original `cwd` if no root is found
- Use synchronous `fs.existsSync` and `fs.statSync` for simplicity
- Define and export a `KNOWN_CONFIG_DIRS` constant array (`['.claude', '.copilot']` as `readonly string[]`) to avoid circular dependency with the provider registry
- Export the function as a named export

**Validation Commands:**
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] `packages/cli/src/lib/project-root.ts` exists with the `resolveProjectRoot` function and `KNOWN_CONFIG_DIRS` constant
- [ ] The function signature accepts `cwd: string` and `configDirNames: readonly string[]` and returns `string`
- [ ] No circular dependency with the provider registry
- [ ] All validation commands pass

---

### Step 2: Extend the ProviderAdapter Interface

**What**: Add `configDirName` and `skillPathSegments` fields to the canonical `ProviderAdapter` interface in `packages/cli/src/lib/providers/index.ts`.
**Why**: These fields formalize the directory structure each provider uses, enabling the adapters to build paths from shared data rather than hardcoded strings.
**Confidence**: High

**Files to Modify:**
- `packages/cli/src/lib/providers/index.ts`

**Changes:**
- Add `configDirName: string` field to the `ProviderAdapter` interface
- Add `skillPathSegments: readonly string[]` field to the `ProviderAdapter` interface
- No changes to `getAllProviders()`, `getProvider()`, the registry, or re-exports

**Validation Commands:**
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] The `ProviderAdapter` interface has `configDirName: string` and `skillPathSegments: readonly string[]` fields
- [ ] Typecheck will report errors in `claude.ts` and `copilot.ts` (expected, resolved in Steps 3 and 4)

---

### Step 3: Refactor the Claude Adapter

**What**: Remove the duplicate `ProviderAdapter` interface from `claude.ts`, import the canonical interface from `./index.js`, add `configDirName` and `skillPathSegments` fields, fix the missing `skills/` path segment, and replace `process.cwd()` with `resolveProjectRoot()`.
**Why**: The Claude adapter has a duplicate interface, is missing the `skills/` path segment, and uses `process.cwd()` directly.
**Confidence**: High

**Files to Modify:**
- `packages/cli/src/lib/providers/claude.ts`

**Changes:**
- Remove the locally-defined `ProviderAdapter` interface
- Add `import type { ProviderAdapter } from './index.js'`
- Keep `import type { SkillScope } from '@emergent/shared'`
- Add `import { resolveProjectRoot, KNOWN_CONFIG_DIRS } from '../project-root.js'`
- Add `configDirName: '.claude'` property
- Add `skillPathSegments: ['skills'] as const` property
- Fix `getTargetDirectory` for project scope: replace `process.cwd()` with `resolveProjectRoot(process.cwd(), KNOWN_CONFIG_DIRS)` and add `'skills'` segment
- Fix `getTargetDirectory` for global scope: add the `'skills'` segment
- Fix `getDisplayPath` for both scopes: add `skills/` to paths

**Validation Commands:**
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] No duplicate `ProviderAdapter` interface in `claude.ts`
- [ ] The `skills/` segment is present in all path constructions
- [ ] `process.cwd()` is replaced with `resolveProjectRoot()` for project scope
- [ ] `configDirName` and `skillPathSegments` fields are present
- [ ] All validation commands pass

---

### Step 4: Refactor the Copilot Adapter

**What**: Remove the duplicate `ProviderAdapter` interface from `copilot.ts`, import the canonical interface from `./index.js`, add `configDirName` and `skillPathSegments` fields, and replace `process.cwd()` with `resolveProjectRoot()`.
**Why**: The Copilot adapter has a duplicate interface and uses `process.cwd()` directly.
**Confidence**: High

**Files to Modify:**
- `packages/cli/src/lib/providers/copilot.ts`

**Changes:**
- Remove the locally-defined `ProviderAdapter` interface
- Add `import type { ProviderAdapter } from './index.js'`
- Keep `import type { SkillScope } from '@emergent/shared'`
- Add `import { resolveProjectRoot, KNOWN_CONFIG_DIRS } from '../project-root.js'`
- Add `configDirName: '.copilot'` property
- Add `skillPathSegments: ['skills'] as const` property
- Fix `getTargetDirectory` for project scope: replace `process.cwd()` with `resolveProjectRoot(process.cwd(), KNOWN_CONFIG_DIRS)`
- Global scope paths remain unchanged (already correct)

**Validation Commands:**
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] No duplicate `ProviderAdapter` interface in `copilot.ts`
- [ ] `process.cwd()` is replaced with `resolveProjectRoot()` for project scope
- [ ] `configDirName` and `skillPathSegments` fields are present
- [ ] Global scope behavior is preserved
- [ ] All validation commands pass

---

### Step 5: Verify Integration with install.ts, conflicts.ts, and download.ts

**What**: Review integration files to confirm they require no changes.
**Why**: These files consume the `ProviderAdapter` API surface and must continue working correctly.
**Confidence**: High

**Files to Modify:** None expected. Verification only.

**Changes:**
- Confirm `install.ts` imports provider functions only from `../lib/providers/index.js`
- Confirm `conflicts.ts` does not import from provider modules
- Confirm `download.ts` does not import from provider modules
- If any file imports `ProviderAdapter` from `claude.ts` or `copilot.ts`, update to `./providers/index.js`

**Validation Commands:**
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] No file imports `ProviderAdapter` from `claude.ts` or `copilot.ts`
- [ ] Full typecheck passes with zero errors
- [ ] Full lint passes with zero errors

---

### Step 6: Run Full Build Verification

**What**: Run the complete build pipeline for the CLI package.
**Why**: Confirm tsup correctly resolves and bundles the new `project-root.ts` module.
**Confidence**: High

**Files to Modify:** None. Build verification only.

**Validation Commands:**
```bash
cd packages/cli && pnpm run build
```

**Success Criteria:**
- [ ] `pnpm run build` completes without errors or warnings
- [ ] `dist/index.js` exists and includes the project root resolution logic

---

### Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` in `packages/cli/`
- [ ] All files pass `pnpm run lint:fix` in `packages/cli/`
- [ ] `pnpm run build` succeeds in `packages/cli/`
- [ ] No duplicate `ProviderAdapter` interface definitions remain
- [ ] No file imports `ProviderAdapter` from `claude.ts` or `copilot.ts`
- [ ] No circular dependencies exist between `project-root.ts` and the provider modules
- [ ] Claude adapter paths include the `skills/` segment for both global and project scope
- [ ] Both adapters use `resolveProjectRoot()` instead of `process.cwd()` for project scope

### Notes

**Circular Dependency Prevention**: The `resolveProjectRoot` function accepts `configDirNames` as a parameter rather than importing them from the provider registry. The `KNOWN_CONFIG_DIRS` constant is defined in `project-root.ts` as a standalone constant. If a new provider is added, `KNOWN_CONFIG_DIRS` must be updated manually. This is an acceptable trade-off to avoid circular imports.

**Breaking Change for Claude Users**: The Claude adapter path change from `.claude/{skillName}` to `.claude/skills/{skillName}` is a breaking change for users who have already installed skills. Previously installed skills will remain in the old location. Consider whether a migration note or warning should accompany this fix.

**No Test Infrastructure**: The codebase does not currently have test infrastructure for the CLI package. The `resolveProjectRoot` function would be the highest-priority candidate for unit tests if testing is desired in the future.

**ESM Import Extensions**: All new imports must use `.js` extensions (e.g., `import { resolveProjectRoot } from '../project-root.js'`).

**Windows Compatibility**: The `resolveProjectRoot` function must handle Windows paths correctly. Use `path.parse(dir).root` to detect the filesystem root as the termination condition for upward directory traversal, rather than hardcoding `/`.
