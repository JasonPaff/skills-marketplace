import { createClientSchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { Database } from '../db/index.js';

import { clients } from '../db/schema.js';

type Env = {
  Variables: {
    db: Database;
  };
};

const clientsRouter = new Hono<Env>();

// GET /api/clients - List all clients
clientsRouter.get('/', async (c) => {
  const db = c.get('db');
  const results = await db.select().from(clients).orderBy(clients.name);
  return c.json({ data: results });
});

// POST /api/clients - Create a new client
clientsRouter.post('/', zValidator('json', createClientSchema), async (c) => {
  const db = c.get('db');
  const { description, name } = c.req.valid('json');

  const [client] = await db.insert(clients).values({ description, name }).returning();

  return c.json({ data: client }, 201);
});

export { clientsRouter };
