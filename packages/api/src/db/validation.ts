import { createSkillSchema } from '@emergent/shared';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { clients, projects, projectSkills, skills } from './schema.js';

// ─── Client Schemas ───────────────────────────────────────────────

export const insertClientSchema = createInsertSchema(clients, {
  description: (schema) => schema.max(1000),
  name: (schema) => schema.min(1),
}).omit({ createdAt: true, id: true });

export const selectClientSchema = createSelectSchema(clients);

// ─── Project Schemas ──────────────────────────────────────────────

export const insertProjectSchema = createInsertSchema(projects, {
  description: (schema) => schema.max(1000),
  name: (schema) => schema.min(1),
}).omit({ createdAt: true, id: true, isActive: true });

export const selectProjectSchema = createSelectSchema(projects);

// ─── Skill Schemas ────────────────────────────────────────────────

export const insertSkillSchema = createSkillSchema;

export const selectSkillSchema = createSelectSchema(skills);

// ─── Project Skills Schemas ───────────────────────────────────────

export const insertProjectSkillSchema = createInsertSchema(projectSkills).omit({
  addedAt: true,
  id: true,
});

export const selectProjectSkillSchema = createSelectSchema(projectSkills);
