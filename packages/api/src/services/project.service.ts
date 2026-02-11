import type { z } from 'zod';

import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

import type { Database } from '../db/index.js';

import { clients, projects, projectSkills, skills } from '../db/schema.js';
import { insertProjectSchema } from '../db/validation.js';

export type ProjectService = ReturnType<typeof createProjectService>;

type CreateProjectData = z.infer<typeof insertProjectSchema>;

export function createProjectService(db: Database) {
  return {
    async createProject(data: CreateProjectData) {
      const { clientId, description, name } = data;

      // Verify client exists
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
      if (!client) {
        throw new HTTPException(404, { message: 'Client not found' });
      }

      const [project] = await db
        .insert(projects)
        .values({ clientId, description, name })
        .returning();
      return project;
    },

    async getProjectById(id: string) {
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

      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      return project;
    },

    async getProjects(query?: { clientId?: string }) {
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

      const results = query?.clientId
        ? await q.where(eq(projects.clientId, query.clientId))
        : await q;

      return results;
    },

    async getProjectSkills(projectId: string) {
      // Verify project exists
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      // Get project-specific skills
      const projectSpecificSkills = await db
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

      // Get all global skills (inherited by all projects)
      const globalSkills = await db.select().from(skills).where(eq(skills.isGlobal, true));

      // Merge: project-specific skills override global skills with the same name
      const projectSkillNames = new Set(projectSpecificSkills.map((s) => s.name));
      const inheritedGlobal = globalSkills
        .filter((s) => !projectSkillNames.has(s.name))
        .map((s) => ({ ...s, isCustomized: false }));

      return [...projectSpecificSkills, ...inheritedGlobal];
    },
  };
}
