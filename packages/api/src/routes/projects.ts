import { createProjectSchema, projectsQuerySchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import type { Database } from '../db/index.js';

import { clients, projects, projectSkills, skills } from '../db/schema.js';

type Env = {
  Variables: {
    db: Database;
  };
};

const projectsRouter = new Hono<Env>();

// GET /api/projects - List projects with optional client filter
projectsRouter.get('/', zValidator('query', projectsQuerySchema), async (c) => {
  const { clientId } = c.req.valid('query');
  const db = c.get('db');

  const query = db
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

  const results = clientId ? await query.where(eq(projects.clientId, clientId)) : await query;

  return c.json({ data: results });
});

// GET /api/projects/:id - Get single project with client info
projectsRouter.get('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

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
    return c.json({ error: 'Not found', message: 'Project not found', statusCode: 404 }, 404);
  }

  return c.json({ data: project });
});

// GET /api/projects/:id/skills - Get all skills for a project
projectsRouter.get('/:id/skills', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

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
    .where(eq(projectSkills.projectId, id));

  // Get all global skills (inherited by all projects)
  const globalSkills = await db.select().from(skills).where(eq(skills.isGlobal, true));

  // Merge: project-specific skills override global skills with the same name
  const projectSkillNames = new Set(projectSpecificSkills.map((s) => s.name));
  const inheritedGlobal = globalSkills
    .filter((s) => !projectSkillNames.has(s.name))
    .map((s) => ({ ...s, isCustomized: false }));

  return c.json({
    data: [...projectSpecificSkills, ...inheritedGlobal],
  });
});

// POST /api/projects - Create a new project
projectsRouter.post('/', zValidator('json', createProjectSchema), async (c) => {
  const db = c.get('db');
  const { clientId, description, name } = c.req.valid('json');

  // Verify client exists
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) {
    return c.json({ error: 'Not found', message: 'Client not found', statusCode: 404 }, 404);
  }

  const [project] = await db.insert(projects).values({ clientId, description, name }).returning();

  return c.json({ data: project }, 201);
});

export { projectsRouter };
