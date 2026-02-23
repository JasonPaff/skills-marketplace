import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Agents ──────────────────────────────────────────────────────

export const agents = pgTable('agents', {
  color: varchar('color', { length: 50 }),
  description: varchar('description', { length: 500 }).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  githubPath: varchar('github_path', { length: 500 }).notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  model: varchar('model', { length: 100 }),
  name: varchar('name', { length: 100 }).notNull(),
  tools: text('tools').array(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ many }) => ({
  bundleAgents: many(bundleAgents),
}));

// ─── Rules ───────────────────────────────────────────────────────

export const rules = pgTable('rules', {
  description: varchar('description', { length: 500 }).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  githubPath: varchar('github_path', { length: 500 }).notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  paths: text('paths').array(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rulesRelations = relations(rules, ({ many }) => ({
  bundleRules: many(bundleRules),
}));

// ─── Skills ───────────────────────────────────────────────────────

export const skills = pgTable('skills', {
  description: varchar('description', { length: 500 }).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  githubPath: varchar('github_path', { length: 500 }).notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
});

export const skillsRelations = relations(skills, ({ many }) => ({
  bundleSkills: many(bundleSkills),
}));

// ─── Bundles ──────────────────────────────────────────────────────

export const bundles = pgTable('bundles', {
  description: varchar('description', { length: 500 }).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  githubPath: varchar('github_path', { length: 500 }).notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bundlesRelations = relations(bundles, ({ many }) => ({
  bundleAgents: many(bundleAgents),
  bundleRules: many(bundleRules),
  bundleSkills: many(bundleSkills),
}));

// ─── Bundle Join Tables ──────────────────────────────────────────

export const bundleSkills = pgTable(
  'bundle_skills',
  {
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bundleId, table.skillId] }),
  }),
);

export const bundleSkillsRelations = relations(bundleSkills, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleSkills.bundleId],
    references: [bundles.id],
  }),
  skill: one(skills, {
    fields: [bundleSkills.skillId],
    references: [skills.id],
  }),
}));

export const bundleAgents = pgTable(
  'bundle_agents',
  {
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id),
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bundleId, table.agentId] }),
  }),
);

export const bundleAgentsRelations = relations(bundleAgents, ({ one }) => ({
  agent: one(agents, {
    fields: [bundleAgents.agentId],
    references: [agents.id],
  }),
  bundle: one(bundles, {
    fields: [bundleAgents.bundleId],
    references: [bundles.id],
  }),
}));

export const bundleRules = pgTable(
  'bundle_rules',
  {
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bundleId, table.ruleId] }),
  }),
);

export const bundleRulesRelations = relations(bundleRules, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleRules.bundleId],
    references: [bundles.id],
  }),
  rule: one(rules, {
    fields: [bundleRules.ruleId],
    references: [rules.id],
  }),
}));
