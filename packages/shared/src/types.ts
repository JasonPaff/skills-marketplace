import type { z } from "zod";
import type {
  clientSchema,
  createClientSchema,
  createProjectSchema,
  createSkillSchema,
  forkSkillSchema,
  projectSchema,
  projectWithClientSchema,
  rateSkillSchema,
  skillSchema,
} from "./schemas.js";

// ─── Inferred Types from Schemas ──────────────────────────────────

export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;

export type Project = z.infer<typeof projectSchema>;
export type ProjectWithClient = z.infer<typeof projectWithClientSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;

export type Skill = z.infer<typeof skillSchema>;
export type CreateSkill = z.infer<typeof createSkillSchema>;
export type RateSkill = z.infer<typeof rateSkillSchema>;
export type ForkSkill = z.infer<typeof forkSkillSchema>;

// ─── API Response Types ───────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface SkillDownloadResponse {
  skill: Skill;
  githubPath: string;
  files: SkillFile[];
}

export interface SkillFile {
  name: string;
  path: string;
  downloadUrl: string;
  size: number;
}

export interface ProjectSkill extends Skill {
  isCustomized: boolean;
}
