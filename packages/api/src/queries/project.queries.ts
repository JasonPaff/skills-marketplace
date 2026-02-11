import { eq } from 'drizzle-orm';

import type { Database } from '../db/index.js';

import { clients, projects, projectSkills, skills } from '../db/schema.js';

export type ProjectQueries = ReturnType<typeof createProjectQueries>;

export function createProjectQueries(db: Database) {
  return {
    async insertProject(data: { clientId: string; description?: null | string; name: string }) {
      const [project] = await db.insert(projects).values(data).returning();
      return project;
    },

    async selectClientById(clientId: string) {
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
      return client;
    },

    async selectGlobalSkills() {
      return db.select().from(skills).where(eq(skills.isGlobal, true));
    },

    async selectProjectById(projectId: string) {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      return project;
    },

    async selectProjectByIdWithClient(id: string) {
      const [project] = await db
        .select({
          clientId: projects.clientId,
          clientName: clients.name,
          createdAt: projects.createdAt,
          description: projects.description,
          id: projects.id,
          isActive: projects.isActive,
          name: projects.name,
        })
        .from(projects)
        .innerJoin(clients, eq(projects.clientId, clients.id))
        .where(eq(projects.id, id));
      return project;
    },

    async selectProjectSkillsByProjectId(projectId: string) {
      return db
        .select({
          averageRating: skills.averageRating,
          category: skills.category,
          description: skills.description,
          downloadCount: skills.downloadCount,
          githubPath: skills.githubPath,
          id: skills.id,
          isCustomized: projectSkills.isCustomized,
          isGlobal: skills.isGlobal,
          name: skills.name,
          parentSkillId: skills.parentSkillId,
          ratingCount: skills.ratingCount,
          totalRating: skills.totalRating,
          uploadedAt: skills.uploadedAt,
          uploadedBy: skills.uploadedBy,
          version: skills.version,
        })
        .from(projectSkills)
        .innerJoin(skills, eq(projectSkills.skillId, skills.id))
        .where(eq(projectSkills.projectId, projectId));
    },

    async selectProjectsWithClient(clientId?: string) {
      const q = db
        .select({
          clientId: projects.clientId,
          clientName: clients.name,
          createdAt: projects.createdAt,
          description: projects.description,
          id: projects.id,
          isActive: projects.isActive,
          name: projects.name,
        })
        .from(projects)
        .innerJoin(clients, eq(projects.clientId, clients.id));

      return clientId ? q.where(eq(projects.clientId, clientId)) : q;
    },
  };
}
