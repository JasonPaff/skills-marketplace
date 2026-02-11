import { z } from "zod";
import { SKILL_CATEGORIES, RATING_MIN, RATING_MAX } from "./constants.js";

// ─── Client Schemas ───────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
});

export const clientSchema = createClientSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
});

// ─── Project Schemas ──────────────────────────────────────────────

export const createProjectSchema = z.object({
  clientId: z.uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
});

export const projectSchema = createProjectSchema.extend({
  id: z.uuid(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const projectWithClientSchema = projectSchema.extend({
  clientName: z.string(),
});

// ─── Skill Schemas ────────────────────────────────────────────────

export const createSkillSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Skill name must be lowercase alphanumeric with hyphens"),
  description: z.string().min(1).max(500),
  category: z.enum(SKILL_CATEGORIES),
  isGlobal: z.boolean(),
  projectId: z.uuid().nullable().optional(),
  uploadedBy: z.string().min(1).max(100),
});

export const skillSchema = createSkillSchema.extend({
  id: z.uuid(),
  githubPath: z.string(),
  uploadedAt: z.iso.datetime(),
  downloadCount: z.number().int().min(0),
  totalRating: z.number().int().min(0),
  ratingCount: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  parentSkillId: z.uuid().nullable(),
  version: z.string(),
});

export const rateSkillSchema = z.object({
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  userEmail: z.email(),
});

export const forkSkillSchema = z.object({
  projectId: z.uuid(),
  newName: z.string().min(1).max(100).optional(),
});

// ─── Query Schemas ────────────────────────────────────────────────

export const skillsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(SKILL_CATEGORIES).optional(),
  projectId: z.uuid().optional(),
  isGlobal: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export const projectsQuerySchema = z.object({
  clientId: z.uuid().optional(),
});
