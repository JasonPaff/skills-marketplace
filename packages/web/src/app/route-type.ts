import { z } from 'zod';

export const Route = {
  searchParams: z.object({
    downloads: z.coerce.number().int().optional(),
    search: z.string().optional(),
  }),
};

export type RouteType = typeof Route;
