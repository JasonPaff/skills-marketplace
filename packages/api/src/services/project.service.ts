import type { z } from 'zod';

import { HTTPException } from 'hono/http-exception';

import type { ProjectQueries } from '../queries/index.js';

import { insertProjectSchema } from '../db/validation.js';

export type ProjectService = ReturnType<typeof createProjectService>;

type CreateProjectData = z.infer<typeof insertProjectSchema>;

export function createProjectService(queries: ProjectQueries) {
  return {
    async createProject(data: CreateProjectData) {
      const { clientId, description, name } = data;

      // Verify client exists
      const client = await queries.selectClientById(clientId);
      if (!client) {
        throw new HTTPException(404, { message: 'Client not found' });
      }

      const project = await queries.insertProject({ clientId, description, name });
      return project;
    },

    async getProjectById(id: string) {
      const project = await queries.selectProjectByIdWithClient(id);

      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      return project;
    },

    async getProjects(query?: { clientId?: string }) {
      const results = await queries.selectProjectsWithClient(query?.clientId);
      return results;
    },

    async getProjectSkills(projectId: string) {
      // Verify project exists
      const project = await queries.selectProjectById(projectId);
      if (!project) {
        throw new HTTPException(404, { message: 'Project not found' });
      }

      // Get project-specific skills
      const projectSpecificSkills = await queries.selectProjectSkillsByProjectId(projectId);

      // Get all global skills (inherited by all projects)
      const globalSkills = await queries.selectGlobalSkills();

      // Merge: project-specific skills override global skills with the same name
      const projectSkillNames = new Set(projectSpecificSkills.map((s) => s.name));
      const inheritedGlobal = globalSkills
        .filter((s) => !projectSkillNames.has(s.name))
        .map((s) => ({ ...s, isCustomized: false }));

      return [...projectSpecificSkills, ...inheritedGlobal];
    },
  };
}
