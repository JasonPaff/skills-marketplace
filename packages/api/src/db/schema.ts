import { SKILL_CATEGORIES } from '@emergent/shared';
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const skillCategoryEnum = pgEnum('skill_category', SKILL_CATEGORIES);

// ─── Clients ──────────────────────────────────────────────────────

export const clients = pgTable('clients', {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  description: text('description'),
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).unique().notNull(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

// ─── Projects ─────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  clientId: uuid('client_id')
    .references(() => clients.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  description: text('description'),
  id: uuid('id').primaryKey().defaultRandom(),
  isActive: boolean('is_active').default(true).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  projectSkills: many(projectSkills),
}));

// ─── Skills ───────────────────────────────────────────────────────

export const skills = pgTable('skills', {
  averageRating: real('average_rating').default(0).notNull(),
  category: skillCategoryEnum('category').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  githubPath: varchar('github_path', { length: 500 }).notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  isGlobal: boolean('is_global').default(true).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  parentSkillId: uuid('parent_skill_id'),
  ratingCount: integer('rating_count').default(0).notNull(),
  totalRating: integer('total_rating').default(0).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  uploadedBy: varchar('uploaded_by', { length: 100 }).notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
});

export const skillsRelations = relations(skills, ({ many, one }) => ({
  parentSkill: one(skills, {
    fields: [skills.parentSkillId],
    references: [skills.id],
  }),
  projectSkills: many(projectSkills),
}));

// ─── Project Skills (Join Table) ──────────────────────────────────

export const projectSkills = pgTable(
  'project_skills',
  {
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').primaryKey().defaultRandom(),
    isCustomized: boolean('is_customized').default(false).notNull(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    skillId: uuid('skill_id')
      .references(() => skills.id)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_project_skills_unique').on(table.projectId, table.skillId)],
);

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
  project: one(projects, {
    fields: [projectSkills.projectId],
    references: [projects.id],
  }),
  skill: one(skills, {
    fields: [projectSkills.skillId],
    references: [skills.id],
  }),
}));
