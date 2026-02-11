import { projectsQuerySchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../types/env.js';

import { insertProjectSchema } from '../db/validation.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const projectsRouter = new Hono<AppEnv>();

// GET /api/projects - List projects with optional client filter
projectsRouter.get('/', zValidator('query', projectsQuerySchema), async (c) => {
  const service = c.get('projectService');
  const query = c.req.valid('query');
  const projects = await service.getProjects(query);
  return c.json({ data: projects });
});

// GET /api/projects/:id - Get single project with client info
projectsRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const service = c.get('projectService');
  const id = c.req.param('id');
  const project = await service.getProjectById(id);
  return c.json({ data: project });
});

// GET /api/projects/:id/skills - Get all skills for a project
projectsRouter.get('/:id/skills', zValidator('param', idParamSchema), async (c) => {
  const service = c.get('projectService');
  const id = c.req.param('id');
  const skills = await service.getProjectSkills(id);
  return c.json({ data: skills });
});

// POST /api/projects - Create a new project
projectsRouter.post('/', zValidator('json', insertProjectSchema), async (c) => {
  const service = c.get('projectService');
  const data = c.req.valid('json');
  const project = await service.createProject(data);
  return c.json({ data: project }, 201);
});

export { projectsRouter };
