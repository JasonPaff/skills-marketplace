# Skills Marketplace - Project Overview

## 1. Project Overview

Skills Marketplace is a centralized platform for discovering, sharing, and installing AI coding assistant skills, agents, and rules across an organization. It provides a web UI for browsing and uploading content, a REST API for managing the registry, and a CLI tool (`@detergent/skills`) for installing skills directly into Claude Code or GitHub Copilot project structures.

## 2. Purpose

- **Centralized Skill Registry** - Maintain a single source of truth for reusable AI assistant skills, agents, and rules that teams can discover and share across projects.
- **Multi-Provider Installation** - Install skills into both Claude Code (`.claude/` directory) and GitHub Copilot (`.github/` directory) workflows through a unified CLI with provider-specific adapters.
- **Batch Upload Workflow** - Upload entire folder structures or ZIP archives containing multiple skills, agents, and rules in a single atomic operation with automatic structure detection.
- **Project-Based Organization** - Organize skills by client and project, with support for forking shared skills into project-specific customized versions.
- **GitHub-Backed Storage** - Store all skill files in a GitHub repository using the Git Tree API for atomic commits, with PostgreSQL tracking metadata, download counts, and relationships.

## 3. Tech Stack

### Core Framework
- **TypeScript** v5.9.0 - Strict mode across all packages
- **pnpm** v10.4.1 - Package manager with workspace support
- **Turborepo** v2.8.0 - Monorepo build orchestration (`turbo.json`)
- **tsup** v8.5.0 - TypeScript bundler for API, shared, and CLI packages
- **Node.js** >=20.0.0

### Database & Backend
- **Hono** v4.7.0 - TypeScript-first web framework (`packages/api/`)
- **@hono/node-server** v1.13.0 - Local development server (port 8787)
- **@hono/zod-validator** v0.7.6 - Request validation middleware
- **Drizzle ORM** v0.45.0 - SQL ORM with type-safe queries (`packages/api/src/db/schema.ts`)
- **drizzle-kit** v0.31.0 - Migration generation and Drizzle Studio
- **@neondatabase/serverless** v1.0.0 - PostgreSQL client (Neon)
- **Octokit** v5.0.0 - GitHub API client for file storage (`packages/api/src/lib/github.ts`)

### UI Components & Styling
- **Next.js** v16.1.6 - React framework with App Router (`packages/web/`)
- **React** v19.2.4
- **Tailwind CSS** v4.0.0 - Utility-first CSS with custom design tokens (`packages/web/src/app/globals.css`)
- **@base-ui/react** v1.1.0 - Unstyled accessible component primitives
- **lucide-react** v0.563.0 - Icon library
- **class-variance-authority** v0.7.1 - Component variant management
- **next-themes** v0.4.6 - Dark/light mode toggle

### State Management & Data Fetching
- **@tanstack/react-query** v5.90.20 - Server state management with query key factory (`packages/web/src/lib/query/keys.ts`)
- **@tanstack/react-form** v1.28.0 - Form state management
- **@tanstack/react-table** v8.21.3 - Data table with sorting, filtering, and pagination
- **Hono RPC Client** - Type-safe API calls via `hc<AppType>()` (`packages/web/src/lib/api.ts`)
- **nuqs** v2.8.8 - URL search param state management
- **next-typesafe-url** v6.1.0 - Type-safe route definitions

### Shared Package
- **Zod** v4.3.6 - Schema validation shared across API, web, and CLI (`packages/shared/src/schemas.ts`)
- **gray-matter** v4.0.3 - Markdown frontmatter parsing for SKILL.md/AGENT.md/RULE.md files

### CLI
- **Commander** v14.0.0 - CLI argument parsing (`packages/cli/src/index.ts`)
- **@clack/prompts** v0.10.0 - Interactive terminal prompts
- **chalk** v5.6.0 - Terminal color output
- **ora** v9.3.0 - Spinner/progress indicators

### Development Tools
- **ESLint** v9.39.2 with `typescript-eslint` v8.55.0 and `eslint-plugin-perfectionist` v5.5.0
- **Prettier** v3.8.1 with `eslint-config-prettier` v10.1.8
- **tsx** v4.21.0 - TypeScript execution for development
- **@tanstack/react-query-devtools** v5.91.3 - Query debugging
- **dotenv** v17.2.0 - Local environment variable loading

## 4. Key Features

- Searchable skills catalog with data table (sorting, filtering, pagination) on the home page
- Single skill upload with SKILL.md frontmatter validation and multi-file support
- Batch upload of skills, agents, and rules via folder or ZIP archive with automatic structure detection
- Atomic GitHub commits via the Git Tree API for all file uploads
- Skill forking to create project-specific customized versions with parent tracking
- Download count tracking incremented on each skill download
- CLI installation with interactive provider selection (Claude Code or GitHub Copilot)
- File conflict detection and resolution during CLI install
- Client and project management for organizational hierarchy
- Project-skill association via many-to-many join table with customization tracking
- Dark/light theme toggle with accent color customization
- Type-safe API client using Hono RPC (`hc<AppType>()`) for end-to-end type safety
- Dependency injection middleware for database, GitHub client, and services via `c.set()`/`c.get()`
- Global error handling with `HTTPException` and structured JSON error responses
- URL-driven search and filter state via `nuqs` for shareable/bookmarkable views

## 5. Folder Structure

- **`packages/api/src/`** - Hono REST API backend
  - **`db/`** - Database configuration (`index.ts` with connection caching) and Drizzle schema (`schema.ts` with 5 tables + 1 join table)
  - **`lib/`** - External integrations (`github.ts` - Octokit wrapper for file commits and retrieval)
  - **`routes/`** - Hono route handlers (`skills.ts`, `projects.ts`, `clients.ts`, `upload.ts`)
  - **`queries/`** - Database access layer with factory functions (`skill.queries.ts`, `project.queries.ts`, `client.queries.ts`, `agent.queries.ts`, `rule.queries.ts`)
  - **`services/`** - Business logic layer (`skill.service.ts`, `project.service.ts`, `client.service.ts`, `upload.service.ts`)
  - **`types/`** - Hono environment type definition (`env.ts` with `Bindings` and `Variables`)

- **`packages/web/src/`** - Next.js 16 frontend application
  - **`app/`** - App Router pages and layouts (`page.tsx` home, `skills/new/page.tsx` upload, `skills/[id]/page.tsx` detail)
  - **`components/forms/`** - Upload form with folder/ZIP detection (`skill-form.tsx`, `form-field.tsx`)
  - **`components/skills/`** - Skill display components (`skills-table.tsx`, `skill-detail-content.tsx`, `skill-header.tsx`, `skill-metadata.tsx`, `skill-stats.tsx`)
  - **`components/layout/`** - Layout primitives (`page-header.tsx`, `theme-toggle.tsx`, `back-link.tsx`, `error-alert.tsx`)
  - **`components/ui/`** - Reusable base components (`button.tsx`, `card.tsx`, `input.tsx`, `data-table.tsx`, `badge.tsx`, `select.tsx`, `tooltip.tsx`)
  - **`lib/query/`** - React Query hooks and key factory (`use-skills.ts`, `use-skill.ts`, `use-create-skill.ts`, `use-batch-upload.ts`, `use-projects.ts`, `use-clients.ts`)
  - **`lib/utils/`** - Utility functions (`folder-detection.ts`, `zip.ts`, `format.ts`, `cn.ts`)
  - **`lib/theme/`** - Theme accent color provider (`accent-color-provider.tsx`)
  - **`lib/`** - API client (`api.ts`), search params (`search-params.ts`), debounce hook (`use-debounced-value.ts`)

- **`packages/shared/src/`** - Shared types and validation schemas
  - `schemas.ts` - Zod schemas for skills, agents, rules, and batch operations
  - `types.ts` - TypeScript types inferred from Zod schemas
  - `constants.ts` - Shared constants (`SKILL_SCOPES`, `INSTALL_TARGETS`, `ITEM_TYPES`, `API_VERSION`)

- **`packages/cli/src/`** - Published CLI tool (`@detergent/skills`)
  - **`commands/`** - CLI commands (`install.ts` - interactive skill installation)
  - **`lib/`** - API client (`api.ts`), file download (`download.ts`), conflict resolution (`conflicts.ts`), project root detection (`project-root.ts`)
  - **`lib/providers/`** - Provider adapters (`claude.ts` for `.claude/` directory, `copilot.ts` for `.github/` directory)

## 6. Architecture

- **Monorepo with Turborepo** - Four packages (`api`, `web`, `shared`, `cli`) with shared TypeScript config (`tsconfig.base.json`), coordinated builds via `turbo.json` dependency graph, and workspace protocol (`workspace:*`) for inter-package references.
- **Layered Backend (Routes -> Services -> Queries)** - API follows a clean three-layer architecture: route handlers delegate to services for business logic, which call query functions for database access. All layers are instantiated via factory functions and injected through Hono middleware using `c.set()`.
- **Type-Safe End-to-End** - The Hono app exports `AppType` which the web frontend consumes via `hc<AppType>()` for fully typed API calls. Zod schemas in `@emergent/shared` provide runtime validation with inferred TypeScript types used across all packages.
- **GitHub as File Storage** - All uploaded skill/agent/rule files are committed to a GitHub repository using the Octokit Git Tree API for atomic multi-file commits. PostgreSQL (Neon) stores only metadata, relationships, and download counts.
- **Provider Adapter Pattern (CLI)** - The CLI uses a provider registry (`packages/cli/src/lib/providers/index.ts`) with adapters for Claude Code and GitHub Copilot, each mapping skill files to the correct target directory structure.
- **React Query for Server State** - All data fetching uses TanStack React Query with a centralized query key factory (`packages/web/src/lib/query/keys.ts`), separate hooks per entity, and automatic cache invalidation on mutations.
- **Dependency Injection via Middleware** - Database connections, GitHub clients, query factories, and service instances are all created in a Hono middleware and injected into the request context, typed via `AppEnv` (`packages/api/src/types/env.ts`).
- **Atomic Batch Operations** - The batch upload service (`packages/api/src/services/upload.service.ts`) uses a three-phase approach: validate all items first (no side effects), commit all files to GitHub in one tree operation, then insert all database records sequentially.

## 7. Development Commands

### Root Workspace (via Turborepo)
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in development mode (API on :8787, Web on :3000) |
| `pnpm build` | Build all packages with dependency ordering |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm lint:fix` | Auto-fix ESLint issues across all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without modifying files |
| `pnpm typecheck` | Run TypeScript type checking across all packages |
| `pnpm db:generate` | Generate Drizzle migration files from schema changes |
| `pnpm db:migrate` | Apply pending database migrations |
| `pnpm db:studio` | Open Drizzle Studio GUI for database browsing |

### Package-Specific
| Command | Package | Description |
|---------|---------|-------------|
| `pnpm db:seed` | `@emergent/api` | Seed the database with sample data |
| `pnpm routes` | `@emergent/web` | Generate type-safe route definitions (next-typesafe-url) |
| `pnpm routes:watch` | `@emergent/web` | Watch and regenerate route types on file changes |
| `pnpm start` | `@detergent/skills` | Run the CLI from built output (`dist/index.js`) |
