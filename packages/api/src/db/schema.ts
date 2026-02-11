import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Clients ──────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

// ─── Projects ─────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  projectSkills: many(projectSkills),
}));

// ─── Skills ───────────────────────────────────────────────────────

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  githubPath: varchar("github_path", { length: 500 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 100 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  totalRating: integer("total_rating").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 })
    .default("0")
    .notNull(),
  isGlobal: boolean("is_global").default(true).notNull(),
  parentSkillId: uuid("parent_skill_id"),
  version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
});

export const skillsRelations = relations(skills, ({ one, many }) => ({
  parentSkill: one(skills, {
    fields: [skills.parentSkillId],
    references: [skills.id],
  }),
  projectSkills: many(projectSkills),
}));

// ─── Project Skills (Join Table) ──────────────────────────────────

export const projectSkills = pgTable(
  "project_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    skillId: uuid("skill_id")
      .references(() => skills.id)
      .notNull(),
    isCustomized: boolean("is_customized").default(false).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_project_skills_unique").on(table.projectId, table.skillId),
  ]
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
