import { forkSkillSchema, rateSkillSchema, skillsQuerySchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { Database } from '../db/index.js';
import type { GitHubClient } from '../lib/github.js';

import { projects, projectSkills, skills } from '../db/schema.js';
import { insertSkillSchema } from '../db/validation.js';

type Env = {
  Variables: {
    db: Database;
    github: GitHubClient;
  };
};

const skillsRouter = new Hono<Env>();

const idParamSchema = z.object({ id: z.string().uuid() });

// GET /api/skills - List skills with optional filters
skillsRouter.get('/', zValidator('query', skillsQuerySchema), async (c) => {
  const { category, isGlobal, search } = c.req.valid('query');
  const db = c.get('db');

  const conditions = [];

  if (search) {
    conditions.push(ilike(skills.name, `%${search}%`));
  }
  if (category) {
    conditions.push(eq(skills.category, category));
  }
  if (isGlobal !== undefined) {
    conditions.push(eq(skills.isGlobal, isGlobal));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db.select().from(skills).where(where).orderBy(skills.name);

  return c.json({ data: results });
});

// GET /api/skills/:id - Get single skill
skillsRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const db = c.get('db');
  const { id } = c.req.valid('param');

  const [skill] = await db.select().from(skills).where(eq(skills.id, id));

  if (!skill) {
    throw new HTTPException(404, { message: 'Skill not found' });
  }

  return c.json({ data: skill });
});

// POST /api/skills - Create a new skill
skillsRouter.post('/', zValidator('json', insertSkillSchema), async (c) => {
  // NOTE: File upload handling (multipart/form-data) will be implemented
  // when building out the full endpoint. This handles the metadata portion.
  const db = c.get('db');

  const { category, description, isGlobal, name, projectId, uploadedBy } = c.req.valid('json');

  // Determine GitHub path
  let githubPath: string;
  if (isGlobal) {
    githubPath = `skills/global/${name}`;
  } else {
    // Look up project slug
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId!));

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' });
    }

    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    githubPath = `skills/projects/${projectSlug}/${name}`;
  }

  // TODO: Commit files to GitHub via github.commitFiles()

  // Insert metadata into database
  const [skill] = await db
    .insert(skills)
    .values({
      category,
      description,
      githubPath,
      isGlobal,
      name,
      uploadedBy,
    })
    .returning();

  // If project-specific, create project_skills entry
  if (!isGlobal && projectId) {
    await db.insert(projectSkills).values({
      isCustomized: false,
      projectId,
      skillId: skill.id,
    });
  }

  return c.json({ data: skill }, 201);
});

// GET /api/skills/:id/download - Get download info and increment count
skillsRouter.get('/:id/download', zValidator('param', idParamSchema), async (c) => {
  const db = c.get('db');
  const github = c.get('github');
  const { id } = c.req.valid('param');

  const [skill] = await db.select().from(skills).where(eq(skills.id, id));

  if (!skill) {
    throw new HTTPException(404, { message: 'Skill not found' });
  }

  // Increment download count
  await db
    .update(skills)
    .set({ downloadCount: sql`${skills.downloadCount} + 1` })
    .where(eq(skills.id, id));

  // Fetch file listing from GitHub
  const files = await github.listFiles(skill.githubPath);

  return c.json({
    data: {
      files,
      githubPath: skill.githubPath,
      skill,
    },
  });
});

// POST /api/skills/:id/rate - Rate a skill
skillsRouter.post(
  '/:id/rate',
  zValidator('param', idParamSchema),
  zValidator('json', rateSkillSchema),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const { rating } = c.req.valid('json');

    const [skill] = await db.select().from(skills).where(eq(skills.id, id));

    if (!skill) {
      throw new HTTPException(404, { message: 'Skill not found' });
    }

    const newTotalRating = skill.totalRating + rating;
    const newRatingCount = skill.ratingCount + 1;
    const newAverageRating = (newTotalRating / newRatingCount).toFixed(2);

    const [updated] = await db
      .update(skills)
      .set({
        averageRating: newAverageRating,
        ratingCount: newRatingCount,
        totalRating: newTotalRating,
      })
      .where(eq(skills.id, id))
      .returning();

    return c.json({ data: updated });
  },
);

// POST /api/skills/:id/fork - Fork a skill to a project
skillsRouter.post(
  '/:id/fork',
  zValidator('param', idParamSchema),
  zValidator('json', forkSkillSchema),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const { newName, projectId } = c.req.valid('json');

    // Get original skill
    const [original] = await db.select().from(skills).where(eq(skills.id, id));

    if (!original) {
      throw new HTTPException(404, { message: 'Skill not found' });
    }

    // Get project
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' });
    }

    const skillName = newName ?? original.name;
    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    const githubPath = `skills/projects/${projectSlug}/${skillName}`;

    // TODO: Copy files from original.githubPath to new githubPath via GitHub API

    // Create new skill record
    const [forked] = await db
      .insert(skills)
      .values({
        category: original.category,
        description: original.description,
        githubPath,
        isGlobal: false,
        name: skillName,
        parentSkillId: original.id,
        uploadedBy: original.uploadedBy,
        version: original.version,
      })
      .returning();

    // Create project_skills entry
    await db.insert(projectSkills).values({
      isCustomized: true,
      projectId,
      skillId: forked.id,
    });

    return c.json({ data: forked }, 201);
  },
);

export { skillsRouter };
