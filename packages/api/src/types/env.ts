import type { Database } from '../db/index.js';
import type { GitHubClient } from '../lib/github.js';
import type { ClientService, ProjectService, SkillService } from '../services/index.js';

/**
 * Consolidated Hono environment type for the API.
 *
 * - **Bindings** – environment variables injected by the platform (Vercel, Cloudflare, etc.)
 * - **Variables** – per-request values set via `c.set()` in middleware
 */
export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_TOKEN: string;
    NODE_ENV?: string;
    WEB_URL?: string;
  };
  Variables: {
    clientService: ClientService;
    db: Database;
    github: GitHubClient;
    projectService: ProjectService;
    skillService: SkillService;
  };
};
