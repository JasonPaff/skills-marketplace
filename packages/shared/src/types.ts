import type { z } from 'zod';

import type {
  agentSchema,
  clientSchema,
  createAgentSchema,
  createBatchUploadSchema,
  createClientSchema,
  createProjectSchema,
  createRuleSchema,
  createSkillSchema,
  forkSkillSchema,
  projectSchema,
  projectWithClientSchema,
  ruleSchema,
  skillSchema,
} from './schemas.js';

// ─── Inferred Types from Schemas ──────────────────────────────────

export type Agent = z.infer<typeof agentSchema>;
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T;
}
export type Client = z.infer<typeof clientSchema>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type CreateBatchUpload = z.infer<typeof createBatchUploadSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type CreateRule = z.infer<typeof createRuleSchema>;

export type CreateSkill = z.infer<typeof createSkillSchema>;
export type ForkSkill = z.infer<typeof forkSkillSchema>;
export type Project = z.infer<typeof projectSchema>;
export interface ProjectSkill extends Skill {
  isCustomized: boolean;
}

// ─── API Response Types ───────────────────────────────────────────

export type ProjectWithClient = z.infer<typeof projectWithClientSchema>;
export type Rule = z.infer<typeof ruleSchema>;

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
