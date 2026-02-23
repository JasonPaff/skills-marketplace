import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
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

export const agentsRelations = relations(agents, () => ({}));

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

export const rulesRelations = relations(rules, () => ({}));

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

export const skillsRelations = relations(skills, () => ({}));
