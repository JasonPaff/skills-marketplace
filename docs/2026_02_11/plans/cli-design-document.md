# CLI Design Document — `@emergent/skills`

## Purpose

The CLI is a single-purpose install tool that lets developers grab skills from the marketplace and place them on their local machine with one command. The primary workflow is:

1. Developer browses the web marketplace and finds a skill they want
2. They click a button on the skill page that copies an `npx` command to their clipboard
3. They open their terminal and paste the command
4. The CLI prompts for scope and provider preferences, then installs the skill

That's it. The CLI does not handle publishing, rating, searching, or any other marketplace interaction for now — those are web-only activities. The CLI exists solely to make consumption frictionless.

---

## Command

```
npx @emergent/skills install <skill-name-or-id>
```

There is one command: `install`. The skill identifier comes from the marketplace URL / button and can be a skill name or UUID.

---

## Install Flow

### Step 1 — Resolve the skill

The CLI calls the API's `/api/skills/:id/download` endpoint (or resolves by name first via `/api/skills?search=<name>`). The API returns:

- Skill metadata (name, description, category, version)
- The `githubPath` pointing to the skill's directory in the GitHub repo
- A list of files in that directory with their download URLs

The API also increments the download count as a side effect.

### Step 2 — Prompt for scope

Using `@clack/prompts`, ask the user:

> **Where should this skill be installed?**
> - Global (available in all projects)
> - Project (current directory only)

If the user picks **project**, the CLI uses the current working directory as the project root. If the user picks **global**, the CLI writes to the user's home directory config.

### Step 3 — Prompt for providers

Ask the user which tool providers to install for (multi-select):

> **Which tools should this skill be installed for?**
> - Claude Code
> - GitHub Copilot

Both can be selected. The list of providers is extensible — Codex, Gemini, etc. can be added later without changing the core flow.

### Step 4 — Download files from GitHub

The CLI fetches each file from the skill's GitHub directory using the download URLs returned by the API. No GitHub token is needed on the client side — the API provides pre-authenticated download URLs from the public/internal repo.

### Step 5 — Write files to disk

For each selected provider, the corresponding adapter determines the correct target directory and writes the files. The skill's directory structure from GitHub is preserved as-is (it's validated at upload time to have the correct folder layout).

### Step 6 — Handle conflicts

If any target file already exists on disk, the CLI prompts the user:

> **`commands/my-skill.md` already exists. What would you like to do?**
> - Overwrite
> - Skip this file
> - Cancel install

### Step 7 — Summary

Display a summary of what was installed, where it went, and for which providers.

---

## File Placement

Each provider adapter knows where to place files for each scope. The skill directory in GitHub already contains the correct subfolder structure (e.g., `commands/`, `rules/`, `hooks/`, `agents/`), validated at upload time. The adapter maps the skill's root to the provider's root directory.

### Claude Code

| Scope | Target directory |
|-------|-----------------|
| Project | `<cwd>/.claude/` |
| Global | `~/.claude/` |

Skill files from GitHub are placed directly under the target. For example, if the GitHub skill directory contains `commands/my-skill.md` and `rules/my-rule.md`, they end up at `.claude/commands/my-skill.md` and `.claude/rules/my-rule.md`.

### GitHub Copilot

| Scope | Target directory |
|-------|-----------------|
| Project | `<cwd>/.copilot/skills/` |
| Global | `~/.copilot/skills/` |

### Future Providers

The adapter pattern makes adding new providers straightforward. Each new provider only needs to define its project and global root paths and any file transformation logic (if the provider expects a different format).

---

## Architecture

### Adapter Pattern

The core abstraction is a **provider adapter**. Each adapter implements a common interface:

- Given a scope (global or project), return the target root directory
- Given a list of files, write them to the correct locations under that root
- Handle any provider-specific file transformations if needed

The install command orchestrates the flow: resolve skill, prompt user, then delegate to each selected adapter for the actual file writes.

### Key Modules

**Entry point** — Sets up Commander with the `install` command and parses arguments.

**Install command** — The main orchestrator. Calls the API, runs the interactive prompts, invokes adapters, and displays results.

**API client** — Already exists in `src/lib/api.ts`. Handles all HTTP calls to the marketplace API. May need a new function for fetching raw file contents from GitHub download URLs.

**Provider adapters** — One per supported tool (Claude, Copilot). Each encapsulates the path-resolution logic for that tool. Registered in a provider registry so the install command can look them up dynamically.

**File writer** — Shared utility that handles downloading file contents, writing to disk, creating directories, and conflict detection/prompting.

**GitHub fetcher** — Downloads files from GitHub using the download URLs provided by the API. No authentication needed on the CLI side.

---

## What Exists Today

The CLI package (`packages/cli/`) has the scaffolding in place:

- `package.json` with `commander`, `chalk`, and `ora` as dependencies
- `src/lib/api.ts` with helper functions for all relevant API endpoints
- `src/index.ts` that currently just re-exports the API module
- `src/commands/` directory exists but is empty
- Build tooling (`tsup`, `tsx`) is configured
- The `bin` field points to `./dist/index.js` as the `emergent-skills` executable

The API already supports the download flow — `GET /api/skills/:id/download` returns the skill metadata, GitHub path, and file listing with download URLs.

---

## What Needs to Be Built

### 1. Add `@clack/prompts` dependency

The interactive prompts (scope selection, provider selection, conflict resolution) will use `@clack/prompts` for a polished terminal UX.

### 2. Provider adapter interface and registry

Define the common adapter interface that all providers must implement. Create a registry that maps provider names to adapter instances. This is the extensibility point for future tools.

### 3. Claude Code adapter

Implements the adapter interface for Claude Code. Maps global scope to `~/.claude/` and project scope to `<cwd>/.claude/`. Preserves the skill's directory structure as-is.

### 4. Copilot adapter

Implements the adapter interface for GitHub Copilot. Maps global scope to `~/.copilot/skills/` and project scope to `<cwd>/.copilot/skills/`.

### 5. GitHub file downloader

A utility that takes the file listing from the API response and downloads each file's content. Uses the `downloadUrl` field from the `SkillFile` type that the API already returns.

### 6. File writer with conflict handling

Writes downloaded files to disk under the target directory determined by the adapter. Creates intermediate directories as needed. Detects existing files and prompts the user before overwriting.

### 7. Install command

The main command implementation. Wires everything together:

- Parse the skill identifier from the command arguments
- Call the API to resolve the skill and get its file listing
- Run the scope prompt
- Run the provider prompt
- For each selected provider, run the adapter to determine paths
- Download files and write them via the file writer
- Display a summary using `ora` spinners and `chalk` formatting

### 8. CLI entry point

Replace the current `src/index.ts` (which just re-exports the API module) with a proper Commander program definition that registers the `install` command and handles `--help`, `--version`, etc.

---

## Dependencies

### Existing (no changes needed)

- `commander` — CLI argument parsing and command registration
- `chalk` — Colored terminal output for success/error/info messages
- `ora` — Loading spinners during API calls and file downloads
- `@emergent/shared` — Shared types (`Skill`, `SkillDownloadResponse`, `SkillFile`, `InstallTarget`)

### To Add

- `@clack/prompts` — Interactive prompts for scope, provider, and conflict resolution

---

## API Contract

The CLI depends on one primary API endpoint:

**`GET /api/skills/:id/download`** — Already implemented. Returns:

```
{
  data: {
    skill: { id, name, description, category, githubPath, version, ... },
    githubPath: "skills/global/react-testing",
    files: [
      { name: "commands/react-testing.md", path: "skills/global/react-testing/commands/react-testing.md", downloadUrl: "https://raw.githubusercontent.com/...", size: 1234 }
    ]
  }
}
```

For name-based lookups, the CLI may first call **`GET /api/skills?search=<name>`** to resolve a skill name to an ID, then call the download endpoint.

No changes to the API are required for the initial CLI implementation.

---

## Error Handling

- **Skill not found** — If the API returns 404 for the skill identifier, display a clear error message and suggest checking the skill name on the marketplace.
- **Network failure** — If the API or GitHub is unreachable, display the error and exit gracefully.
- **File write failure** — If a file can't be written (permissions, disk full), report which file failed and what went wrong.
- **No providers selected** — If the user deselects all providers, cancel the install with a message.
- **Already up to date** — If all files already exist and the user skips all conflicts, report that nothing was changed.

---

## UX Flow (Terminal Output)

```
$ npx @emergent/skills install react-testing

  Emergent Skills Marketplace

  Resolving skill...
  Found: react-testing v1.0.0 — React component testing patterns

  Where should this skill be installed?
  ● Global (available in all projects)
  ○ Project (current directory only)

  Which tools should this skill be installed for?
  ◻ Claude Code
  ◻ GitHub Copilot

  Installing for Claude Code (global)...
  ✔ commands/react-testing.md
  ✔ rules/react-testing-rules.md

  Installing for GitHub Copilot (global)...
  ✔ commands/react-testing.md
  ✔ rules/react-testing-rules.md

  Done! Installed react-testing for 2 providers.
```

---

## Extensibility Considerations

### Adding a new provider

To add support for a new tool (e.g., Codex, Gemini):

1. Create a new adapter implementing the provider interface
2. Register it in the provider registry
3. Add the provider name to `INSTALL_TARGETS` in `@emergent/shared`

No changes to the install command, prompts, or file writer are needed.

### Future commands

The CLI architecture should cleanly support adding new commands later (e.g., `publish`, `list`, `rate`). Commander handles this naturally — each command is a separate module registered on the program.

### Install-project command

A natural follow-up command: `npx @emergent/skills install-project <project-name>` that fetches all skills for a project and installs them in a batch. This reuses the same adapter and file-writing infrastructure, just with a loop over multiple skills.

---

## Implementation Order

1. **Provider adapter interface + registry** — Define the contract first since everything depends on it
2. **Claude Code adapter** — The primary provider
3. **Copilot adapter** — Second provider, validates the adapter abstraction works
4. **GitHub file downloader** — Fetch skill files from download URLs
5. **File writer with conflict handling** — Write files to disk with prompts
6. **Install command** — Wire the pieces together with interactive prompts
7. **CLI entry point** — Replace the current index.ts with Commander setup
8. **Manual testing** — End-to-end test with a real skill from the marketplace
