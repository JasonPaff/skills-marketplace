import matter from 'gray-matter';
import { z } from 'zod';

// ─── Client Schemas ───────────────────────────────────────────────

export const createClientSchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  name: z.string().min(1).max(200),
});

export const clientSchema = createClientSchema.extend({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});

// ─── Project Schemas ──────────────────────────────────────────────

export const createProjectSchema = z.object({
  clientId: z.uuid(),
  description: z.string().max(1000).nullable().optional(),
  name: z.string().min(1).max(200),
});

export const projectSchema = createProjectSchema.extend({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
  isActive: z.boolean(),
});

export const projectWithClientSchema = projectSchema.extend({
  clientName: z.string(),
});

// ─── SKILL.md Frontmatter ─────────────────────────────────────────

export const skillMdFrontmatterSchema = z.object({
  description: z.string().min(1),
  name: z.string().min(1),
});

export interface ParsedSkillMd {
  body: string;
  frontmatter: z.infer<typeof skillMdFrontmatterSchema>;
}

/**
 * Parse a SKILL.md file content string, extracting and validating YAML frontmatter.
 * Returns the parsed frontmatter and markdown body, or throws with a descriptive message.
 */
export function parseSkillMd(content: string): ParsedSkillMd {
  if (!content.trimStart().startsWith('---')) {
    throw new Error('SKILL.md is missing YAML frontmatter (must start with ---)');
  }

  const { content: body, data } = matter(content);
  const result = skillMdFrontmatterSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`SKILL.md frontmatter validation failed: ${issues}`);
  }

  return { body, frontmatter: result.data };
}

// ─── AGENT.md Frontmatter ────────────────────────────────────────

export const agentMdFrontmatterSchema = z.object({
  color: z.string().nullable().optional(),
  description: z.string().min(1),
  model: z.string().nullable().optional(),
  name: z.string().min(1),
  tools: z.preprocess(
    (val) => {
      if (val == null) return undefined;
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return val;
    },
    z.array(z.string()).optional(),
  ),
});

export interface ParsedAgentMd {
  body: string;
  frontmatter: z.infer<typeof agentMdFrontmatterSchema>;
}

/**
 * Parse an AGENT.md file content string, extracting and validating YAML frontmatter.
 * Returns the parsed frontmatter and markdown body, or throws with a descriptive message.
 */
export function parseAgentMd(content: string): ParsedAgentMd {
  if (!content.trimStart().startsWith('---')) {
    throw new Error('AGENT.md is missing YAML frontmatter (must start with ---)');
  }

  const { content: body, data } = matter(content);
  const result = agentMdFrontmatterSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`AGENT.md frontmatter validation failed: ${issues}`);
  }

  return { body, frontmatter: result.data };
}

// ─── RULE.md Frontmatter ─────────────────────────────────────────

export const ruleMdFrontmatterSchema = z.object({
  description: z.string().min(1),
  name: z.string().min(1),
  paths: z.preprocess(
    (val) => {
      if (val == null) return undefined;
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return val;
    },
    z.array(z.string()).optional(),
  ),
});

export interface ParsedRuleMd {
  body: string;
  frontmatter: z.infer<typeof ruleMdFrontmatterSchema>;
}

/**
 * Parse a RULE.md file content string, extracting and validating YAML frontmatter.
 * Returns the parsed frontmatter and markdown body, or throws with a descriptive message.
 */
export function parseRuleMd(content: string): ParsedRuleMd {
  if (!content.trimStart().startsWith('---')) {
    throw new Error('RULE.md is missing YAML frontmatter (must start with ---)');
  }

  const { content: body, data } = matter(content);
  const result = ruleMdFrontmatterSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`RULE.md frontmatter validation failed: ${issues}`);
  }

  return { body, frontmatter: result.data };
}

// ─── Skill Schemas ────────────────────────────────────────────────

export const skillFileSchema = z.object({
  content: z.string().min(1),
  path: z.string().min(1),
});

export const createSkillSchema = z.object({
  description: z.string().min(1).max(500),
  files: z
    .array(skillFileSchema)
    .min(1)
    .refine((files) => files.some((f) => f.path === 'SKILL.md'), {
      message: 'A SKILL.md file is required',
    })
    .refine(
      (files) => {
        const skillMd = files.find((f) => f.path === 'SKILL.md');
        if (!skillMd) return true; // handled by the refine above
        try {
          const decoded = atob(skillMd.content);
          parseSkillMd(decoded);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'SKILL.md must contain valid YAML frontmatter with name and description',
      },
    ),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Skill name must be lowercase alphanumeric with hyphens'),
});

export const skillSchema = createSkillSchema.omit({ files: true }).extend({
  downloadCount: z.number().int().min(0),
  githubPath: z.string(),
  id: z.uuid(),
  parentSkillId: z.uuid().nullable(),
  uploadedAt: z.iso.datetime(),
  version: z.string(),
});

export const forkSkillSchema = z.object({
  newName: z.string().min(1).max(100).optional(),
  projectId: z.uuid(),
});

// ─── Agent Schemas ───────────────────────────────────────────────

export const agentFileSchema = z.object({
  content: z.string().min(1),
  path: z.string().min(1),
});

export const createAgentSchema = z.object({
  description: z.string().min(1).max(500),
  files: z
    .array(agentFileSchema)
    .min(1)
    .refine((files) => files.some((f) => f.path.endsWith('.md')), {
      message: 'At least one .md file is required',
    })
    .refine(
      (files) => {
        const mdFile = files.find((f) => f.path.endsWith('.md'));
        if (!mdFile) return true; // handled by the refine above
        try {
          const decoded = atob(mdFile.content);
          parseAgentMd(decoded);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Agent .md file must contain valid YAML frontmatter with name and description',
      },
    ),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Agent name must be lowercase alphanumeric with hyphens'),
});

export const agentSchema = createAgentSchema.omit({ files: true }).extend({
  color: z.string().nullable().optional(),
  downloadCount: z.number().int().min(0),
  githubPath: z.string(),
  id: z.uuid(),
  model: z.string().nullable().optional(),
  tools: z.array(z.string()).optional(),
  uploadedAt: z.iso.datetime(),
});

// ─── Rule Schemas ────────────────────────────────────────────────

export const ruleFileSchema = z.object({
  content: z.string().min(1),
  path: z.string().min(1),
});

export const createRuleSchema = z.object({
  description: z.string().min(1).max(500),
  files: z
    .array(ruleFileSchema)
    .min(1)
    .refine((files) => files.some((f) => f.path.endsWith('.md')), {
      message: 'At least one .md file is required',
    })
    .refine(
      (files) => {
        const mdFile = files.find((f) => f.path.endsWith('.md'));
        if (!mdFile) return true; // handled by the refine above
        try {
          const decoded = atob(mdFile.content);
          parseRuleMd(decoded);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Rule .md file must contain valid YAML frontmatter with name and description',
      },
    ),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Rule name must be lowercase alphanumeric with hyphens'),
});

export const ruleSchema = createRuleSchema.omit({ files: true }).extend({
  downloadCount: z.number().int().min(0),
  githubPath: z.string(),
  id: z.uuid(),
  paths: z.array(z.string()).optional(),
  uploadedAt: z.iso.datetime(),
});

// ─── Batch Upload Schema ─────────────────────────────────────────

export const createBatchUploadSchema = z
  .object({
    agents: z.array(createAgentSchema).optional(),
    rules: z.array(createRuleSchema).optional(),
    skills: z.array(createSkillSchema).optional(),
  })
  .refine(
    (data) =>
      (data.skills?.length ?? 0) + (data.agents?.length ?? 0) + (data.rules?.length ?? 0) > 0,
    {
      message: 'At least one skill, agent, or rule must be provided',
    },
  );

// ─── Query Schemas ────────────────────────────────────────────────

export const skillsQuerySchema = z.object({
  search: z.string().optional(),
});

export const projectsQuerySchema = z.object({
  clientId: z.uuid().optional(),
});
