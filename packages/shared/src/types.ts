import type { z } from 'zod';

import type {
  agentSchema,
  createAgentSchema,
  createBatchUploadSchema,
  createRuleSchema,
  createSkillSchema,
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
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type CreateBatchUpload = z.infer<typeof createBatchUploadSchema>;
export type CreateRule = z.infer<typeof createRuleSchema>;

export type CreateSkill = z.infer<typeof createSkillSchema>;

// ─── API Response Types ───────────────────────────────────────────

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
