import type { z } from 'zod';

import type {
  agentSchema,
  agentsQuerySchema,
  bundleSchema,
  bundlesQuerySchema,
  bundleWithItemsSchema,
  createAgentSchema,
  createBatchUploadSchema,
  createBundleSchema,
  createRuleSchema,
  createSkillSchema,
  ruleSchema,
  rulesQuerySchema,
  skillSchema,
  skillsQuerySchema,
} from './schemas.js';

// ─── Inferred Types from Schemas ──────────────────────────────────

export type Agent = z.infer<typeof agentSchema>;
export interface AgentDownloadResponse {
  agent: Agent;
  files: DownloadableFile[];
  githubPath: string;
}
export type AgentsQuery = z.infer<typeof agentsQuerySchema>;

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T;
}
export type Bundle = z.infer<typeof bundleSchema>;
export interface BundleDownloadResponse {
  bundle: Bundle;
  files: DownloadableFile[];
  githubPath: string;
}

export type BundlesQuery = z.infer<typeof bundlesQuerySchema>;
export type BundleWithItems = z.infer<typeof bundleWithItemsSchema>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type CreateBatchUpload = z.infer<typeof createBatchUploadSchema>;
export type CreateBundle = z.infer<typeof createBundleSchema>;

export type CreateRule = z.infer<typeof createRuleSchema>;

// ─── API Response Types ───────────────────────────────────────────

export type CreateSkill = z.infer<typeof createSkillSchema>;

export interface DownloadableFile {
  downloadUrl: string;
  name: string;
  path: string;
  size: number;
}
export type Rule = z.infer<typeof ruleSchema>;

export interface RuleDownloadResponse {
  files: DownloadableFile[];
  githubPath: string;
  rule: Rule;
}
export type RulesQuery = z.infer<typeof rulesQuerySchema>;

export type Skill = z.infer<typeof skillSchema>;

export interface SkillDownloadResponse {
  files: DownloadableFile[];
  githubPath: string;
  skill: Skill;
}

/** @deprecated Use `DownloadableFile` instead. Kept for backward compatibility. */
export type SkillFile = DownloadableFile;

export type SkillsQuery = z.infer<typeof skillsQuerySchema>;
