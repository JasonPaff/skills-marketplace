import { z } from 'zod';

export const skillDetailParamsSchema = z.object({
  id: z.uuid(),
});
