import { createBatchUploadSchema } from '@emergent/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { AppEnv } from '../types/env.js';

const uploadRouter = new Hono<AppEnv>()
  // POST /api/upload/batch - Batch upload skills, agents, and rules
  .post('/batch', zValidator('json', createBatchUploadSchema), async (c) => {
    const service = c.get('uploadService');
    const data = c.req.valid('json');
    const result = await service.batchUpload(data);
    return c.json({ data: result }, 201);
  });

export { uploadRouter };
