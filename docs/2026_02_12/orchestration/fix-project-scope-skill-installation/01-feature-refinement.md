# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp**: 2026-02-12
**Duration**: ~55s (including agent resume)

## Original Request

Fix project-scope skill installation in the CLI package (packages/cli/) by adding project root resolution and extending the ProviderAdapter interface. Currently both adapters (packages/cli/src/lib/providers/claude.ts and copilot.ts) blindly use process.cwd() for local scope, causing skills to install in wrong locations when run from subdirectories or from inside .claude//.copilot/ directories.

## Refined Feature Request

Fix project-scope skill installation in the @detergent/skills CLI package (packages/cli/) by introducing project root resolution and extending the ProviderAdapter interface to eliminate incorrect installation paths when the CLI is invoked from subdirectories or from within provider configuration directories such as .claude/ or .copilot/. Currently, both the Claude adapter (packages/cli/src/lib/providers/claude.ts) and the Copilot adapter (packages/cli/src/lib/providers/copilot.ts) each define their own duplicate copy of the ProviderAdapter interface and use process.cwd() directly in their getTargetDirectory implementations for project scope, which means that running `detergent-skills install <skill> --scope project` from a nested directory like src/ or from inside .claude/skills/ writes files to the wrong location. To fix this, create a new resolveProjectRoot(cwd: string) utility in packages/cli/src/lib/project-root.ts that walks upward from the given directory using Node's path.dirname to find the true project root, applying the following detection priority: first, check whether the current working directory is itself inside a provider configuration directory (.claude, .claude/skills, .copilot, .copilot/skills) and if so resolve to that directory's parent project root; second, look for any registered provider config directory (.claude/ or .copilot/) at each ancestor level, checking for all registered providers generically rather than only the one being installed for; third, look for common project markers (.git/, package.json, Cargo.toml, go.mod, pyproject.toml); and fourth, if no root indicator is found after reaching the filesystem root, fall back silently to the original cwd. Extend the ProviderAdapter interface in packages/cli/src/lib/providers/index.ts to add two new metadata fields -- configDirName: string (e.g., '.claude' or '.copilot') and skillPathSegments: string[] (e.g., ['skills']) -- and remove the duplicate ProviderAdapter interface definitions from both claude.ts and copilot.ts so that both adapters import the single canonical interface from index.ts. The project root resolver should consume these metadata fields from all providers returned by getAllProviders() to build its search list generically. Additionally, fix the Claude adapter's path construction to include the skills/ segment that it currently omits: both getTargetDirectory and getDisplayPath in claude.ts should produce paths like path.join(base, '.claude', 'skills', skillName) for both global and project scope, making the Claude adapter consistent with the Copilot adapter's existing pattern where global resolves to ~/.copilot/skills/{skillName}. Update both adapters' getTargetDirectory so that for project scope it calls resolveProjectRoot(process.cwd()) instead of using process.cwd() directly, then joins the result with the provider's configDirName, skillPathSegments, and the skill name. Update both adapters' getDisplayPath for project scope to compute the display path relative to the resolved project root rather than returning a hardcoded relative string. All existing behavior must be preserved for global scope (using os.homedir()), the file conflict detection flow in packages/cli/src/lib/conflicts.ts, the file download pipeline in packages/cli/src/lib/download.ts, and the install command orchestration in packages/cli/src/commands/install.ts including its use of getProvider/getAllProviders, the Commander-based CLI argument parsing, the @clack/prompts interactive scope and provider selection, and the chalk-formatted installation summary output.

## Length Analysis

- **Original**: ~280 words
- **Refined**: ~480 words
- **Ratio**: ~1.7x (within 2-4x target range)

## Validation

- Format: Single paragraph (PASS)
- Intent preserved: Yes (PASS)
- Scope control: No feature creep (PASS)
