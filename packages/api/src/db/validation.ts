import { createSkillSchema } from '@emergent/shared';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { agents, bundles, rules, skills } from './schema.js';

const omitAgentInsertFields = {
  downloadCount: true,
  id: true,
  uploadedAt: true,
} as const;
const omitBundleInsertFields = {
  downloadCount: true,
  id: true,
  uploadedAt: true,
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

// ─── Bundle Schemas ───────────────────────────────────────────────

export const insertBundleSchema = createInsertSchema(bundles, {
  description: (schema) => schema.max(500),
  name: (schema) => schema.min(1),
}).omit(omitBundleInsertFields as never);

export const selectBundleSchema = createSelectSchema(bundles);

// ─── Skill Schemas ────────────────────────────────────────────────

export const insertSkillSchema = createSkillSchema;

export const selectSkillSchema = createSelectSchema(skills);

// ─── Rule Schemas ─────────────────────────────────────────────────

export const insertRuleSchema = createInsertSchema(rules, {
  description: (schema) => schema.max(500),
  name: (schema) => schema.min(1),
}).omit(omitRuleInsertFields as never);

export const selectRuleSchema = createSelectSchema(rules);
