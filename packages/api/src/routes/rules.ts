import { createRuleSchema, rulesQuerySchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../types/env.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const rulesRouter = new Hono<AppEnv>()
  // GET /api/rules - List rules with optional filters
  .get('/', zValidator('query', rulesQuerySchema), async (c) => {
    const service = c.get('ruleService');
    const query = c.req.valid('query');
    const rules = await service.getRules(query);
    return c.json({ data: rules });
  })
  // GET /api/rules/:id - Get single rule
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('ruleService');
    const id = c.req.param('id');
    const rule = await service.getRuleById(id);
    return c.json({ data: rule });
  })
  // POST /api/rules - Create a new rule
  .post('/', zValidator('json', createRuleSchema), async (c) => {
    const service = c.get('ruleService');
    const data = c.req.valid('json');
    const rule = await service.createRule(data);
    return c.json({ data: rule }, 201);
  })
  // GET /api/rules/:id/download - Get download info and increment count
  .get('/:id/download', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('ruleService');
    const id = c.req.param('id');
    const result = await service.downloadRule(id);
    return c.json({ data: result });
  });

export { rulesRouter };
