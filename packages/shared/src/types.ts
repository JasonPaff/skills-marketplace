import type { z } from 'zod';

import type {
  clientSchema,
  createClientSchema,
  createProjectSchema,
  createSkillSchema,
  forkSkillSchema,
  projectSchema,
  projectWithClientSchema,
  skillSchema,
} from './schemas.js';

// ─── Inferred Types from Schemas ──────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
export interface ApiResponse<T> {
  data: T;
}

export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;

export type CreateSkill = z.infer<typeof createSkillSchema>;
export type ForkSkill = z.infer<typeof forkSkillSchema>;
export type Project = z.infer<typeof projectSchema>;
export interface ProjectSkill extends Skill {
  isCustomized: boolean;
}

// ─── API Response Types ───────────────────────────────────────────

export type ProjectWithClient = z.infer<typeof projectWithClientSchema>;

export type Skill = z.infer<typeof skillSchema>;

export interface SkillDownloadResponse {
  files: SkillFile[];
  githubPath: string;
  skill: Skill;
}

export interface SkillFile {
  downloadUrl: string;
  name: string;
  path: string;
  size: number;
}
