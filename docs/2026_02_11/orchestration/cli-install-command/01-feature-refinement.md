# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp Start**: 2026-02-11T00:00:30Z
**Timestamp End**: 2026-02-11T00:00:45Z
**Duration**: ~15s

## Original Request

Build the CLI install command for `@emergent/skills` per the design document at `docs/2026_02_11/plans/cli-design-document.md`.

## Clarification Context

None (Step 0a skipped — request scored 4/5 on clarity).

## Agent Prompt

Refine this feature request into a SINGLE PARAGRAPH (200-500 words) with project context from the pnpm monorepo structure (packages/cli, packages/api, packages/web, packages/shared), existing Hono RPC API client, shared types (Skill, SkillFile, SkillDownloadResponse, InstallTarget), and CLI scaffolding (commander, chalk, ora, tsup).

## Refined Feature Request

Build a production-ready CLI install command for the @emergent/skills package that enables developers to download and install marketplace skills locally using `npx @emergent/skills install <skill-name-or-id>`, where the command accepts either a skill ID or name as the argument and orchestrates the entire installation flow through a series of coordinated steps. The implementation should start by resolving the skill through the existing Hono RPC API client's fetchSkillDownload endpoint, falling back to fetchSkillByName when a numeric ID fails to resolve, then use @clack/prompts to present interactive prompts asking the user to select an installation scope (global or project) and target provider (Claude Code or GitHub Copilot), with sensible defaults and clear descriptions for each option. Once the user makes their selections, the system should download all skill files from GitHub using the downloadUrl fields provided in the SkillDownloadResponse, implementing proper error handling for network failures and invalid URLs, then route the downloaded content through provider-specific adapters that determine the correct filesystem locations based on the selected scope and provider combination. The Claude Code adapter should write to ~/.claude/ for global installs and <cwd>/.claude/ for project-scoped installs, while the Copilot adapter should target ~/.copilot/skills/ globally and <cwd>/.copilot/skills/ at the project level, with both adapters implementing a common interface that includes methods for resolving target directories, checking file existence, and writing files to disk. The file writing logic must detect conflicts when files already exist at the target location, prompting users with options to overwrite, skip, or cancel the entire operation, and should create any missing parent directories automatically using recursive mkdir operations. After all files are written successfully, display a formatted summary using chalk for colored output and ora for spinners during long-running operations, showing the skill name, number of files installed, target directory, and any files that were skipped due to conflicts. The CLI entry point at packages/cli/src/index.ts should be refactored from its current re-export pattern into a proper Commander program that registers the install command with appropriate option flags, help text, and error handling, ensuring the built dist/index.js executable works correctly when invoked through npx with the emergent-skills binary name defined in package.json.

## Validation Results

- **Format Check**: Single paragraph, no headers/bullets/sections — PASS
- **Length Check**: ~350 words (original ~150 words, ratio ~2.3x) — PASS
- **Scope Check**: Core intent preserved, no feature creep — PASS
- **Quality Check**: Essential technical context added (adapter paths, API methods, conflict flow) — PASS
