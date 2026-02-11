import { z } from 'zod';

import { RATING_MAX, RATING_MIN, SKILL_CATEGORIES } from './constants.js';

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

// ─── Skill Schemas ────────────────────────────────────────────────

export const skillFileSchema = z.object({
  content: z.string().min(1),
  path: z.string().min(1),
});

export const createSkillSchema = z.object({
  category: z.enum(SKILL_CATEGORIES),
  description: z.string().min(1).max(500),
  files: z
    .array(skillFileSchema)
    .min(1)
    .refine((files) => files.some((f) => f.path === 'SKILL.md'), {
      message: 'A SKILL.md file is required',
    }),
  isGlobal: z.boolean(),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Skill name must be lowercase alphanumeric with hyphens'),
  projectId: z.uuid().nullable().optional(),
  uploadedBy: z.string().min(1).max(100),
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
  category: z.enum(SKILL_CATEGORIES).optional(),
  isGlobal: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  projectId: z.uuid().optional(),
  search: z.string().optional(),
});

export const projectsQuerySchema = z.object({
  clientId: z.uuid().optional(),
});
