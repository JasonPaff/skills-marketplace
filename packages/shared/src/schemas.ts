import matter from 'gray-matter';
import { z } from 'zod';

import { RATING_MAX, RATING_MIN } from './constants.js';

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
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`SKILL.md frontmatter is missing required fields: ${missing}`);
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
          const decoded = typeof atob === 'function'
            ? atob(skillMd.content)
            : Buffer.from(skillMd.content, 'base64').toString('utf-8');
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
  averageRating: z.number().min(0).max(5),
  downloadCount: z.number().int().min(0),
  githubPath: z.string(),
  id: z.uuid(),
  parentSkillId: z.uuid().nullable(),
  ratingCount: z.number().int().min(0),
  totalRating: z.number().int().min(0),
  uploadedAt: z.iso.datetime(),
  version: z.string(),
});

export const rateSkillSchema = z.object({
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  userEmail: z.email(),
});

export const forkSkillSchema = z.object({
  newName: z.string().min(1).max(100).optional(),
  projectId: z.uuid(),
});

// ─── Query Schemas ────────────────────────────────────────────────

export const skillsQuerySchema = z.object({
  search: z.string().optional(),
});

export const projectsQuerySchema = z.object({
  clientId: z.uuid().optional(),
});
