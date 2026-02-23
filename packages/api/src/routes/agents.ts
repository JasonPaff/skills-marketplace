import { agentsQuerySchema, createAgentSchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../types/env.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const agentsRouter = new Hono<AppEnv>()
  // GET /api/agents - List agents with optional filters
  .get('/', zValidator('query', agentsQuerySchema), async (c) => {
    const service = c.get('agentService');
    const query = c.req.valid('query');
    const agents = await service.getAgents(query);
    return c.json({ data: agents });
  })
  // GET /api/agents/:id - Get single agent
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('agentService');
    const id = c.req.param('id');
    const agent = await service.getAgentById(id);
    return c.json({ data: agent });
  })
  // POST /api/agents - Create a new agent
  .post('/', zValidator('json', createAgentSchema), async (c) => {
    const service = c.get('agentService');
    const data = c.req.valid('json');
    const agent = await service.createAgent(data);
    return c.json({ data: agent }, 201);
  })
  // GET /api/agents/:id/download - Get download info and increment count
  .get('/:id/download', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('agentService');
    const id = c.req.param('id');
    const result = await service.downloadAgent(id);
    return c.json({ data: result });
  });

export { agentsRouter };
