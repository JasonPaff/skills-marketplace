import { bundlesQuerySchema, createBundleSchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../types/env.js';

const idParamSchema = z.object({ id: z.string().uuid() });

const bundlesRouter = new Hono<AppEnv>()
  // GET /api/bundles - List bundles with optional filters
  .get('/', zValidator('query', bundlesQuerySchema), async (c) => {
    const service = c.get('bundleService');
    const query = c.req.valid('query');
    const bundles = await service.getBundles(query);
    return c.json({ data: bundles });
  })
  // GET /api/bundles/:id - Get single bundle with populated items
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('bundleService');
    const id = c.req.param('id');
    const bundle = await service.getBundleById(id);
    return c.json({ data: bundle });
  })
  // POST /api/bundles - Create a new bundle
  .post('/', zValidator('json', createBundleSchema), async (c) => {
    const service = c.get('bundleService');
    const data = c.req.valid('json');
    const bundle = await service.createBundle(data);
    return c.json({ data: bundle }, 201);
  })
  // GET /api/bundles/:id/download - Get download info and increment count
  .get('/:id/download', zValidator('param', idParamSchema), async (c) => {
    const service = c.get('bundleService');
    const id = c.req.param('id');
    const result = await service.downloadBundle(id);
    return c.json({ data: result });
  });

export { bundlesRouter };
