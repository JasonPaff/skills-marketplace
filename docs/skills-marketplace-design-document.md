# Internal Agentic Developer Resources Platform

## Overview

This document captures the design, architecture, and implementation plan for an internal "skills marketplace" for Emergent Software. The goal is to create a centralized platform where engineers can:

- Publish and share **Claude Code / Copilot skills** (SKILL.md + assets/scripts)
- Discover and rate skills (1–5 stars, download counts)
- Install skills into their local environment or project via a **simple CLI** (NPX)
- **Filter and version skills by client/project** with inheritance from global standards
- Eventually register and manage **MCP servers, hooks, and sub-agents** as first-class entities

The initial focus is on a **1‑day MVP/demo** that proves the value of the concept and sets a clear path for hardening and expansion.

---

## Context & Goals

### Company Context

- ~70 developers, ~130 total employees
- Consultancy building apps for multiple clients/projects
- Polyglot environment (.NET, React, React Native, SQL, etc.)
- Increasing use of agentic tools:
  - Claude Code
  - GitHub Copilot
  - MCP servers and skills
- Existing documentation:
  - Dev standards site at `emergentsoftware.io` (likely Azure DevOps-backed)
  - Contains .NET, SQL, and other standards in markdown/HTML

### Pain Points

- "Tribal knowledge" about patterns and workflows lives in people's heads or ad-hoc ZIPs/links
- No standard, vetted place to publish and consume **skills** (Claude, Copilot, MCP)
- Management is worried about **security** if developers start pulling random skills/MCP servers from the internet
- Existing docs site is not agent-aware; AIs must be explicitly pointed at it and it is not structured as skills
- **No way to manage project-specific variations** - different clients require different libraries, patterns, or configurations
- **New developers joining projects** have no easy way to get all project-specific tools and standards in one command

### Project Goals

1. **Centralization** – Single internal place for:
   - Claude/Copilot skills
   - (Future) MCP servers, hooks, and sub-agents
   - Possibly transformed content from dev standards site
2. **Ease of Contribution** – Any employee can:
   - Upload a SKILL.md + related files via web UI (no Git PRs required)
   - Tag skill with language/tech (e.g., `dotnet`, `react-native`, `sql`)
   - Tag skill with project/client association
3. **Ease of Consumption** – Any employee can:
   - Search/browse skills via web UI
   - Filter by global vs project-specific
   - Install a single skill via `npx @emergent/skills install <name>`
   - **Install all project skills** via `npx @emergent/skills install-project <project-name>`
   - Choose install target: global (~/.claude or ~/.github/copilot) or project-local
4. **Project Hierarchy & Inheritance**:
   - **Global skills** - Company-wide standards available to all projects
   - **Project-specific skills** - Forked or customized versions for specific client needs
   - New developers can instantly get all tools for their project
5. **Security & Governance** – Over time:
   - Vet internal skills vs random external artifacts
   - Add scanning, approval, and auditability
6. **Versioning & Evolution** – Over time:
   - Multiple versions per skill (e.g., for different Claude versions, Tailwind versions, etc.)
   - Explicit upgrade paths and deprecation

---

## High-Level Architecture

For the MVP, architecture is intentionally simple but extensible.

```text
┌─────────────────────────────────┐
│   Next.js (Vercel)              │
│   - Browse skills               │
│   - Filter by project/client    │
│   - Upload form                 │
│   - Show ratings/downloads      │
│   - Project dashboard view      │
└──────────────┬──────────────────┘
               │
┌──────────────┴──────────────────┐
│   Hono API (Vercel/Cloudflare)  │
│   - GET /api/skills             │
│   - GET /api/skills?project=X   │
│   - GET /api/projects           │
│   - GET /api/projects/:id/skills│
│   - POST /api/skills (commits   │
│     to GitHub via Octokit)      │
│   - GET /api/skills/:id/download│
│   - POST /api/skills/:id/rate   │
│   - POST /api/skills/:id/fork   │
└──────────────┬──────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────┴─────┐      ┌─────┴──────────┐
│ Neon     │      │ GitHub Repo     │
│ Postgres │      │ - skills/       │
│ - Skills │      │   - global/     │
│   metadata│     │   - projects/   │
│ - Projects│     │ - hooks/        │
│ - Clients │     │ - sub-agents/   │
└───────────┘     └─────────────────┘
```

### Tech Stack (MVP)

- **Backend**: Hono (TypeScript) - Fast, simple, edge-ready
- **Frontend**: Next.js + TypeScript (React framework)
- **Database**: Neon (Serverless Postgres) - Free tier, instant provisioning
- **File Storage**: GitHub Repository (version control built-in, free, transparent)
- **Hosting**: Vercel (frontend + API) or Cloudflare Workers (API)
- **CLI**: Node.js + TypeScript, published as `@emergent/skills` on NPM
- **Auth (post-demo)**: Microsoft Entra ID (Azure AD) – standard company SSO

### Why This Stack?

- **Zero infrastructure costs** for MVP
- **Fast iteration** - Deploy to Vercel in seconds
- **Version control built-in** - Every skill change tracked in Git
- **Simple for developers** - Familiar tools (GitHub, Vercel, Postgres)
- **Easy migration path** - Can move to Azure later if needed without changing much

---

## Setup Steps

### 1. Create Neon Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project: "emergent-skills"
3. Copy connection string (format: `postgresql://user:pass@host/db?sslmode=require`)
4. Store securely - will be used by API

### 2. Create GitHub Repository

1. Create private repo: `emergent-software/skills-marketplace`
2. Initialize with folder structure:
   ```
   skills/
   ├── global/
   └── projects/
   hooks/
   sub-agents/
   README.md
   ```
3. Generate GitHub Personal Access Token:
   - Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Repository access: Only select repositories → `skills-marketplace`
   - Permissions: Contents (Read and write)
4. Store token securely - will be used by API to commit files

### 3. Setup Hono API

1. Create Hono TypeScript project
2. Configure environment variables:
   - `DATABASE_URL` - Neon connection string
   - `GITHUB_TOKEN` - Personal access token
   - `GITHUB_OWNER` - e.g., "emergent-software"
   - `GITHUB_REPO` - e.g., "skills-marketplace"
3. Deploy to Vercel or Cloudflare Workers

### 4. Setup Next.js Frontend

1. Create Next.js TypeScript project
2. Configure environment variable:
   - `NEXT_PUBLIC_API_URL` - URL of deployed Hono API
3. Deploy to Vercel (connects to Git, auto-deploys on push)

### 5. Publish CLI Package

1. Create CLI TypeScript project
2. Update `API_URL` constant to point to deployed API
3. Build and publish to NPM: `npm publish`
4. (Optional) Publish to private NPM registry or GitHub Packages

---

## Database Schema

### Tables

#### 1. `clients`
- Purpose: Represent client organizations
- Fields:
  - `id` (UUID, PK, default: gen_random_uuid())
  - `name` (VARCHAR(200), unique)
  - `description` (TEXT, nullable)
  - `created_at` (TIMESTAMP, default: now())

#### 2. `projects`
- Purpose: Represent client projects
- Fields:
  - `id` (UUID, PK, default: gen_random_uuid())
  - `client_id` (UUID, FK to clients)
  - `name` (VARCHAR(200))
  - `description` (TEXT, nullable)
  - `created_at` (TIMESTAMP, default: now())
  - `is_active` (BOOLEAN, default: true)
- Indexes:
  - `idx_projects_client_id` on `client_id`
  - `idx_projects_name` on `name`

#### 3. `skills`
- Purpose: Store skill metadata
- Fields:
  - `id` (UUID, PK, default: gen_random_uuid())
  - `name` (VARCHAR(100))
  - `description` (VARCHAR(500))
  - `category` (VARCHAR(50)) - e.g., `dotnet`, `react`, `sql`
  - `github_path` (VARCHAR(500)) - Path in GitHub repo (e.g., `skills/global/react-native-expo-setup`)
  - `uploaded_by` (VARCHAR(100))
  - `uploaded_at` (TIMESTAMP, default: now())
  - `download_count` (INT, default: 0)
  - `total_rating` (INT, default: 0)
  - `rating_count` (INT, default: 0)
  - `average_rating` (DECIMAL, generated: `CASE WHEN rating_count > 0 THEN total_rating::DECIMAL / rating_count ELSE 0 END`)
  - `is_global` (BOOLEAN, default: true)
  - `parent_skill_id` (UUID, nullable, FK to skills) - For forked skills
  - `version` (VARCHAR(20), default: '1.0.0')
- Indexes:
  - `idx_skills_name` on `name`
  - `idx_skills_category` on `category`
  - `idx_skills_is_global` on `is_global`
- Constraints:
  - Unique constraint on `(name, is_global, parent_skill_id)` - allows same name for global and project-specific

#### 4. `project_skills`
- Purpose: Map skills to projects (many-to-many)
- Fields:
  - `id` (UUID, PK, default: gen_random_uuid())
  - `project_id` (UUID, FK to projects)
  - `skill_id` (UUID, FK to skills)
  - `is_customized` (BOOLEAN, default: false) - True if forked from global
  - `added_at` (TIMESTAMP, default: now())
- Indexes:
  - `idx_project_skills_project_id` on `project_id`
  - `idx_project_skills_skill_id` on `skill_id`
- Constraints:
  - Unique constraint on `(project_id, skill_id)`

#### 5. `resource_types` (Future)
- Purpose: Support hooks, sub-agents, MCP servers
- Fields:
  - `id` (SERIAL, PK)
  - `name` (VARCHAR(50)) - e.g., 'Skill', 'Hook', 'SubAgent', 'MCPServer'
  - `description` (VARCHAR(500))

### Relationships

```
clients (1) ──→ (N) projects
skills (1) ──→ (N) skills (self-reference for forks)
projects (N) ←→ (M) skills (via project_skills)
```

### GitHub Repository Structure

```
skills-marketplace/
├── skills/
│   ├── global/
│   │   ├── react-native-expo-setup/
│   │   │   ├── SKILL.md
│   │   │   ├── setup-script.ts
│   │   │   └── templates/
│   │   │       └── app-template.tsx
│   │   └── dotnet-cqrs-pattern/
│   │       └── SKILL.md
│   └── projects/
│       ├── acme-mobile-app/
│       │   └── react-native-expo-setup/  # forked version
│       │       └── SKILL.md
│       └── contoso-web-portal/
│           └── contoso-api-auth/
│               └── SKILL.md
├── hooks/  # future
├── sub-agents/  # future
└── README.md
```

---

## Backend API Endpoints

### Skills Endpoints

1. **GET `/api/skills`**
   - Query params:
     - `search` (string, optional) - Search by name/description
     - `category` (string, optional) - Filter by category
     - `projectId` (uuid, optional) - Filter to project-specific skills
     - `isGlobal` (boolean, optional) - Filter global vs project-specific
   - Returns: Array of skill objects with `githubPath`

2. **GET `/api/skills/:id`**
   - Returns: Single skill details including `githubPath`

3. **POST `/api/skills`**
   - Body: multipart/form-data
     - `name`, `description`, `category`
     - `isGlobal` (boolean)
     - `projectId` (uuid, optional - for project-specific)
     - `files` (array of files)
   - Process:
     1. Validate input and check for duplicates
     2. Determine GitHub path:
        - Global: `skills/global/{name}/`
        - Project-specific: `skills/projects/{project-slug}/{name}/`
     3. Use GitHub API (Octokit) to commit files to repo
     4. Insert metadata into Neon database with `github_path`
   - Returns: Created skill object

4. **GET `/api/skills/:id/download`**
   - Increments download count in database
   - Returns: Object with `githubPath` and list of files
   - Client (CLI) uses this to fetch files from GitHub

5. **POST `/api/skills/:id/rate`**
   - Body: `{ rating: 1-5, userEmail: string }`
   - Updates `total_rating` and `rating_count`
   - Returns: Updated average rating

6. **POST `/api/skills/:id/fork`**
   - Body: `{ projectId: uuid, newName: string (optional) }`
   - Process:
     1. Fetch original skill files from GitHub
     2. Determine new GitHub path: `skills/projects/{project-slug}/{name}/`
     3. Commit files to new location in repo
     4. Create new skill record with `parent_skill_id` set
     5. Add entry to `project_skills` table
   - Returns: New forked skill object

### Project Endpoints

7. **GET `/api/projects`**
   - Query params:
     - `clientId` (uuid, optional)
   - Returns: Array of projects with client info

8. **GET `/api/projects/:id`**
   - Returns: Single project with client info

9. **GET `/api/projects/:id/skills`**
   - Returns: All skills associated with this project
   - Includes global skills inherited by default
   - Includes customized/forked skills
   - Each skill marked with `isCustomized` flag

10. **POST `/api/projects`**
    - Body: `{ clientId: uuid, name: string, description: string }`
    - Returns: Created project

### Client Endpoints

11. **GET `/api/clients`**
    - Returns: Array of all clients

12. **POST `/api/clients`**
    - Body: `{ name: string, description: string }`
    - Returns: Created client

---

## Frontend Components & Views

### Main Views

1. **Skills Browser (Home)**
   - Grid/list of all skills
   - Filter controls:
     - Search box
     - Category dropdown
     - "Global" vs "All Projects" vs specific project selector
   - Each skill card shows:
     - Name, description, category badge
     - Rating (stars), download count
     - Uploaded by, uploaded date
     - "Install" button (copies CLI command)
     - "Fork to Project" button (if global skill)
     - Project badges (if project-specific)
     - GitHub icon linking to skill folder in repo

2. **Upload Skill Form**
   - Fields:
     - Name
     - Description
     - Category
     - Scope selector: "Global" or "Project-specific"
     - If project-specific: Project dropdown
     - File upload (multiple files)
   - Submit creates skill via API (which commits to GitHub)

3. **Project Dashboard**
   - Select project from dropdown
   - Shows:
     - Project name, client, description
     - List of all skills for this project
       - Inherited global skills (with indicator)
       - Customized/forked skills (with indicator)
     - "Install All Project Skills" button (copies CLI command)
     - "Add Skill to Project" button
     - GitHub icon linking to project folder in repo

4. **Client/Project Management**
   - Admin view to create clients and projects
   - List clients with their projects
   - Simple CRUD interface

### Key UI Interactions

- **Forking a Skill**: Click "Fork to Project" on global skill, select target project, optionally rename, creates copy in GitHub
- **Project Skill Customization**: Edit forked skill (future: show diff from parent via GitHub compare)
- **Bulk Install**: Copy `npx @emergent/skills install-project <project-name>` command
- **Search/Filter**: Real-time filtering as user types or changes filters
- **View in GitHub**: Links to skill folders in repo for transparency

---

## CLI Tool (`@emergent/skills`)

### Package Structure

```text
emergent-skills-cli/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### Commands

1. **`emergent-skills list`**
   - Lists all global skills
   - Fetches from API

2. **`emergent-skills list --project <project-name>`**
   - Lists all skills for a specific project
   - Fetches from API

3. **`emergent-skills search <query>`**
   - Search skills by name/description
   - Shows matching skills with install commands

4. **`emergent-skills install <skill-name>`**
   - Options:
     - `--global` - Install to user level (~/.claude or ~/.github/copilot)
     - `--project` - Install to current project (.claude or .github/copilot in cwd)
     - `--copilot` - Install for GitHub Copilot instead of Claude Code
   - Process:
     1. Query API for skill metadata (gets `githubPath`)
     2. Fetch files from GitHub repo at that path
     3. Write to appropriate local directory

5. **`emergent-skills install-project <project-name>`**
   - Fetches all skills associated with project from API
   - Installs all of them in one command
   - Options:
     - `--global` - Install to user level
     - `--project` - Install to current project
     - `--copilot` - Install for GitHub Copilot
   - Shows progress for each skill

6. **`emergent-skills info <skill-name>`**
   - Shows detailed info about a skill
   - Includes: description, category, rating, downloads, project association, parent skill (if forked)
   - Shows GitHub URL for skill folder

### Implementation Notes

- CLI calls API endpoints to fetch skill metadata
- Uses GitHub API or raw.githubusercontent.com to download files
- Two approaches for downloading:
  - **Option A**: Use GitHub API to fetch individual files (no git dependency, better for users)
  - **Option B**: Use `git sparse-checkout` to clone specific folder (requires git installed)
- Writes to appropriate directories based on scope and tool (Claude/Copilot)
- Dependencies: `commander` (CLI framework), `axios` (HTTP), `fs-extra` (file operations)

---

## Project/Client Workflow Examples

### Example 1: Global Skill → Project Fork

1. Company publishes global skill: `react-native-expo-setup`
   - Committed to: `skills/global/react-native-expo-setup/`
2. Project "Acme Mobile App" needs to use Expo SDK 51 instead of 52
3. Developer clicks "Fork to Project" on global skill
4. Selects "Acme Mobile App" project
5. Names forked skill: `react-native-expo-setup` (keeps same name, project-scoped)
6. System:
   - Copies files from `skills/global/react-native-expo-setup/` to `skills/projects/acme-mobile-app/react-native-expo-setup/`
   - Commits to GitHub with message: "Fork react-native-expo-setup for Acme Mobile App"
   - Creates database record with `is_global = false`, `parent_skill_id` set
7. Developer modifies forked skill's SKILL.md (via web UI or directly in GitHub)
8. Other Acme developers run: `npx @emergent/skills install-project acme-mobile-app`
9. They get the customized version automatically

### Example 2: New Developer Onboarding

1. Jane joins "Contoso Web Portal" project
2. Project uses:
   - Global skills: `.NET CQRS`, `SQL best practices`, `React TypeScript setup`
   - Project-specific: `Contoso API authentication` (custom OAuth flow), `Contoso UI components` (custom design system)
3. Jane runs: `npx @emergent/skills install-project contoso-web-portal --global`
4. CLI:
   - Fetches all 5 skill records from API
   - Downloads each from GitHub repo
   - Installs to `~/.claude/skills/`
5. Jane opens VS Code with Claude Code, all skills are immediately available
6. Claude Code can reference both global company standards and project-specific patterns

### Example 3: Multi-Project Developer

1. Bob works on both "Acme Mobile App" and "BetaCorp Dashboard"
2. Each project has different React Native setups (Expo vs bare)
3. Bob uses project-local installs:
   - In Acme project: `npx @emergent/skills install-project acme-mobile-app --project`
   - In BetaCorp project: `npx @emergent/skills install-project betacorp-dashboard --project`
4. Skills are scoped to each project directory
5. Claude Code sees relevant skills based on which project is open

---

## Skill Structure (SKILL.md Example)

Skills will continue to use the standard SKILL.md format, with added metadata for project association:

```markdown
---
name: "react-native-expo-setup"
description: "Setup new React Native project with Expo, TypeScript, and best practices"
when_to_use: "When creating a new React Native mobile app with Expo"
version: "1.0.0"
compatibility: "Expo SDK 52+, React Native 0.76+"
scope: "global"  # or "project"
project_id: null  # or uuid if project-specific
parent_skill_id: null  # or uuid if forked
---

## Purpose
Set up a new React Native project using Expo with TypeScript, navigation, and common dependencies.

## Triggers
- "create react native app"
- "setup expo project"
- "new mobile app with react native"

## Steps

1. Initialize Expo project
2. Install essential dependencies
3. Configure project structure
4. Setup navigation
5. Configure TypeScript

## Best Practices
- Use TypeScript strict mode
- Implement proper error boundaries
- Use Expo EAS for builds
- Follow Emergent Software mobile coding standards

## References
- [Expo Documentation](https://docs.expo.dev)
- See company dev standards site for additional patterns
```

---

## Future Enhancements

### Phase 2: Hooks & Sub-Agents

- Add `hooks` and `sub_agents` tables with similar structure to `skills`
- Add corresponding folders in GitHub repo: `hooks/`, `sub-agents/`
- CLI commands: `install-hook`, `install-subagent`
- UI views for browsing hooks and sub-agents
- Project-level hook/sub-agent customization

### Phase 3: MCP Servers

- Add `mcp_servers` table
- Store server configuration, connection details
- GitHub folder: `mcp-servers/`
- CLI installs MCP server configs to appropriate locations
- UI for browsing and managing MCP servers
- Project-specific MCP server configurations

### Phase 4: Versioning & Deprecation

- Add `skill_versions` table (1-to-many with skills)
- Support multiple versions per skill (different folders or Git tags)
- Deprecation warnings in CLI
- Automatic upgrade prompts
- Compatibility matrix (Claude version X requires skill version Y)

### Phase 5: Security & Governance

- Switch from direct commits to PR-based workflow
- Approval required before skill goes live
- GitHub Actions to scan uploaded files for security issues
- Audit log of all skill installations
- Role-based permissions (who can publish global vs project skills)
- Integration with Microsoft Entra ID for auth

### Phase 6: Integration with Dev Standards Site

- Sync content from existing `emergentsoftware.io` site
- Transform markdown docs into skills automatically
- Bi-directional sync or migration path
- Agent-aware documentation structure

### Phase 7: Analytics & Insights

- Dashboard showing most popular skills
- Skills with highest ratings
- Project adoption metrics (which projects use which skills)
- Developer productivity metrics (correlation with skill usage)
- Recommendations: "Projects similar to yours use these skills"

---

## Demo Flow Summary

### Setup (Before Demo)

1. Create Neon database and run schema setup
2. Create GitHub repo with folder structure
3. Generate GitHub personal access token
4. Deploy Hono API to Vercel/Cloudflare with environment variables
5. Deploy Next.js frontend to Vercel
6. Create sample clients and projects in database:
   - Client: "Acme Corp", Project: "Acme Mobile App"
   - Client: "BetaCorp", Project: "BetaCorp Dashboard"
7. Publish CLI package to NPM (or test locally with `npm link`)

### Demo Script

1. **Intro (2 min)**
   - Explain problem: tribal knowledge, no standard way to share Claude skills
   - Introduce solution: internal skills marketplace with GitHub backing

2. **Web UI Tour (3 min)**
   - Show empty skills browser
   - Show project selector
   - Show "Add Skill" form
   - Mention: "Everything uploaded goes directly to our GitHub repo for transparency"

3. **Upload Global Skill (3 min)**
   - Upload `react-native-expo-setup` skill
   - Tag as "Global" scope
   - Category: "react-native"
   - Show skill appears in browser
   - Show GitHub link - click to view skill in repo
   - Show rating, download count (both 0)

4. **CLI Install (2 min)**
   - Run `npx @emergent/skills list`
   - Run `npx @emergent/skills install react-native-expo-setup --global`
   - Show files written to `~/.claude/skills/react-native-expo-setup/`
   - Mention: "CLI pulled these files directly from our GitHub repo"

5. **Fork to Project (3 min)**
   - Click "Fork to Project" on global skill
   - Select "Acme Mobile App" project
   - Modify description: "Customized for Acme's Expo SDK 51 setup"
   - Show forked skill now appears with "Acme Mobile App" badge
   - Click GitHub link - show forked version in `skills/projects/acme-mobile-app/`
   - Filter skills by "Acme Mobile App" project

6. **Install All Project Skills (2 min)**
   - Upload second skill to "Acme Mobile App": `acme-api-auth`
   - Run `npx @emergent/skills install-project acme-mobile-app --global`
   - Show both skills installed at once

7. **Claude Code Integration (3 min)**
   - Open VS Code with Claude Code
   - Show skills are available in Claude
   - Trigger skill: "create react native app"
   - Show Claude references the skill

8. **Wrap-up (2 min)**
   - Recap: easy upload (goes to GitHub), easy install (from GitHub), project-specific customization
   - Mention version control benefits: "Every change is tracked in Git"
   - Future plans: hooks, sub-agents, MCP servers, PR-based approval workflow
   - Open for questions

---

## Technical Decisions to Make Later

When building this out, you'll need to decide:

### Backend (Hono API)
- Middleware stack: CORS, logging, error handling
- GitHub API approach: Octokit.js or raw REST API?
- File upload size limits
- Rate limiting strategy
- Database query optimization (connection pooling with Neon)
- Deployment target: Vercel vs Cloudflare Workers

### Frontend (Next.js)
- App Router vs Pages Router
- State management: React Context, Zustand, Jotai?
- Form validation: React Hook Form, Zod?
- UI component library: shadcn/ui, Radix UI, MUI?
- Data fetching: SWR, TanStack Query, native fetch?
- Styling: Tailwind CSS, CSS Modules, styled-components?

### CLI
- Progress indicators during multi-skill install?
- Retry logic for failed downloads?
- Caching downloaded skills locally to avoid re-downloading?
- Config file for user preferences (default to global vs project)?
- GitHub file download approach: API vs raw.githubusercontent.com?

### Database (Neon)
- Migration strategy: Plain SQL files, Drizzle ORM, Prisma?
- Connection management: Direct connection vs pooling
- Backup strategy
- Query optimization and indexing

### DevOps
- CI/CD: GitHub Actions, Vercel auto-deploy
- Environment strategy: dev, staging, prod (or just dev + prod for MVP)
- Secret management: Vercel environment variables, dotenv locally
- Monitoring: Vercel Analytics, Sentry for errors?

### Security
- Input validation on all endpoints (Zod schemas?)
- File upload restrictions (max size, allowed extensions)
- SQL injection prevention (parameterized queries)
- CORS configuration for production
- HTTPS enforcement (automatic with Vercel)
- GitHub token security (scoped permissions)

### GitHub Integration
- Commit message format
- Branch strategy: direct to main or create branches?
- How to handle concurrent uploads
- File conflict resolution
- Should skills be editable via web UI or only in GitHub?

---

## Success Metrics

### MVP Success
- ✅ 5+ developers upload at least one skill
- ✅ 20+ skills in the marketplace within first week
- ✅ 10+ developers install at least one skill via CLI
- ✅ Positive feedback from demo audience
- ✅ Zero major bugs in first week of use
- ✅ All skills visible and tracked in GitHub repo

### 3-Month Success
- 50+ skills published
- 3+ active projects using project-specific skills
- 50%+ of developers have installed at least one skill
- Average skill rating above 4.0
- Skills being discovered and reused across teams
- GitHub repo serves as source of truth for all skills

### 6-Month Success
- Hooks and sub-agents added to marketplace
- Integration with existing dev standards site
- PR-based approval workflow in place
- Authentication via Entra ID
- 80%+ developer adoption
- Measurable productivity improvements (survey or metrics)

---

## Open Questions & Risks

### Open Questions
1. Should we allow direct editing of skills via web UI, or require GitHub for edits?
2. Do we need a staging environment or just dev + prod?
3. Should CLI support installing to both Claude and Copilot simultaneously?
4. How do we handle skill name conflicts between global and project-specific?
5. Do we want email notifications when skills are rated or downloaded heavily?
6. Should we use GitHub branches for approval workflow or stick with direct commits for MVP?

### Risks & Mitigations

1. **Adoption** - Will developers actually use this vs continuing ad-hoc sharing?
   - **Mitigation**: Make it incredibly easy, demo frequently, incentivize early adopters, show GitHub transparency as benefit

2. **Maintenance** - Skills could become stale or incompatible with new Claude versions
   - **Mitigation**: Add version metadata, deprecation warnings, periodic audits, Git history helps track changes

3. **Security** - Malicious or poorly written skills could harm projects
   - **Mitigation**: Start with trusted internal team, add file scanning later, GitHub transparency allows peer review

4. **GitHub Rate Limits** - API limits might be hit with heavy usage
   - **Mitigation**: Authenticated requests get 5,000/hour (more than enough for 70 devs), implement exponential backoff

5. **Discoverability** - With many skills, finding the right one becomes hard
   - **Mitigation**: Good search, categorization, ratings, tagging, recommendations, can browse directly in GitHub

6. **GitHub Repo Size** - Could grow large with many skills
   - **Mitigation**: Skills are mostly small text files, implement file size limits, clean up unused skills periodically

---

## Advantages of GitHub-Based Approach

### Benefits Over Blob Storage

1. **Version Control** - Every change tracked automatically with commit history
2. **Transparency** - Everyone can see what's being shared, enables peer review
3. **Free** - No storage costs, unlimited for private repos
4. **Familiar** - Developers already use GitHub daily
5. **Backup Built-in** - GitHub handles redundancy and disaster recovery
6. **PR Workflow Ready** - Easy to add approval process later
7. **Audit Trail** - Full history of who changed what and when
8. **Easy Rollback** - Revert to previous versions via Git
9. **Clone/Backup** - Anyone can clone entire skills repo locally
10. **Search** - GitHub's built-in code search works on skills

### Implementation Notes

- Use GitHub API (Octokit) for programmatic commits
- Commit message format: `Add skill: {name}` or `Update skill: {name}` or `Fork skill: {name} to project {project}`
- Each skill gets its own folder with all files
- Database stores just metadata + GitHub path
- CLI downloads directly from GitHub (fast, reliable)

---

## Conclusion

This platform will centralize agentic development resources for Emergent Software, with special emphasis on supporting our consultancy model through **project-level skill customization**. By allowing skills to be forked and tailored to specific client needs while maintaining global company standards, we enable both consistency and flexibility.

The **simplified tech stack** (Neon + GitHub + Vercel) removes infrastructure complexity and costs, while the **GitHub-based storage** provides version control, transparency, and a familiar workflow for developers.

The phased approach (MVP → hooks/agents → MCP servers → governance) ensures we deliver value quickly while building toward a comprehensive internal developer platform.