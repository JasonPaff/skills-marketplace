# Step 2: AI-Powered File Discovery

**Status**: Completed
**Timestamp Start**: 2026-02-11T00:00:45Z
**Timestamp End**: 2026-02-11T00:03:10Z
**Duration**: ~145s

## Refined Request Used

Build a production-ready CLI install command for the @emergent/skills package that enables developers to download and install marketplace skills locally using `npx @emergent/skills install <skill-name-or-id>`.

## Discovery Statistics

- Explored 4 packages (cli, api, shared, web) plus root configuration
- Examined 25+ candidate files across the monorepo
- **Critical priority**: 7 files
- **High priority**: 4 files
- **Medium priority**: 4 files
- **Low priority**: 5 files
- **Total discovered**: 20 files

## Discovered Files by Priority

### Critical (Will Be Directly Modified or Created)

| # | File | Reason |
|---|------|--------|
| 1 | `packages/cli/src/index.ts` | Entry point — currently just re-exports, must be refactored to Commander program |
| 2 | `packages/cli/src/lib/api.ts` | Existing Hono RPC API client with fetchSkill, fetchSkillByName, fetchSkillDownload |
| 3 | `packages/cli/package.json` | Needs @clack/prompts added; defines bin entry as emergent-skills |
| 4 | `packages/shared/src/types.ts` | SkillDownloadResponse, SkillFile, Skill types; may need InstallOptions/InstallResult |
| 5 | `packages/shared/src/constants.ts` | INSTALL_TARGETS ['claude','copilot'], SKILL_SCOPES ['global','project'] |
| 6 | `packages/shared/src/schemas.ts` | Zod schemas including skillSchema, skillsQuerySchema |
| 7 | `packages/shared/src/index.ts` | Barrel export — auto-re-exports any new shared types |

### High (Defines Interfaces and API Contract)

| # | File | Reason |
|---|------|--------|
| 8 | `packages/api/src/routes/skills.ts` | API route definitions — download endpoint contract |
| 9 | `packages/api/src/services/skill.service.ts` | downloadSkill implementation — reference for response shape |
| 10 | `packages/api/src/lib/github.ts` | listFiles returns SkillFile[] with downloadUrl field |
| 11 | `packages/api/src/index.ts` | AppType export consumed by CLI's hc<AppType> RPC client |

### Medium (Configuration and Build)

| # | File | Reason |
|---|------|--------|
| 12 | `packages/cli/tsup.config.ts` | Build config with shebang banner, ESM output |
| 13 | `packages/cli/tsconfig.json` | TypeScript config extending base |
| 14 | `packages/api/src/routes/projects.ts` | Project routes — referenced by existing CLI API functions |
| 15 | `packages/web/src/lib/api.ts` | Reference implementation of Hono RPC client usage |

### Low (Context/Infrastructure)

| # | File | Reason |
|---|------|--------|
| 16 | `package.json` (root) | Workspace config with turbo scripts |
| 17 | `pnpm-workspace.yaml` | Confirms monorepo structure |
| 18 | `tsconfig.base.json` | Base TS config (ES2022, ESNext module, strict) |
| 19 | `turbo.json` | Build pipeline with ^build dependency chain |
| 20 | `packages/api/src/db/schema.ts` | Drizzle DB schema — skills.githubPath column |

## New Files to Create

| File | Purpose |
|------|---------|
| `packages/cli/src/commands/install.ts` | Install command definition and orchestration |
| `packages/cli/src/lib/providers/index.ts` | Provider adapter interface and registry |
| `packages/cli/src/lib/providers/claude.ts` | Claude Code adapter |
| `packages/cli/src/lib/providers/copilot.ts` | GitHub Copilot adapter |
| `packages/cli/src/lib/download.ts` | GitHub file download logic |
| `packages/cli/src/lib/conflicts.ts` | File conflict detection and resolution |

## File Validation

All discovered existing files verified to exist in the repository. New files to be created are in the `packages/cli/src/` directory which exists.
