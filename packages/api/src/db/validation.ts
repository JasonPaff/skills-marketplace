import { createSkillSchema } from '@emergent/shared';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { agents, clients, projects, projectSkills, rules, skills } from './schema.js';

const omitAgentInsertFields = {
  downloadCount: true,
  id: true,
  uploadedAt: true,
} as const;
const omitClientInsertFields = { createdAt: true, id: true } as const;
const omitProjectInsertFields = {
  createdAt: true,
  id: true,
  isActive: true,
} as const;
const omitProjectSkillInsertFields = {
  addedAt: true,
  id: true,
} as const;
const omitRuleInsertFields = {
  downloadCount: true,
  id: true,
  uploadedAt: true,
} as const;

// ─── Agent Schemas ────────────────────────────────────────────────

export const insertAgentSchema = createInsertSchema(agents, {
  description: (schema) => schema.max(500),
  name: (schema) => schema.min(1),
}).omit(omitAgentInsertFields as never);

export const selectAgentSchema = createSelectSchema(agents);

// ─── Client Schemas ───────────────────────────────────────────────

export const insertClientSchema = createInsertSchema(clients, {
  description: (schema) => schema.max(1000),
  name: (schema) => schema.min(1),
}).omit(omitClientInsertFields as never);

export const selectClientSchema = createSelectSchema(clients);

// ─── Project Schemas ──────────────────────────────────────────────

export const insertProjectSchema = createInsertSchema(projects, {
  description: (schema) => schema.max(1000),
  name: (schema) => schema.min(1),
}).omit(omitProjectInsertFields as never);

export const selectProjectSchema = createSelectSchema(projects);

// ─── Skill Schemas ────────────────────────────────────────────────

export const insertSkillSchema = createSkillSchema;

export const selectSkillSchema = createSelectSchema(skills);

// ─── Project Skills Schemas ───────────────────────────────────────

export const insertProjectSkillSchema = createInsertSchema(projectSkills).omit(
  omitProjectSkillInsertFields as never,
);

export const selectProjectSkillSchema = createSelectSchema(projectSkills);

// ─── Rule Schemas ─────────────────────────────────────────────────

export const insertRuleSchema = createInsertSchema(rules, {
  description: (schema) => schema.max(500),
  name: (schema) => schema.min(1),
}).omit(omitRuleInsertFields as never);

export const selectRuleSchema = createSelectSchema(rules);
