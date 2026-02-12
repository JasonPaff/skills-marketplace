# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp Start**: 2026-02-12T00:00:30Z
**Duration**: ~9s

## Original Request

Rework the skill upload system to support uploading an entire .claude folder structure containing multiple skills, agents, and rules in a single upload. Currently, the upload form in packages/web/src/components/forms/skill-form.tsx assumes a single skill per upload with one name/description tied to one SKILL.md. The new upload flow should: (1) detect when the uploaded folder contains skills/, agents/, and/or rules/ subfolders, (2) parse each subfolder according to its type, (3) display a categorized preview UI. Add type-specific frontmatter parsers, create new database tables, rework API endpoints.

## Project Context

- pnpm monorepo (skills-marketplace) with packages: web, api, shared, cli
- Turbo for build orchestration, TypeScript, Drizzle ORM, Zod validation
- Hono backend, Next.js frontend
- GitHub as storage backend for skill files

## Refined Request (Single Paragraph)

Rework the skill upload system to support uploading an entire `.claude` folder structure containing multiple skills, agents, and rules in a single upload operation. Currently, the upload form in `packages/web/src/components/forms/skill-form.tsx` assumes a single skill per upload with one name and description tied to one `SKILL.md` file, but the new flow should detect when the uploaded folder contains `skills/`, `agents/`, and/or `rules/` subfolders and parse each subfolder according to its type. Skills are folders containing a `SKILL.md` with name/description frontmatter, agents are individual `.md` files with name/description/color/tools/model frontmatter, and rules are individual `.md` files with paths frontmatter. The upload form should remove its single name/description fields and instead derive all metadata from each item's parsed frontmatter, displaying a categorized preview UI that shows items grouped by type (for example, "3 Skills, 2 Agents, 1 Rule detected") with expandable sections revealing per-item validation status. To support this, add type-specific frontmatter parsers `parseAgentMd()` and `parseRuleMd()` alongside the existing `parseSkillMd()` in `packages/shared/src/schemas.ts`, backed by corresponding Zod schemas for agent frontmatter (name, description, color, tools, model) and rule frontmatter (paths). On the database side, create new `agents` and `rules` tables in `packages/api/src/db/schema.ts` mirroring the existing skills table structure (id, name, description, githubPath, downloadCount, uploadedAt) with type-specific columns added as needed. Each uploaded item gets its own database record and GitHub path following the convention `skills/global/${name}`, `agents/global/${name}`, and `rules/global/${name}` respectively. Rework the API endpoint and service layer in `packages/api/src/services/skill.service.ts` to accept a batch payload containing multiple skills, agents, and rules, validate each item against its type-specific schema, commit all files to GitHub atomically in a single commit, and insert all database records in one transaction. If the uploaded folder is a simple skill folder with no `skills/`/`agents/`/`rules/` subfolders and just a `SKILL.md` at root, the system should continue supporting the current single-skill upload behavior as a fallback path. Browsing and download functionality for agents and rules are out of scope for this change, which focuses exclusively on the upload flow, frontmatter parsing, database storage, and GitHub commit logic.

## Validation

- **Word count**: ~320 words (within 200-500 range)
- **Format**: Single paragraph ✓
- **Intent preserved**: Core scope maintained ✓
- **No feature creep**: Scope boundaries preserved ✓
