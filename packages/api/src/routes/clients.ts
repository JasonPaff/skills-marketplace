import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { AppEnv } from '../types/env.js';

import { insertClientSchema } from '../db/validation.js';

const clientsRouter = new Hono<AppEnv>();

// GET /api/clients - List all clients
clientsRouter.get('/', async (c) => {
  const service = c.get('clientService');
  const clients = await service.getClients();
  return c.json({ data: clients });
});

// POST /api/clients - Create a new client
clientsRouter.post('/', zValidator('json', insertClientSchema), async (c) => {
  const service = c.get('clientService');
  const data = c.req.valid('json');
  const client = await service.createClient(data);
  return c.json({ data: client }, 201);
});

export { clientsRouter };
