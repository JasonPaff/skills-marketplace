# CLI Install Command Implementation Plan

**Generated**: 2026-02-11
**Original Request**: Build the CLI install command for `@emergent/skills` per the design document
**Refined Request**: Build a production-ready CLI install command for the @emergent/skills package that enables developers to download and install marketplace skills locally using `npx @emergent/skills install <skill-name-or-id>`, resolving skills through the Hono RPC API client, prompting for scope and providers via @clack/prompts, downloading files from GitHub, writing through provider adapters, handling conflicts, and displaying a formatted summary.

## Analysis Summary

- Feature request refined with project context (Step 1)
- Discovered 20 files across 4 packages (Step 2)
- Generated 9-step implementation plan (Step 3)

## File Discovery Results

### Critical (7 files — will be modified or created)
| File | Role |
|------|------|
| `packages/cli/src/index.ts` | Entry point — rewrite to Commander program |
| `packages/cli/src/lib/api.ts` | Existing Hono RPC API client |
| `packages/cli/package.json` | Add @clack/prompts dependency |
| `packages/shared/src/types.ts` | SkillDownloadResponse, SkillFile, Skill types |
| `packages/shared/src/constants.ts` | INSTALL_TARGETS, SKILL_SCOPES |
| `packages/shared/src/schemas.ts` | Zod schemas |
| `packages/shared/src/index.ts` | Barrel export |

### New Files to Create (6 files)
| File | Purpose |
|------|---------|
| `packages/cli/src/commands/install.ts` | Install command orchestration |
| `packages/cli/src/lib/providers/index.ts` | Provider adapter interface and registry |
| `packages/cli/src/lib/providers/claude.ts` | Claude Code adapter |
| `packages/cli/src/lib/providers/copilot.ts` | Copilot adapter |
| `packages/cli/src/lib/download.ts` | GitHub file downloader |
| `packages/cli/src/lib/conflicts.ts` | Conflict detection/resolution |

---

## Implementation Plan

### Overview

**Estimated Duration**: 6-8 hours
**Complexity**: Medium
**Risk Level**: Low

### Quick Summary

Build a production-ready `install` command for the `@emergent/skills` CLI that resolves a skill by ID or name through the existing Hono RPC API client, prompts the user to select scope (global/project) and provider targets (Claude Code/GitHub Copilot) using `@clack/prompts`, downloads skill files from GitHub via the `downloadUrl` fields in `SkillDownloadResponse`, writes them to provider-specific directories through adapter modules, handles file conflicts interactively, and displays a formatted installation summary.

### Prerequisites

- [ ] Install `@clack/prompts` as a dependency in `packages/cli`
- [ ] Verify `packages/shared` is built so its exported types (`InstallTarget`, `SkillScope`, `SkillDownloadResponse`, `SkillFile`, `INSTALL_TARGETS`, `SKILL_SCOPES`) are available
- [ ] Verify `packages/api` is built so its exported `AppType` is available to the Hono RPC client

---

### Step 1: Add @clack/prompts dependency

**What**: Add the `@clack/prompts` package to the CLI's dependencies.
**Why**: The install command requires interactive prompts for scope selection, provider selection, and conflict resolution.
**Confidence**: High

**Files**:
- `packages/cli/package.json` — Add `"@clack/prompts": "^0.10.0"` to `dependencies`

**Validation Commands**:
```bash
cd packages/cli && pnpm install
```

**Success Criteria**:
- [ ] `@clack/prompts` appears in `packages/cli/node_modules`
- [ ] `pnpm install` completes without errors

---

### Step 2: Create the provider adapter interface and registry

**What**: Define a `ProviderAdapter` interface and a registry mapping `InstallTarget` values to adapters.
**Why**: Multiple providers (Claude Code, Copilot) need different directory structures. A shared interface and registry provides extensibility.
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/lib/providers/index.ts`

**Changes**:
- Define `ProviderAdapter` interface with: `name` (display string), `target` (InstallTarget), `getTargetDirectory(scope, skillName)` (returns absolute path), `getDisplayPath(scope, skillName)` (returns user-friendly path with `~`)
- Create `PROVIDER_REGISTRY` map keyed by `InstallTarget`
- Export `getProvider(target)` and `getAllProviders()` functions
- Re-export concrete adapters from `./claude.js` and `./copilot.js`

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `ProviderAdapter` interface is exported and usable
- [ ] Registry functions compile and are type-safe against `InstallTarget`

---

### Step 3: Create the Claude Code provider adapter

**What**: Implement `ProviderAdapter` for Claude Code.
**Why**: Claude Code stores skills at `~/.claude/` (global) and `<cwd>/.claude/` (project).
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/lib/providers/claude.ts`

**Changes**:
- Implement `claudeAdapter` object satisfying `ProviderAdapter`
- `name`: "Claude Code", `target`: "claude"
- `getTargetDirectory`: global -> `os.homedir()/.claude/<skillName>`, project -> `cwd/.claude/<skillName>`
- `getDisplayPath`: same with `~` substitution

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `claudeAdapter` satisfies `ProviderAdapter` interface
- [ ] Paths resolve correctly for both scopes

---

### Step 4: Create the GitHub Copilot provider adapter

**What**: Implement `ProviderAdapter` for GitHub Copilot.
**Why**: Copilot stores skills at `~/.copilot/skills/` (global) and `<cwd>/.copilot/skills/` (project).
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/lib/providers/copilot.ts`

**Changes**:
- Implement `copilotAdapter` object satisfying `ProviderAdapter`
- `name`: "GitHub Copilot", `target`: "copilot"
- `getTargetDirectory`: global -> `os.homedir()/.copilot/skills/<skillName>`, project -> `cwd/.copilot/skills/<skillName>`
- `getDisplayPath`: same with `~` substitution

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `copilotAdapter` satisfies `ProviderAdapter` interface
- [ ] Paths resolve correctly for both scopes

---

### Step 5: Create the file downloader module

**What**: Build a module that downloads files from GitHub using `downloadUrl` fields.
**Why**: Isolates HTTP download logic with proper error handling for network failures.
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/lib/download.ts`

**Changes**:
- Define `DownloadedFile` interface (SkillFile fields + `content: Buffer`)
- Implement `downloadFile(file: SkillFile): Promise<DownloadedFile>` using global `fetch`
- Implement `downloadFiles(files: SkillFile[]): Promise<DownloadedFile[]>` with `Promise.all`
- Handle non-OK responses with descriptive errors (include file name and HTTP status)

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `downloadFile`, `downloadFiles`, `DownloadedFile` are exported
- [ ] Error handling covers non-OK HTTP responses

---

### Step 6: Create the conflict detection and resolution module

**What**: Build conflict checking and user prompts for existing files.
**Why**: Users need to choose overwrite/skip/cancel when files already exist at target paths.
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/lib/conflicts.ts`

**Changes**:
- Define `ConflictResolution` type: `"overwrite" | "skip" | "cancel"`
- Implement `checkFileConflict(filePath): Promise<boolean>` using `fs.access`
- Implement `promptConflictResolution(filePath): Promise<ConflictResolution>` using `@clack/prompts` select
- Implement `resolveConflicts(files): Promise<Map<string, ConflictResolution>>` iterating through files, prompting only for conflicts, short-circuiting on cancel

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] All functions and types are exported
- [ ] Cancellation handled through `isCancel`

---

### Step 7: Create the install command

**What**: Build the core install command orchestrating the entire flow.
**Why**: This is the main feature — `npx @emergent/skills install <skill-name-or-id>`.
**Confidence**: High

**Files**:
- **Create**: `packages/cli/src/commands/install.ts`

**Changes**:
- Define `installCommand` as `new Command('install')` with `<skill>` argument, `--scope`, `--provider` options
- Action handler flow:
  1. `intro()` with styled banner
  2. Resolve skill (UUID detection via regex, name fallback via fetchSkillByName)
  3. Scope prompt via `@clack/prompts` select (or use `--scope` flag)
  4. Provider prompt via `@clack/prompts` multiselect (or use `--provider` flag)
  5. Download files via `downloadFiles()`
  6. Per provider: get adapter, compute paths, resolve conflicts, create directories, write files
  7. Summary via `note()` with skill name, version, scope, per-provider stats
  8. `outro()` with success message
- Handle all errors gracefully with `log.error()` and `process.exit(1)`
- Handle all cancellations via `isCancel` with `cancel()` and `process.exit(0)`

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `installCommand` exported as `Command` instance
- [ ] UUID detection correctly differentiates UUIDs from names
- [ ] API errors caught and displayed gracefully
- [ ] Files written to correct provider-specific directories
- [ ] Summary displays accurate counts

---

### Step 8: Rewrite the CLI entry point

**What**: Replace current `index.ts` re-export with a Commander program.
**Why**: Current entry point has no CLI functionality — must become the program root.
**Confidence**: High

**Files**:
- **Modify**: `packages/cli/src/index.ts` — Complete rewrite

**Changes**:
- Remove `export * from './lib/api.js'`
- Import `Command` from `commander` and `installCommand` from `./commands/install.js`
- Create `program` with name `emergent-skills`, description, version `0.1.0`
- Register install command via `program.addCommand(installCommand)`
- Call `program.parse()`

**Validation Commands**:
```bash
cd packages/cli && pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria**:
- [ ] `index.ts` defines a Commander program
- [ ] `--help` shows the install subcommand
- [ ] `install --help` shows argument and options

---

### Step 9: Build and end-to-end smoke test

**What**: Build the CLI and verify the executable works.
**Why**: Validates tsup produces a working executable with correct shebang, Commander parsing, and module resolution.
**Confidence**: High

**Validation Commands**:
```bash
cd packages/cli && pnpm run build && node dist/index.js --help && node dist/index.js install --help
```

**Success Criteria**:
- [ ] `pnpm run build` succeeds
- [ ] `dist/index.js` starts with `#!/usr/bin/env node`
- [ ] `--help` lists `install` as a command
- [ ] `install --help` shows `<skill>` argument, `--scope` and `--provider` options
- [ ] No runtime import errors

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck` in `packages/cli`
- [ ] All files pass `pnpm run lint:fix` in `packages/cli`
- [ ] `pnpm run build` produces a working executable
- [ ] Shebang (`#!/usr/bin/env node`) present in built output
- [ ] `node dist/index.js install nonexistent-skill` exits gracefully with error message
- [ ] `@emergent/shared` types correctly imported and used throughout

## Notes

- **UUID Detection**: Use regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` to distinguish UUIDs from skill names
- **fetchSkillByName returns array**: Find exact name match from results; if no exact match, show closest matches as suggestions
- **File path stripping**: Strip `githubPath` prefix from `SkillFile.path` so only relative structure is preserved (e.g., `skills/global/my-skill/rules.md` -> `rules.md`)
- **Cross-platform paths**: Use `node:path` (`path.join`) for all path construction; `os.homedir()` works on Windows, macOS, Linux
- **ora is now unused**: @clack/prompts spinner replaces ora for visual consistency; ora can be removed in follow-up cleanup
- **chalk usage**: Minimal usage in summary `note()` content for coloring values
- **No backward compatibility needed**: Current `index.ts` only re-exports API client; CLI package is bin-only, not consumed as library
- **Error handling**: All API errors (from `throwIfNotOk`) caught at install command level, displayed via `log.error()`, exit with code 1
