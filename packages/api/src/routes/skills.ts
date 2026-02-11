import { createSkillSchema, forkSkillSchema, rateSkillSchema, skillsQuerySchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../types/env.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const skillsRouter = new Hono<AppEnv>()
  // GET /api/skills - List skills with optional filters
  .get('/', zValidator('query', skillsQuerySchema), async (c) => {
    const service = c.get('skillService');
    const query = c.req.valid('query');
    const skills = await service.getSkills(query);
    return c.json({ data: skills });
  })
  // GET /api/skills/:id - Get single skill
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('skillService');
    const id = c.req.param('id');
    const skill = await service.getSkillById(id);
    return c.json({ data: skill });
  })
  // POST /api/skills - Create a new skill
  .post('/', zValidator('json', createSkillSchema), async (c) => {
    const service = c.get('skillService');
    const data = c.req.valid('json');
    const skill = await service.createSkill(data);
    return c.json({ data: skill }, 201);
  })
  // GET /api/skills/:id/download - Get download info and increment count
  .get('/:id/download', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('skillService');
    const id = c.req.param('id');
    const result = await service.downloadSkill(id);
    return c.json({ data: result });
  })
  // POST /api/skills/:id/rate - Rate a skill
  .post(
    '/:id/rate',
    zValidator('param', idParamSchema),
    zValidator('json', rateSkillSchema),
    async (c) => {
      const service = c.get('skillService');
      const id = c.req.param('id');
      const { rating } = c.req.valid('json');
      const updated = await service.rateSkill(id, rating);
      return c.json({ data: updated });
    },
  )
  // POST /api/skills/:id/fork - Fork a skill to a project
  .post(
    '/:id/fork',
    zValidator('param', idParamSchema),
    zValidator('json', forkSkillSchema),
    async (c) => {
      const service = c.get('skillService');
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const forked = await service.forkSkill(id, data);
      return c.json({ data: forked }, 201);
    },
  );

export { skillsRouter };
